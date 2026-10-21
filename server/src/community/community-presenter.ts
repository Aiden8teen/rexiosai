import type { Prisma } from '@prisma/client';
import { profileCompleteness } from '../common/present-user';
export const publicAuthorSelect = { id: true, displayName: true, displayNameEn: true, role: true, talent: { select: { firstName: true, lastName: true, educationLevel: true, institutionMajor: true, experienceLevel: true, skills: true, cvFileId: true, githubUrl: true, linkedInUrl: true } } } as const;
export const questionInclude = { author: { select: publicAuthorSelect }, reactions: true, _count: { select: { answers: true, views: true } } } as const;
export const answerInclude = { author: { select: publicAuthorSelect }, reactions: true, question: { select: { acceptedAnswerId: true } } } as const;
type PublicAuthor = Prisma.UserGetPayload<{
  select: typeof publicAuthorSelect;
}>;
export function communityAuthor(a: PublicAuthor) {
  return { id: a.id, name: a.displayName, nameEn: a.displayNameEn || a.displayName, avatarChar: a.displayName[0] || 'R', role: a.role === 'COMPANY' ? 'company' : profileCompleteness(a.talent as any) === 100 ? 'solver' : 'member' };
}
export function reactionCounts(rows: {
  kind: string;
  userId: string;
}[], viewer?: string) {
  return { helpfulCount: rows.filter(r => r.kind === 'HELPFUL').length, insightCount: rows.filter(r => r.kind === 'INSIGHT').length, viewerReactions: rows.filter(r => r.userId === viewer).map(r => r.kind.toLowerCase()) };
}
export function presentQuestion(q: Prisma.CommunityQuestionGetPayload<{
  include: typeof questionInclude;
}>, viewer?: string, detail = false) {
  const excerpt = (v: string) => v.slice(0, 150) + (v.length > 150 ? '…' : '');
  return { id: q.id, title: q.title || q.titleEn, titleEn: q.titleEn || q.title, excerpt: excerpt(q.body || q.bodyEn), excerptEn: excerpt(q.bodyEn || q.body), tags: q.tags, author: communityAuthor(q.author), createdAt: q.createdAt, lastActivityAt: q.lastActivityAt, views: q._count.views, answerCount: q._count.answers, ...reactionCounts(q.reactions, viewer), ...(detail ? { body: q.body || q.bodyEn, bodyEn: q.bodyEn || q.body, codeSnippet: q.codeSnippet, acceptedAnswerId: q.acceptedAnswerId } : {}) };
}
export function presentAnswer(a: Prisma.CommunityAnswerGetPayload<{
  include: typeof answerInclude;
}>, viewer?: string) {
  return { id: a.id, questionId: a.questionId, author: communityAuthor(a.author), body: a.body || a.bodyEn, bodyEn: a.bodyEn || a.body, createdAt: a.createdAt, ...reactionCounts(a.reactions, viewer), isAccepted: a.question.acceptedAnswerId === a.id };
}
