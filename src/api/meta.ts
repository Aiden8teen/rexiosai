import { apiRequest } from './client';

export interface Metadata {
  skills: string[];
}

export function getMetadata(): Promise<Metadata> {
  return apiRequest('/meta');
}
