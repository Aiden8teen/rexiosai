import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

export type PublicStats = {
  companiesWithPublishedProblems: number;
  talentAccounts: number;
  openBudgetDzd: number;
  problemsWithSelectedApplicant: number;
};

@Injectable()
export class PublicService {
  constructor(private readonly db: PrismaService) {}

  async stats(): Promise<PublicStats> {
    const now = new Date();
    const [companiesWithPublishedProblems, talentAccounts, openBudgets, problemsWithSelectedApplicant] = await this.db.$transaction(async tx => Promise.all([
      tx.user.count({ where: { role: 'COMPANY', problems: { some: { status: { not: 'DRAFT' } } } } }),
      tx.user.count({ where: { role: 'TALENT' } }),
      tx.problem.aggregate({ where: { status: 'OPEN', deadlineAt: { gt: now } }, _sum: { budgetDzd: true } }),
      tx.problem.count({ where: { acceptedApplicationId: { not: null } } }),
    ]), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    return { companiesWithPublishedProblems, talentAccounts, openBudgetDzd: openBudgets._sum.budgetDzd ?? 0, problemsWithSelectedApplicant };
  }
}
