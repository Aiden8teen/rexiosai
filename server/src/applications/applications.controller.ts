import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthRequest, SessionGuard } from '../common/http';
import { ApplicationDto, ApplicationsService, DecisionDto } from './applications.service';
import { ListDto } from '../problems/problem.dto';
@Controller() @UseGuards(SessionGuard)
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}
  @Put('problems/:id/application/draft') draft(@Req() req: AuthRequest, @Param('id') id: string, @Body() body: ApplicationDto) { return this.applications.save(req.user, id, body, false); }
  @Post('problems/:id/applications') submit(@Req() req: AuthRequest, @Param('id') id: string, @Body() body: ApplicationDto) { return this.applications.save(req.user, id, body, true); }
  @Get('me/applications') mine(@Req() req: AuthRequest, @Query() query: ListDto) { return this.applications.mine(req.user, query); }
  @Get('company/problems/:id/applications') company(@Req() req: AuthRequest, @Param('id') id: string, @Query() query: ListDto) { return this.applications.forCompany(req.user, id, query); }
  @Post('applications/:id/decision') decide(@Req() req: AuthRequest, @Param('id') id: string, @Body() body: DecisionDto) { return this.applications.decide(req.user, id, body); }
}
