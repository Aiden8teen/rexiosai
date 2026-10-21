import { BadRequestException, Body, Controller, Delete, Get, Header, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { AuthRequest, SessionGuard } from '../common/http';
import { CommunityService } from './community.service';
import { AcceptedAnswerDto, CommunityListDto, CommunityPageDto, CreateAnswerDto, CreateQuestionDto } from './community.dto';
@Controller('community')
export class CommunityController {
  constructor(private readonly service: CommunityService) { }
  private emptyBody(req: Request) { if (req.body && Object.keys(req.body).length)
    throw new BadRequestException('This action does not accept fields.'); }
  @Get('overview')
  overview() { return this.service.overview(); }
  @Get('questions')
  @Header('Cache-Control', 'private, no-store')
  list(
  @Query()
  q: CommunityListDto,
  @Req()
  req: Request) { return this.service.list(q, req.session.userId); }
  @Get('questions/:id')
  @Header('Cache-Control', 'private, no-store')
  detail(
  @Param('id')
  id: string,
  @Req()
  req: Request) { return this.service.detail(id, req.session.userId); }
  @Get('questions/:id/answers')
  @Header('Cache-Control', 'private, no-store')
  answers(
  @Param('id')
  id: string,
  @Query()
  q: CommunityPageDto,
  @Req()
  req: Request) { return this.service.answers(id, q, req.session.userId); }
  @Post('questions')
  @UseGuards(SessionGuard)
  create(
  @Req()
  req: AuthRequest,
  @Body()
  input: CreateQuestionDto) { return this.service.create(req.user, input); }
  @Post('questions/:id/answers')
  @UseGuards(SessionGuard)
  answer(
  @Req()
  req: AuthRequest,
  @Param('id')
  id: string,
  @Body()
  input: CreateAnswerDto) { return this.service.addAnswer(req.user, id, input); }
  @Put('questions/:id/accepted-answer')
  @UseGuards(SessionGuard)
  select(
  @Req()
  req: AuthRequest,
  @Param('id')
  id: string,
  @Body()
  input: AcceptedAnswerDto) { return this.service.selectAnswer(req.user, id, input); }
  @Put('questions/:id/reactions/:kind')
  @UseGuards(SessionGuard)
  qPut(
  @Req()
  req: AuthRequest,
  @Param('id')
  id: string,
  @Param('kind')
  kind: string) { this.emptyBody(req); return this.service.reaction(req.user, id, kind, true, 'question'); }
  @Delete('questions/:id/reactions/:kind')
  @UseGuards(SessionGuard)
  qDelete(
  @Req()
  req: AuthRequest,
  @Param('id')
  id: string,
  @Param('kind')
  kind: string) { this.emptyBody(req); return this.service.reaction(req.user, id, kind, false, 'question'); }
  @Put('answers/:id/reactions/:kind')
  @UseGuards(SessionGuard)
  aPut(
  @Req()
  req: AuthRequest,
  @Param('id')
  id: string,
  @Param('kind')
  kind: string) { this.emptyBody(req); return this.service.reaction(req.user, id, kind, true, 'answer'); }
  @Delete('answers/:id/reactions/:kind')
  @UseGuards(SessionGuard)
  aDelete(
  @Req()
  req: AuthRequest,
  @Param('id')
  id: string,
  @Param('kind')
  kind: string) { this.emptyBody(req); return this.service.reaction(req.user, id, kind, false, 'answer'); }
  @Post('questions/:id/view')
  async view(
  @Req()
  req: Request,
  @Param('id')
  id: string) {
    this.emptyBody(req);
    if (!req.session.userId && !req.session.communityVisitorId)
      req.session.communityVisitorId = randomUUID();
    return this.service.view(id, req.session.userId ? `user:${req.session.userId}` : `visitor:${req.session.communityVisitorId}`);
  }
}
