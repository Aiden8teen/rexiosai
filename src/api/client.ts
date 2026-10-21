export class ApiError extends Error {
  status: number;
  code?: string;
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, status: number, code?: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`/api${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      headers,
      credentials: 'include',
    });
  } catch {
    throw new ApiError('Could not reach the Rexios API. Check that the service is running and try again.', 0, 'NETWORK_ERROR');
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = typeof payload?.message === 'string'
      ? payload.message
      : `Request failed (${response.status}). Please try again.`;
    throw new ApiError(message, response.status, payload?.code, payload?.fieldErrors);
  }

  return payload as T;
}

export function apiErrorMessage(error: unknown, lang: 'ar' | 'en' = 'en'): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return lang === 'ar' ? 'تعذر الاتصال بالخدمة. تحقق من تشغيلها ثم حاول مجددًا.' : error.message;
    }
    return error.message;
  }
  return lang === 'ar' ? 'حدث خطأ غير متوقع. حاول مجددًا.' : 'Something went wrong. Please try again.';
}
