import { Body, Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, Length } from 'class-validator';
import { PrismaService } from '../database/prisma.service';
import { AuthRequest, SessionGuard } from '../common/http';
import { ProblemsService } from '../problems/problems.service';
class CommentDto {
  @IsString() @Length(1, 5000) body!: string;
  @IsOptional() @IsString() parentId?: string;
}
@Controller('problems/:problemId/comments')
export class CommentsController {
  constructor(private readonly db: PrismaService, private readonly problems: ProblemsService) {}
  @Get() async list(@Param('problemId') problemId: string) {
    const problem = await this.problems.publicOne(problemId);
    return { items: problem.discussions, total: problem.discussions.length };
  }
  @Post() @UseGuards(SessionGuard) async create(@Req() req: AuthRequest, @Param('problemId') problemId: string, @Body() input: CommentDto) {
    await this.problems.publicOne(problemId);
    if (!input.body.trim()) { const { BadRequestException } = await import('@nestjs/common'); throw new BadRequestException('Write a comment first.'); }
    if (input.parentId && !await this.db.problemComment.findFirst({ where: { id: input.parentId, problemId, parentId: null } })) throw new NotFoundException('Reply target not found.');
    const c = await this.db.problemComment.create({ data: { problemId, authorUserId: req.user.id, body: input.body.trim(), parentId: input.parentId || null } });
    return { id: c.id, author: req.user.displayName, author_en: req.user.displayNameEn, isCompany: req.user.role === 'COMPANY', authorAvatar: req.user.displayName[0], createdAt: 'الآن', createdAt_en: 'Just now', body: c.body, body_en: c.body, replies: [] };
  }
}
