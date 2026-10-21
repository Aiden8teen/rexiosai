import { apiRequest } from './client';
import type { ApiUser, ProfileUpdate } from './contracts';

export const getMyProfile = () => apiRequest<ApiUser>('/profiles/me');
export const updateMyProfile = (profile: ProfileUpdate) =>
  apiRequest<ApiUser>('/profiles/me', { method: 'PATCH', body: JSON.stringify(profile) });
