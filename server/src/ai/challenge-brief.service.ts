import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Account } from '../database/prisma.service';
import { requireRole } from '../common/http';
import { BriefValidationError, parseBriefRequest, type BriefRequest, type BriefResult } from './challenge-brief.schema';
import { generateChallengeBrief } from './challenge-brief.graph';
import { AiUnavailableError, createFeatherlessModel } from './featherless.client';

type RequestLanguage = 'ar' | 'en';

const messages = {
  ar: {
    forbidden: 'تتوفر صياغة التحديات بمساعدة الذكاء الاصطناعي لحسابات الشركات فقط.',
    invalid: 'أدخل ملاحظات غير فارغة واختر لغة مدعومة، وتحقق من المسودة السابقة والإجابات.',
    unavailable: 'خدمة صياغة التحديات غير مهيأة حاليًا. يرجى المحاولة لاحقًا.',
    capacity: 'خدمة الذكاء الاصطناعي مشغولة حاليًا. يرجى إعادة المحاولة بعد قليل.',
    timeout: 'استغرقت صياغة المسودة وقتًا طويلًا. يرجى المحاولة مجددًا.',
    invalidOutput: 'تعذّر إنشاء مسودة صالحة بعد عدة محاولات. وضّح الملاحظات ثم حاول مجددًا.',
    upstream: 'تعذّر إكمال طلب صياغة التحدي. يرجى المحاولة مجددًا.',
  },
  en: {
    forbidden: 'AI challenge drafting is available to company accounts only.',
    invalid: 'Provide nonempty notes and a supported language, and check the previous draft and answers.',
    unavailable: 'AI challenge drafting is not configured. Please try again later.',
    capacity: 'The AI provider is at capacity. Please try again shortly.',
    timeout: 'Draft generation took too long. Please try again.',
    invalidOutput: 'The AI could not produce a valid brief after several attempts. Clarify the notes and try again.',
    upstream: 'The AI provider could not complete this request. Please try again.',
  },
} as const;

function languageOf(value: unknown): RequestLanguage {
  return typeof value === 'object' && value !== null && 'lang' in value && value.lang === 'ar' ? 'ar' : 'en';
}

function integerSetting(name: string, fallback: number, minimum: number, maximum = Number.MAX_SAFE_INTEGER): number {
  const value = process.env[name]?.trim();
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

function upstreamStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const candidate = error as { status?: unknown; statusCode?: unknown; response?: { status?: unknown } };
  const status = candidate.status ?? candidate.statusCode ?? candidate.response?.status;
  return typeof status === 'number' ? status : undefined;
}

function providerMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  const candidate = error as { message?: unknown; error?: { message?: unknown }; response?: { data?: { error?: { message?: unknown } } } };
  return [candidate.message, candidate.error?.message, candidate.response?.data?.error?.message]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
}

function isProviderCapacityError(error: unknown): boolean {
  const status = upstreamStatus(error);
  return status === 429 || status === 503 || /rate.?limit|too many requests|capacity|overload|temporarily unavailable/.test(providerMessage(error));
}

@Injectable()
export class ChallengeBriefService {
  async generate(user: Account, value: unknown): Promise<BriefResult> {
    const lang = languageOf(value);
    try {
      requireRole(user, 'COMPANY');
    } catch {
      throw new ForbiddenException(messages[lang].forbidden);
    }

    let request: BriefRequest;
    try {
      request = parseBriefRequest(value);
    } catch (error) {
      if (error instanceof BriefValidationError) throw new BadRequestException(messages[lang].invalid);
      throw error;
    }

    const controller = new AbortController();
    const timeoutMs = integerSetting('AI_REQUEST_TIMEOUT_MS', 180000, 1, 2147483647);
    const maxRepairAttempts = integerSetting('AI_MAX_REPAIR_ATTEMPTS', 2, 0);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error('AI request timed out.'));
    }, timeoutMs);

    try {
      const model = createFeatherlessModel();
      return await generateChallengeBrief(request, model, {
        signal: controller.signal,
        now: new Date(),
        maxRepairAttempts,
      });
    } catch (error) {
      if (timedOut || (controller.signal.aborted && error instanceof Error && error.name === 'AbortError')) {
        throw new GatewayTimeoutException(messages[lang].timeout);
      }
      if (error instanceof AiUnavailableError) throw new ServiceUnavailableException(messages[lang].unavailable);
      if (error instanceof BriefValidationError) throw new UnprocessableEntityException(messages[lang].invalidOutput);
      if (isProviderCapacityError(error)) throw new ServiceUnavailableException(messages[lang].capacity);
      throw new BadGatewayException(messages[lang].upstream);
    } finally {
      clearTimeout(timer);
    }
  }
}
