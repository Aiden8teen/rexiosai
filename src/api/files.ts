import { apiRequest } from './client';
import type { UploadedFile, UploadPurpose } from './contracts';

export async function uploadFile(file: File, purpose: UploadPurpose, context: { problemId?: string; applicationId?: string } = {}) {
  const form = new FormData();
  form.append('file', file);
  form.append('purpose', purpose);
  if (context.problemId) form.append('problemId', context.problemId);
  if (context.applicationId) form.append('applicationId', context.applicationId);
  return apiRequest<UploadedFile>('/files', { method: 'POST', body: form });
}

export const fileUrl = (id: string) => `/api/files/${encodeURIComponent(id)}`;
