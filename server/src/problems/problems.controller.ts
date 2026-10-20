import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthRequest, SessionGuard } from '../common/http';
import { ProblemsService } from './problems.service';
import { ListDto, ProblemDto } from './problem.dto';
@Controller('problems')
export class ProblemsController {
  constructor(private readonly problems: ProblemsService) {}
  @Get() list(@Query() query: ListDto) { return this.problems.list(query); }
  @Get(':id') one(@Param('id') id: string) { return this.problems.publicOne(id); }
  @Get(':id/private') @UseGuards(SessionGuard) private(@Req() req: AuthRequest, @Param('id') id: string) { return this.problems.privateDetails(req.user, id); }
  @Get(':id/contact') @UseGuards(SessionGuard) contact(@Param('id') id: string) { return this.problems.contact(id); }
  @Post() @UseGuards(SessionGuard) create(@Req() req: AuthRequest, @Body() body: ProblemDto) { return this.problems.create(req.user, body); }
  @Patch(':id') @UseGuards(SessionGuard) update(@Req() req: AuthRequest, @Param('id') id: string, @Body() body: ProblemDto) { return this.problems.update(req.user, id, body); }
  @Post(':id/publish') @UseGuards(SessionGuard) publish(@Req() req: AuthRequest, @Param('id') id: string) { return this.problems.publish(req.user, id); }
  @Post(':id/close') @UseGuards(SessionGuard) close(@Req() req: AuthRequest, @Param('id') id: string) { return this.problems.close(req.user, id); }
}
@Controller('company/problems') @UseGuards(SessionGuard)
export class CompanyProblemsController {
  constructor(private readonly problems: ProblemsService) {}
  @Get() list(@Req() req: AuthRequest, @Query() query: ListDto) { return this.problems.list(query, req.user); }
  @Get(':id') one(@Req() req: AuthRequest, @Param('id') id: string) { return this.problems.owned(req.user, id); }
}
