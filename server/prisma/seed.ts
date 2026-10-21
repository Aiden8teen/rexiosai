import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { demoContacts, draftProposal, privateNotes, proposals, rejection, upgradeDemoContent } from './demo-content';

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const fixtures = JSON.parse(readFileSync(join(__dirname, 'fixtures/demo.json'), 'utf8'));
let passwordHash: string;
const profiles = new Map<string, string>();
async function talent(name: string, nameEn: string, id?: string, profile?: Record<string, any>) {
  const key = id || `demo-${nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const email = id === 'demo-member' ? 'm@demo.test' : id === 'demo-solver' ? 's@demo.test' : `t${profiles.size}@demo.test`;
  await db.user.upsert({ where: { id: key }, update: { email, passwordHash }, create: {
    id: key, email, passwordHash, role: 'TALENT', displayName: name, displayNameEn: nameEn,
    talent: { create: { firstName: profile?.firstName || '', lastName: profile?.lastName || '', firstNameEn: profile?.firstNameEn || '', lastNameEn: profile?.lastNameEn || '', educationLevel: profile?.educationLevel || '', institutionMajor: profile?.institutionMajor || '', institutionMajorEn: profile?.institutionMajorEn || '', experienceLevel: profile?.experienceLevel || '', skills: profile?.skills || [], githubUrl: profile?.githubUrl || '', linkedInUrl: profile?.linkedInUrl || '' } },
  } });
  profiles.set(nameEn, key);
  return key;
}

async function main() {
 passwordHash = await hash(process.env.DEMO_PASSWORD || '123', 12);
 try {
  const member = fixtures.INITIAL_USERS.member, solver = fixtures.INITIAL_USERS.solver;
  await talent(member.name, member.name_en, 'demo-member');
  await talent(solver.name, solver.name_en, 'demo-solver', solver.solverProfile);
  for (const question of fixtures.INITIAL_QUESTIONS) {
    for (const person of [question, ...question.answers]) {
      if (!profiles.has(person.author_en)) await talent(person.author, person.author_en);
    }
  }
  // Insert each fixture independently; reseeding never restores removed reactions
  // or overwrites edits, timestamps or an author's accepted-answer decision.
  for (const [i, question] of fixtures.INITIAL_QUESTIONS.entries()) {
    const existing = await db.communityQuestion.findUnique({ where: { id: question.id } });
    const createdAt = new Date(Date.now() - (i + 1) * 86400000);
    const authorUserId = profiles.get(question.author_en)!;
    if (!existing) {
      await db.communityQuestion.create({ data: {
        id: question.id, authorUserId, title: question.title, titleEn: question.title_en,
        body: question.body, bodyEn: question.body_en, codeSnippet: question.codeSnippet,
        tags: question.tags, createdAt, lastActivityAt: createdAt,
      } });
      const voter = ['demo-member', 'demo-solver'].find(id => id !== authorUserId)!;
      await db.communityQuestionReaction.create({ data: { targetId: question.id, userId: voter, kind: 'HELPFUL' } });
    }
    for (const [j, answer] of question.answers.entries()) {
      const id = `${question.id}-${answer.id}`;
      if (await db.communityAnswer.findUnique({ where: { id } })) continue;
      const answerAuthor = profiles.get(answer.author_en)!;
      await db.communityAnswer.create({ data: { id, questionId: question.id, authorUserId: answerAuthor, body: answer.body, bodyEn: answer.body_en, createdAt: new Date(createdAt.getTime() + (j + 1) * 3600000) } });
      const voter = ['demo-member', 'demo-solver'].find(id => id !== answerAuthor)!;
      await db.communityAnswerReaction.create({ data: { targetId: id, userId: voter, kind: 'INSIGHT' } });
    }
    if (!existing) {
      const accepted = question.answers.find((answer: any) => answer.isVerified);
      await db.communityQuestion.update({ where: { id: question.id }, data: { acceptedAnswerId: accepted ? `${question.id}-${accepted.id}` : null, lastActivityAt: new Date(createdAt.getTime() + question.answers.length * 3600000) } });
    }
  }
  for (const [i, source] of fixtures.INITIAL_PROBLEMS.entries()) {
    const companyId = `demo-company-${i + 1}`;
    const email = i === 0 ? 'c@demo.test' : `c${i + 1}@demo.test`;
    await db.user.upsert({ where: { id: companyId }, update: { email, passwordHash }, create: {
      id: companyId, email, passwordHash, role: 'COMPANY', displayName: source.companyName, displayNameEn: source.companyName_en,
      company: { create: { name: source.companyName, nameEn: source.companyName_en, contactEmail: demoContacts[i], shareContact: true } },
    } });
    if (await db.problem.findUnique({ where: { id: source.id } })) continue;
    const createdAt = new Date(Date.now() - (4 - i) * 86400000);
    await db.problem.create({ data: {
      id: source.id, companyUserId: companyId, title: source.title, titleEn: source.title_en, summary: source.summary, summaryEn: source.summary_en,
      description: source.description, descriptionEn: source.description_en,
      deliverables: source.deliverables, deliverablesEn: source.deliverables_en, constraints: source.constraints, constraintsEn: source.constraints_en, criteria: source.criteria, criteriaEn: source.criteria_en,
      skills: source.tags, difficulty: source.difficulty, category: 'CHALLENGE', budgetDzd: source.rewardAmount,
      deadlineAt: new Date(Date.now() + source.deadlineDays * 86400000), createdAt, status: source.id === 'p2' ? 'CLOSED' : 'OPEN',
      privateDetails: { create: { notes: privateNotes[source.id].ar, notesEn: privateNotes[source.id].en } },
    } });
    for (const comment of source.discussions) {
      const authorId = comment.isCompany ? companyId : profiles.get(comment.author_en) || await talent(comment.author, comment.author_en);
      await db.problemComment.create({ data: { id: `${source.id}-${comment.id}`, problemId: source.id, authorUserId: authorId, body: comment.body, bodyEn: comment.body_en, createdAt } });
      for (const reply of comment.replies || []) {
        const replyAuthor = reply.isCompany ? companyId : profiles.get(reply.author_en) || await talent(reply.author, reply.author_en);
        await db.problemComment.create({ data: { id: `${source.id}-${reply.id}`, problemId: source.id, parentId: `${source.id}-${comment.id}`, authorUserId: replyAuthor, body: reply.body, bodyEn: reply.body_en, createdAt: new Date(createdAt.getTime() + 3600000) } });
      }
    }
    if (['p1', 'p2', 'p3'].includes(source.id)) {
      const status = source.id === 'p1' ? 'UNDER_REVIEW' : source.id === 'p2' ? 'ACCEPTED' : 'REJECTED';
      const application = await db.application.create({ data: { id: `seed-application-${source.id}`, problemId: source.id, applicantUserId: 'demo-solver', coverMessage: proposals[source.id].ar, coverMessageEn: proposals[source.id].en, consent: true, deliveryDays: 10, projectUrl: 'https://example.com/rexiosai/portfolio', status, submittedAt: createdAt, decidedAt: status === 'UNDER_REVIEW' ? null : createdAt, rejectionReason: status === 'REJECTED' ? rejection.ar : null, rejectionReasonEn: status === 'REJECTED' ? rejection.en : null } });
      if (status === 'ACCEPTED') await db.problem.update({ where: { id: source.id }, data: { acceptedApplicationId: application.id } });
    }
    if (source.id === 'p1') await db.application.create({ data: { id: 'seed-draft-p1', problemId: source.id, applicantUserId: 'demo-member', coverMessage: draftProposal.ar, coverMessageEn: draftProposal.en } });
  }
  await upgradeDemoContent(db);
  console.log('Demo seed ready. Existing records and decisions were preserved.');
 } finally { await db.$disconnect(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
