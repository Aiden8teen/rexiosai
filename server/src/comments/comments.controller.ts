import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, Length } from 'class-validator';
import { PrismaService } from '../database/prisma.service';
import { AuthRequest, SessionGuard } from '../common/http';
import { ProblemsService } from '../problems/problems.service';
import { NotificationsService } from '../notifications/notifications.service';
class CommentDto {
  @IsString() @Length(1, 5000) body!: string;
  @IsOptional() @IsString() parentId?: string;
}
@Controller('problems/:problemId/comments')
export class CommentsController {
  constructor(private readonly db: PrismaService, private readonly problems: ProblemsService, private readonly notifications: NotificationsService) {}
  @Get() async list(@Param('problemId') problemId: string) {
    const problem = await this.problems.publicOne(problemId);
    return { items: problem.discussions, total: problem.discussions.length };
  }
  @Post() @UseGuards(SessionGuard) async create(@Req() req: AuthRequest, @Param('problemId') problemId: string, @Body() input: CommentDto) {
    if (!input.body.trim()) throw new BadRequestException('Write a comment first.');
    const c = await this.db.$transaction(async tx => {
      const problem = await tx.problem.findFirst({ where: { id: problemId, status: { not: 'DRAFT' } }, select: { id: true, companyUserId: true } });
      if (!problem) throw new NotFoundException('Problem not found.');
      let recipientUserId = problem.companyUserId;
      if (input.parentId) {
        const parent = await tx.problemComment.findFirst({ where: { id: input.parentId, problemId, parentId: null }, select: { authorUserId: true } });
        if (!parent) throw new NotFoundException('Reply target not found.');
        recipientUserId = parent.authorUserId;
      }
      const comment = await tx.problemComment.create({ data: { problemId, authorUserId: req.user.id, body: input.body.trim(), parentId: input.parentId || null } });
      await this.notifications.record(tx, [{ actorUserId: req.user.id, recipientUserId, type: 'PROBLEM_COMMENT', eventKey: `PROBLEM_COMMENT:${comment.id}`, problemId }]);
      return comment;
    });
    return { id: c.id, author: req.user.displayName, author_en: req.user.displayNameEn, isCompany: req.user.role === 'COMPANY', authorAvatar: req.user.displayName[0], createdAt: 'الآن', createdAt_en: 'Just now', body: c.body, body_en: c.body, replies: [] };
  }
}
