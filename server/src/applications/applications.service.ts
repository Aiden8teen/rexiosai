import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUrl, Length, Max, Min, ValidateIf } from 'class-validator';
import { Account, accountInclude, PrismaService } from '../database/prisma.service';
import { requireRole } from '../common/http';
import { presentUser, profileCompleteness } from '../common/present-user';
import { ListDto } from '../problems/problem.dto';
import { NotificationsService } from '../notifications/notifications.service';

export class ApplicationDto {
  @IsOptional() @IsString() @Length(0, 20000) coverMessage?: string;
  @IsOptional() @IsInt() @Min(1) @Max(365) deliveryDays?: number;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) projectUrl?: string;
  @IsOptional() @IsBoolean() consent?: boolean;
}
export class DecisionDto {
  @IsIn(['ACCEPTED', 'REJECTED']) decision!: 'ACCEPTED' | 'REJECTED';
  @IsOptional() @IsString() @Length(0, 2000) reason?: string;
}
const applicationInclude = {
  problem: { select: { id: true, title: true, titleEn: true, status: true } },
  applicant: { include: accountInclude },
  files: { select: { id: true, originalName: true, byteSize: true } },
} as const;
type LoadedApplication = Prisma.ApplicationGetPayload<{ include: typeof applicationInclude }>;
function presentApplication(a: LoadedApplication) {
  return { ...a, problem: { ...a.problem, title: a.problem.title || a.problem.titleEn, titleEn: a.problem.titleEn || a.problem.title }, applicant: presentUser(a.applicant, false) };
}

@Injectable()
export class ApplicationsService {
  constructor(private readonly db: PrismaService, private readonly notifications: NotificationsService) {}
  async save(user: Account, id: string, input: ApplicationDto, submit: boolean) {
    requireRole(user, 'TALENT');
    if (submit && profileCompleteness(user.talent) !== 100) throw new BadRequestException('Complete your solver profile before applying.');
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Problem" WHERE id = ${id} FOR UPDATE`;
      const p = await tx.problem.findUnique({ where: { id } });
      if (!p || p.status === 'DRAFT') throw new NotFoundException('Problem not found.');
      if (p.status !== 'OPEN' || !p.deadlineAt || p.deadlineAt.getTime() <= Date.now()) throw new ConflictException('This problem is closed or its deadline has passed.');
      const where = { problemId_applicantUserId: { problemId: id, applicantUserId: user.id } };
      const existing = await tx.application.findUnique({ where });
      if (existing && existing.status !== 'DRAFT') throw new ConflictException('You have already submitted an application for this problem.');
      const data = { coverMessage: existing?.coverMessage || '', deliveryDays: existing?.deliveryDays || 10, projectUrl: existing?.projectUrl || '', consent: existing?.consent || false, ...input };
      data.coverMessage = data.coverMessage.trim();
      if (submit && (data.coverMessage.split(/\s+/).filter(Boolean).length < 10 || !data.consent)) throw new BadRequestException('Write at least 10 words and confirm ownership before submitting.');
      const result = await tx.application.upsert({ where, create: { ...data, problemId: id, applicantUserId: user.id, status: submit ? 'UNDER_REVIEW' : 'DRAFT', submittedAt: submit ? new Date() : null }, update: { ...data, ...(input.coverMessage !== undefined ? { coverMessageEn: '' } : {}), ...(submit ? { status: 'UNDER_REVIEW', submittedAt: new Date() } : {}) }, include: applicationInclude });
      if (submit) await this.notifications.record(tx, [{ actorUserId: user.id, recipientUserId: p.companyUserId, type: 'APPLICATION_RECEIVED', eventKey: `APPLICATION_RECEIVED:${result.id}`, problemId: p.id }]);
      return presentApplication(result);
    });
  }
  async mine(user: Account, query: ListDto) {
    requireRole(user, 'TALENT');
    return this.list({ applicantUserId: user.id }, query);
  }
  async forCompany(user: Account, id: string, query: ListDto) {
    requireRole(user, 'COMPANY');
    const problem = await this.db.problem.findFirst({ where: { id, companyUserId: user.id } });
    if (!problem) throw new NotFoundException();
    return this.list({ problemId: id, status: { not: 'DRAFT' } }, query);
  }
  private async list(where: Prisma.ApplicationWhereInput, query: ListDto) {
    const [items, total] = await this.db.$transaction([this.db.application.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], include: applicationInclude }), this.db.application.count({ where })]);
    return { items: items.map(presentApplication), total, page: query.page, limit: query.limit };
  }
  async decide(user: Account, id: string, input: DecisionDto) {
    requireRole(user, 'COMPANY');
    const initial = await this.db.application.findFirst({ where: { id, problem: { companyUserId: user.id }, status: { not: 'DRAFT' } } });
    if (!initial) throw new NotFoundException();
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Problem" WHERE id = ${initial.problemId} FOR UPDATE`;
      const problem = await tx.problem.findUniqueOrThrow({ where: { id: initial.problemId } });
      const application = await tx.application.findUniqueOrThrow({ where: { id } });
      if (problem.status !== 'OPEN' || application.status !== 'UNDER_REVIEW') throw new ConflictException('This application has already been decided or the problem is closed.');
      const result = await tx.application.update({ where: { id }, data: { status: input.decision, decidedAt: new Date(), rejectionReason: input.decision === 'REJECTED' ? input.reason?.trim() || null : null, rejectionReasonEn: null, decisionCode: input.decision === 'REJECTED' ? 'MANUAL_REJECTION' : 'SELECTED' }, include: applicationInclude });
      const affectedApplicants = input.decision === 'ACCEPTED'
        ? await tx.application.findMany({ where: { problemId: problem.id, status: 'UNDER_REVIEW', id: { not: id } }, select: { id: true, applicantUserId: true } })
        : [];
      if (input.decision === 'ACCEPTED') {
        await tx.problem.update({ where: { id: problem.id }, data: { status: 'CLOSED', acceptedApplicationId: id } });
        await tx.application.updateMany({ where: { problemId: problem.id, status: 'UNDER_REVIEW', id: { not: id } }, data: { status: 'REJECTED', rejectionReason: 'اختارت الشركة متقدمًا آخر لهذه المشكلة.', rejectionReasonEn: 'Another applicant was selected for this problem.', decisionCode: 'OTHER_APPLICANT_SELECTED', decidedAt: new Date() } });
      }
      await this.notifications.record(tx, [
        { actorUserId: user.id, recipientUserId: application.applicantUserId, type: 'APPLICATION_DECIDED', eventKey: `APPLICATION_DECIDED:${application.id}`, problemId: problem.id },
        ...affectedApplicants.map(affected => ({ actorUserId: user.id, recipientUserId: affected.applicantUserId, type: 'APPLICATION_DECIDED' as const, eventKey: `APPLICATION_DECIDED:${affected.id}`, problemId: problem.id })),
      ]);
      return presentApplication(result);
    });
  }
}
