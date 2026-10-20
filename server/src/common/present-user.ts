import type { Account } from '../database/prisma.service';
export function profileCompleteness(p: Account['talent']) {
  if (!p) return 0;
  return Math.round([p.firstName.trim(), p.lastName.trim(), p.educationLevel, p.institutionMajor.trim(), p.experienceLevel, p.skills.length, p.cvFileId || p.githubUrl || p.linkedInUrl].filter(Boolean).length / 7 * 100);
}
export function presentUser(user: Account, self = true) {
  const p = user.talent;
  const complete = profileCompleteness(p);
  return {
    id: user.id, ...(self ? { email: user.email } : {}), accountType: user.role,
    name: user.displayName, name_en: user.displayNameEn || user.displayName,
    role: user.role === 'COMPANY' ? 'company' : complete === 100 ? 'solver' : 'member',
    avatarChar: user.displayName[0] || 'R', avatarBg: user.role === 'COMPANY' ? '#12122B' : '#0B2A9E',
    solverProfile: p ? { firstName: p.firstName, lastName: p.lastName, educationLevel: p.educationLevel, institutionMajor: p.institutionMajor, experienceLevel: p.experienceLevel, skills: p.skills, linkedInUrl: p.linkedInUrl, githubUrl: p.githubUrl, cvFileId: p.cvFileId, cvFileName: p.cvFile?.originalName, completenessPercent: complete } : undefined,
    ...(self ? { companyProfile: user.company } : {}),
  };
}
