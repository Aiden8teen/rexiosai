import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Problem } from '@prisma/client';
import { Account, PrismaService } from '../database/prisma.service';
import { requireRole } from '../common/http';
import { ListDto, ProblemDto } from './problem.dto';
import { presentProblem, problemInclude } from './problem-presenter';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProblemsService {
  constructor(private readonly db: PrismaService, private readonly notifications: NotificationsService) {}
  async owned(user: Account, id: string) {
    requireRole(user, 'COMPANY');
    const problem = await this.db.problem.findFirst({ where: { id, companyUserId: user.id }, include: { privateDetails: true, _count: { select: { applications: { where: { status: { not: 'DRAFT' } } } } }, files: { select: { id: true, originalName: true, purpose: true, byteSize: true } } } });
    if (!problem) throw new NotFoundException('Problem not found.');
    const { privateDetails, _count, ...data } = problem;
    return { ...data, privateNotes: privateDetails?.notes || privateDetails?.notesEn || '', privateNotesEn: privateDetails?.notesEn || privateDetails?.notes || '', applicationsCount: _count.applications };
  }
  async publicOne(id: string) {
    const p = await this.db.problem.findFirst({ where: { id, status: { not: 'DRAFT' } }, include: problemInclude });
    if (!p) throw new NotFoundException('Problem not found.');
    return presentProblem(p);
  }
  async list(query: ListDto, owner?: Account) {
    if (owner) requireRole(owner, 'COMPANY');
    const words = query.q?.trim().split(/\s+/).filter(Boolean) || [];
    const where: Prisma.ProblemWhereInput = {
      ...(owner ? { companyUserId: owner.id } : { status: { not: 'DRAFT' } }),
      ...(query.category?.length ? { category: { in: query.category } } : {}),
      ...(query.difficulty?.length ? { difficulty: { in: query.difficulty } } : {}),
      ...(query.skill?.length ? { skills: { hasSome: query.skill } } : {}),
      budgetDzd: { gte: query.minReward, lte: query.maxReward },
      AND: words.map(word => ({ OR: ['title', 'titleEn', 'summary', 'summaryEn', 'description', 'descriptionEn'].map(key => ({ [key]: { contains: word, mode: 'insensitive' } })) })),
    };
    const orderBy: Prisma.ProblemOrderByWithRelationInput[] = query.sort === 'reward' ? [{ budgetDzd: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }] : query.sort === 'deadline' ? [{ deadlineAt: { sort: 'asc', nulls: 'last' } }, { id: 'desc' }] : [{ createdAt: 'desc' }, { id: 'desc' }];
    const [rows, total] = await this.db.$transaction([this.db.problem.findMany({ where, orderBy, skip: (query.page - 1) * query.limit, take: query.limit, include: problemInclude }), this.db.problem.count({ where })]);
    return { items: rows.map(presentProblem), total, page: query.page, limit: query.limit };
  }
  private data(input: ProblemDto) {
    const { privateNotes, privateNotesEn, deadlineAt, ...rest } = input;
    const privateData = { ...(privateNotes !== undefined ? { notes: privateNotes, ...(privateNotesEn === undefined ? { notesEn: '' } : {}) } : {}), ...(privateNotesEn !== undefined ? { notesEn: privateNotesEn } : {}) };
    return { ...rest, ...(deadlineAt !== undefined ? { deadlineAt: deadlineAt ? new Date(deadlineAt) : null } : {}), ...(privateNotes !== undefined || privateNotesEn !== undefined ? { privateDetails: { upsert: { create: privateData, update: privateData } } } : {}) };
  }
  async create(user: Account, input: ProblemDto) {
    requireRole(user, 'COMPANY');
    const { privateNotes, privateNotesEn, deadlineAt, ...rest } = input;
    const p = await this.db.problem.create({ data: { deliverables: [], deliverablesEn: [], constraints: [], constraintsEn: [], criteria: [], criteriaEn: [], skills: [], ...rest, deadlineAt: deadlineAt ? new Date(deadlineAt) : null, companyUserId: user.id, privateDetails: { create: { notes: privateNotes || '', notesEn: privateNotesEn || '' } } } });
    return this.owned(user, p.id);
  }
  async update(user: Account, id: string, input: ProblemDto) {
    await this.owned(user, id);
    await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Problem" WHERE id = ${id} FOR UPDATE`;
      const lockedProblem = await tx.problem.findUniqueOrThrow({ where: { id } });
      const briefFixed = lockedProblem.status === 'CLOSED' || await tx.application.count({ where: { problemId: id, status: { not: 'DRAFT' } } }) > 0;
      if (briefFixed && Object.entries(input).some(([key, value]) => value !== undefined && !['privateNotes','privateNotesEn'].includes(key))) throw new ConflictException('The brief is fixed after applications are submitted or the problem is closed.');
      await tx.problem.update({ where: { id }, data: this.data(input) });
    });
    return this.owned(user, id);
  }
  private publishable(p: Problem) {
    const title = (p.titleEn || p.title).trim(), summary = (p.summaryEn || p.summary).trim(), description = (p.descriptionEn || p.description).trim();
    if (title.length < 10 || summary.length < 10 || description.length < 30 || !p.skills.length || p.budgetDzd < 1 || !p.deadlineAt || p.deadlineAt.getTime() <= Date.now()) throw new BadRequestException('Publishing requires a title (10 characters), summary (10), description (30), skills, positive budget and future deadline.');
  }
  async publish(user: Account, id: string) {
    await this.owned(user, id);
    await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Problem" WHERE id = ${id} FOR UPDATE`;
      const p = await tx.problem.findUniqueOrThrow({ where: { id } });
      if (p.status !== 'DRAFT') throw new ConflictException('Only a draft can be published.');
      this.publishable(p);
      await tx.problem.update({ where: { id }, data: { status: 'OPEN' } });
    });
    return this.publicOne(id);
  }
  async close(user: Account, id: string) {
    await this.owned(user, id);
    await this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Problem" WHERE id = ${id} FOR UPDATE`;
      const p = await tx.problem.findUniqueOrThrow({ where: { id } });
      if (p.status !== 'OPEN') throw new ConflictException('Only an open problem can be closed.');
      const affectedApplicants = await tx.application.findMany({ where: { problemId: id, status: 'UNDER_REVIEW' }, select: { id: true, applicantUserId: true } });
      await tx.problem.update({ where: { id }, data: { status: 'CLOSED' } });
      await tx.application.updateMany({ where: { problemId: id, status: 'UNDER_REVIEW' }, data: { status: 'REJECTED', rejectionReason: 'أغلقت الشركة هذه المشكلة.', rejectionReasonEn: 'The company closed this problem.', decisionCode: 'PROBLEM_CLOSED', decidedAt: new Date() } });
      await this.notifications.record(tx, affectedApplicants.map(application => ({ actorUserId: user.id, recipientUserId: application.applicantUserId, type: 'APPLICATION_DECIDED' as const, eventKey: `APPLICATION_DECIDED:${application.id}`, problemId: id })));
    });
    return this.publicOne(id);
  }
  async privateDetails(user: Account, id: string) {
    const p = await this.db.problem.findUnique({ where: { id }, include: { privateDetails: true, acceptedApplication: true, files: { where: { purpose: 'PROBLEM_PRIVATE' }, select: { id: true, originalName: true, byteSize: true } } } });
    if (!p || (p.companyUserId !== user.id && p.acceptedApplication?.applicantUserId !== user.id)) throw new NotFoundException();
    return { notes: p.privateDetails?.notes || p.privateDetails?.notesEn || '', notesEn: p.privateDetails?.notesEn || p.privateDetails?.notes || '', files: p.files };
  }
  async contact(id: string) {
    const p = await this.db.problem.findFirst({ where: { id, status: { not: 'DRAFT' } }, include: { company: { include: { company: true } } } });
    if (!p) throw new NotFoundException();
    const company = p.company.company;
    return company?.shareContact ? { contactEmail: company.contactEmail, contactUrl: company.contactUrl } : { contactEmail: '', contactUrl: '' };
  }
}
