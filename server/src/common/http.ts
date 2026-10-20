import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaService, Account, accountInclude } from '../database/prisma.service';
declare module 'express-session' { interface SessionData { userId?: string; communityVisitorId?: string } }
export type AuthRequest = Request & { user: Account };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly db: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const id = request.session.userId;
    if (!id) throw new UnauthorizedException('Sign in to continue.');
    const user = await this.db.user.findUnique({ where: { id }, include: accountInclude });
    if (!user) throw new UnauthorizedException('Your session has ended.');
    request.user = user;
    return true;
  }
}
export function requireRole(user: Account, role: 'TALENT' | 'COMPANY') {
  if (user.role !== role) throw new ForbiddenException('This action is unavailable for this account type.');
}

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  catch(error: any, host: ArgumentsHost) {
    let status = error instanceof HttpException ? error.getStatus() : error?.code === 'P2002' ? 409 : error?.code === 'P2025' ? 404 : 500;
    const payload = error instanceof HttpException ? error.getResponse() : null;
    const detail = typeof payload === 'object' && payload ? (payload as any).message : payload;
    const message = status === 500 ? 'The request could not be completed.' : detail || (status === 409 ? 'This record already exists or was updated. Refresh and try again.' : 'Record not found.');
    if (status === 500) console.error(error);
    host.switchToHttp().getResponse<Response>().status(status).json({ code: `HTTP_${status}`, message: Array.isArray(message) ? message.join(' ') : message });
  }
}
