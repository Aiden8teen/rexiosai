import type { ApiProblem } from './contracts';
import type { Problem, User } from '../types';

const initials = (name: string) => name.trim().slice(0, 1) || 'R';

export function mapApiUser(user: User): User {
  const role = user.role === 'company'
    ? 'company'
    : user.solverProfile?.completenessPercent === 100
      ? 'solver'
      : 'member';
  const name = user.name || user.email.split('@')[0];
  return {
    ...user,
    name,
    name_en: user.name_en || name,
    role,
    avatarChar: user.avatarChar || initials(name),
    avatarBg: user.avatarBg || '#0B2A9E',
  };
}

export function mapApiProblem(problem: ApiProblem): Problem {
  const title = problem.title || problem.title_en || '';
  const summary = problem.summary || problem.summary_en || '';
  const description = problem.description || problem.description_en || '';
  const deadlineAt = problem.deadlineAt || new Date(Date.now() + (problem.deadlineDays || 0) * 86400000).toISOString();
  const remaining = Math.max(0, Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 86400000));
  const posted = problem.createdAt ? new Date(problem.createdAt) : new Date();
  const hoursAgo = Math.max(0, Math.floor((Date.now() - posted.getTime()) / 3600000));
  const postedEn = hoursAgo < 24 ? `${hoursAgo || 1}h ago` : `${Math.floor(hoursAgo / 24)} days ago`;
  const postedAr = hoursAgo < 24 ? 'منذ يوم' : `منذ ${Math.floor(hoursAgo / 24)} يوم`;

  return {
    ...problem,
    companyName: problem.companyName || problem.companyName_en || 'Company',
    companyName_en: problem.companyName_en || problem.companyName || 'Company',
    companyAvatar: problem.companyAvatar || initials(problem.companyName || problem.companyName_en || ''),
    title,
    title_en: problem.title_en || title,
    summary,
    summary_en: problem.summary_en || summary,
    description,
    description_en: problem.description_en || description,
    deliverables: problem.deliverables || problem.deliverables_en || [],
    deliverables_en: problem.deliverables_en || problem.deliverables || [],
    constraints: problem.constraints || problem.constraints_en || [],
    constraints_en: problem.constraints_en || problem.constraints || [],
    criteria: problem.criteria || problem.criteria_en || [],
    criteria_en: problem.criteria_en || problem.criteria || [],
    tags: problem.tags || [],
    rewardFormatted: problem.rewardFormatted || `${Number(problem.rewardAmount || 0).toLocaleString('fr-DZ')} د.ج`,
    rewardFormatted_en: problem.rewardFormatted_en || `${Number(problem.rewardAmount || 0).toLocaleString('en-US')} DZD`,
    deadlineAt,
    deadlineDays: remaining,
    deadlineText: problem.deadlineText || `ينتهي بعد ${remaining} يومًا`,
    deadlineText_en: problem.deadlineText_en || `Ends in ${remaining} days`,
    postedAt: problem.postedAt || postedAr,
    postedAt_en: problem.postedAt_en || postedEn,
    proposalsCount: Number(problem.proposalsCount || 0),
    discussions: problem.discussions || [],
    files: problem.files || [],
  };
}
