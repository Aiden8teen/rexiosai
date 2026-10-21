import { apiRequest } from './client';
import type { AccountType, ApiUser } from './contracts';

export const getCurrentUser = () => apiRequest<ApiUser>('/auth/me');
export const login = (email: string, password: string) =>
  apiRequest<ApiUser>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const register = (name: string, email: string, password: string, accountType: AccountType) =>
  apiRequest<ApiUser>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, accountType }) });
export const logout = () => apiRequest<void>('/auth/logout', { method: 'POST' });
