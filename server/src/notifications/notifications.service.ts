import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NotificationListDto } from './notifications.dto';

export type NotificationEventInput = {
  actorUserId: string;
  recipientUserId: string;
  type: NotificationType;
  eventKey: string;
  problemId?: string;
  questionId?: string;
  answerId?: string;
};

export type NotificationView = {
  id: string;
  type: NotificationType;
  title: string;
  titleEn: string;
  href: string;
  createdAt: Date;
  readAt: Date | null;
};

type NotificationRow = {
  id: string;
  type: NotificationType;
  questionId: string | null;
  problemId: string | null;
  createdAt: Date;
  readAt: Date | null;
};

const eventText: Record<NotificationType, { title: string; titleEn: string }> = {
  COMMUNITY_ANSWER: { title: 'إجابة جديدة على سؤالك', titleEn: 'New answer to your question' },
  ANSWER_ACCEPTED: { title: 'تم اختيار إجابتك', titleEn: 'Your answer was selected' },
  APPLICATION_RECEIVED: { title: 'تم استلام طلب جديد', titleEn: 'A new application was received' },
  APPLICATION_DECIDED: { title: 'تم تحديث حالة طلبك', titleEn: 'Your application status changed' },
  PROBLEM_COMMENT: { title: 'تعليق جديد على التحدي', titleEn: 'A new challenge comment' },
};

function present(row: NotificationRow): NotificationView {
  let href = '/';
  if (row.type === 'COMMUNITY_ANSWER' || row.type === 'ANSWER_ACCEPTED') {
    if (row.questionId) href = `/community/${encodeURIComponent(row.questionId)}`;
  } else if (row.type === 'APPLICATION_RECEIVED') {
    if (row.problemId) href = `/company/problems/${encodeURIComponent(row.problemId)}/applications`;
  } else if (row.type === 'APPLICATION_DECIDED') {
    href = '/my-applications';
  } else if (row.type === 'PROBLEM_COMMENT' && row.problemId) {
    href = `/problems/${encodeURIComponent(row.problemId)}`;
  }
  return { id: row.id, type: row.type, ...eventText[row.type], href, createdAt: row.createdAt, readAt: row.readAt };
}

@Injectable()
export class NotificationsService {
  constructor(private readonly db: PrismaService) {}

  async record(tx: Prisma.TransactionClient, events: NotificationEventInput[]): Promise<void> {
    const rows = events.filter(event => event.actorUserId !== event.recipientUserId).map(event => ({
      recipientUserId: event.recipientUserId,
      type: event.type,
      eventKey: event.eventKey,
      ...(event.problemId ? { problemId: event.problemId } : {}),
      ...(event.questionId ? { questionId: event.questionId } : {}),
      ...(event.answerId ? { answerId: event.answerId } : {}),
    }));
    if (rows.length) await tx.notification.createMany({ data: rows, skipDuplicates: true });
  }

  async list(recipientId: string, query: NotificationListDto) {
    const where = { recipientUserId: recipientId };
    const [items, total, unreadCount] = await this.db.$transaction(async tx => Promise.all([
      tx.notification.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], select: { id: true, type: true, problemId: true, questionId: true, createdAt: true, readAt: true } }),
      tx.notification.count({ where }),
      tx.notification.count({ where: { ...where, readAt: null } }),
    ]), { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
    return { items: items.map(present), total, page: query.page, limit: query.limit, unreadCount };
  }

  async markRead(recipientId: string, id: string): Promise<NotificationView> {
    await this.db.notification.updateMany({ where: { id, recipientUserId: recipientId, readAt: null }, data: { readAt: new Date() } });
    const row = await this.db.notification.findFirst({ where: { id, recipientUserId: recipientId }, select: { id: true, type: true, problemId: true, questionId: true, createdAt: true, readAt: true } });
    if (!row) throw new NotFoundException('Notification not found.');
    return present(row);
  }
}
