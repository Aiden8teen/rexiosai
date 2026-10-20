import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommunityReactionKind, Prisma } from '@prisma/client';
import { Account, PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AcceptedAnswerDto, CommunityListDto, CommunityPageDto, CreateAnswerDto, CreateQuestionDto } from './community.dto';
import { answerInclude, communityAuthor, presentAnswer, presentQuestion, publicAuthorSelect, questionInclude, reactionCounts } from './community-presenter';
@Injectable()
export class CommunityService {
  constructor(private readonly db: PrismaService, private readonly notifications: NotificationsService) { }
  async list(query: CommunityListDto, viewer?: string) {
    const where: Prisma.CommunityQuestionWhereInput = { ...(query.tag ? { tags: { has: query.tag } } : {}), ...(query.sort === 'unanswered' ? { answers: { none: {} } } : {}), ...(query.q ? { OR: [...['title', 'titleEn', 'body', 'bodyEn'].map(key => ({ [key]: { contains: query.q, mode: 'insensitive' } })), { tags: { has: query.q } }] } : {}) };
    const [items, total] = await this.db.$transaction([this.db.communityQuestion.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: [query.sort === 'active' ? { lastActivityAt: 'desc' } : { createdAt: 'desc' }, { id: 'desc' }], include: questionInclude }), this.db.communityQuestion.count({ where })]);
    return { items: items.map(q => presentQuestion(q, viewer)), total, page: query.page, limit: query.limit };
  }
  async detail(id: string, viewer?: string) {
    const q = await this.db.communityQuestion.findUnique({ where: { id }, include: questionInclude });
    if (!q)
      throw new NotFoundException('Question not found.');
    return presentQuestion(q, viewer, true);
  }
  async answers(id: string, query: CommunityPageDto, viewer?: string) {
    await this.detail(id);
    const [items, total] = await this.db.$transaction([this.db.communityAnswer.findMany({ where: { questionId: id }, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }], include: answerInclude }), this.db.communityAnswer.count({ where: { questionId: id } })]);
    return { items: items.map(a => presentAnswer(a, viewer)), total, page: query.page, limit: query.limit };
  }
  async create(user: Account, input: CreateQuestionDto) {
    const q = await this.db.communityQuestion.create({ data: { authorUserId: user.id, ...(input.language === 'ar' ? { title: input.title, body: input.body } : { titleEn: input.title, bodyEn: input.body }), tags: input.tags, codeSnippet: input.codeSnippet }, include: questionInclude });
    return presentQuestion(q, user.id, true);
  }
  async addAnswer(user: Account, id: string, input: CreateAnswerDto) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw `SELECT id FROM "CommunityQuestion" WHERE id = ${id} FOR UPDATE`;
      const q = await tx.communityQuestion.findUnique({ where: { id } });
      if (!q)
        throw new NotFoundException();
      const a = await tx.communityAnswer.create({ data: { questionId: id, authorUserId: user.id, ...(input.language === 'ar' ? { body: input.body } : { bodyEn: input.body }) }, include: answerInclude });
      await tx.communityQuestion.update({ where: { id }, data: { lastActivityAt: new Date() } });
      await this.notifications.record(tx, [{ actorUserId: user.id, recipientUserId: q.authorUserId, type: 'COMMUNITY_ANSWER', eventKey: `answer:${a.id}`, questionId: id, answerId: a.id }]);
      return presentAnswer(a, user.id);
    });
  }
  async reaction(user: Account, id: string, kind: string, enabled: boolean, target: 'question' | 'answer') {
    if (!['helpful', 'insight'].includes(kind))
      throw new BadRequestException('Unknown reaction.');
    const value = kind.toUpperCase() as CommunityReactionKind;
    const parent = target === 'question' ? await this.db.communityQuestion.findUnique({ where: { id } }) : await this.db.communityAnswer.findUnique({ where: { id } });
    if (!parent)
      throw new NotFoundException();
    if (parent.authorUserId === user.id)
      throw new BadRequestException('You cannot react to your own post.');
    const data = { targetId: id, userId: user.id, kind: value };
    if (target === 'question') {
      if (enabled)
        await this.db.communityQuestionReaction.createMany({ data: [data], skipDuplicates: true });
      else
        await this.db.communityQuestionReaction.deleteMany({ where: data });
      return reactionCounts(await this.db.communityQuestionReaction.findMany({ where: { targetId: id } }), user.id);
    }
    if (enabled)
      await this.db.communityAnswerReaction.createMany({ data: [data], skipDuplicates: true });
    else
      await this.db.communityAnswerReaction.deleteMany({ where: data });
    return reactionCounts(await this.db.communityAnswerReaction.findMany({ where: { targetId: id } }), user.id);
  }
  async selectAnswer(user: Account, id: string, input: AcceptedAnswerDto) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw `SELECT id FROM "CommunityQuestion" WHERE id = ${id} FOR UPDATE`;
      const q = await tx.communityQuestion.findUnique({ where: { id } });
      if (!q)
        throw new NotFoundException();
      if (q.authorUserId !== user.id)
        throw new ForbiddenException('Only the question author can select an answer.');
      const a = input.answerId ? await tx.communityAnswer.findFirst({ where: { id: input.answerId, questionId: id } }) : null;
      if (input.answerId && !a)
        throw new NotFoundException('Answer not found on this question.');
      const result = await tx.communityQuestion.update({ where: { id }, data: { acceptedAnswerId: input.answerId }, include: questionInclude });
      if (a && q.acceptedAnswerId !== a.id)
        await this.notifications.record(tx, [{ actorUserId: user.id, recipientUserId: a.authorUserId, type: 'ANSWER_ACCEPTED', eventKey: `accepted:${id}:${a.id}`, questionId: id, answerId: a.id }]);
      return presentQuestion(result, user.id, true);
    });
  }
  async view(id: string, viewerKey: string) {
    await this.detail(id);
    await this.db.communityQuestionView.createMany({ data: [{ questionId: id, viewerKey }], skipDuplicates: true });
    return { views: await this.db.communityQuestionView.count({ where: { questionId: id } }) };
  }
  async overview() {
    const [contributors, questions] = await Promise.all([this.db.communityAnswer.groupBy({ by: ['authorUserId'], _count: { _all: true } }), this.db.communityQuestion.findMany({ select: { tags: true, acceptedAnswer: { select: { authorUserId: true } } } })]);
    const accepted = new Map<string, number>(), tags = new Map<string, number>();
    for (const q of questions) {
      if (q.acceptedAnswer)
        accepted.set(q.acceptedAnswer.authorUserId, (accepted.get(q.acceptedAnswer.authorUserId) || 0) + 1);
      for (const tag of q.tags)
        tags.set(tag, (tags.get(tag) || 0) + 1);
    }
    const top = contributors.map(c => ({ id: c.authorUserId, answerCount: c._count._all, acceptedAnswerCount: accepted.get(c.authorUserId) || 0 })).sort((a, b) => b.answerCount - a.answerCount || b.acceptedAnswerCount - a.acceptedAnswerCount || a.id.localeCompare(b.id)).slice(0, 3);
    const authors = await this.db.user.findMany({ where: { id: { in: top.map(t => t.id) } }, select: publicAuthorSelect });
    return { contributors: top.map(c => ({ author: communityAuthor(authors.find(a => a.id === c.id)!), answerCount: c.answerCount, acceptedAnswerCount: c.acceptedAnswerCount })), popularTags: [...tags].map(([tag, questionCount]) => ({ tag, questionCount })).sort((a, b) => b.questionCount - a.questionCount || a.tag.localeCompare(b.tag)).slice(0, 6) };
  }
}
