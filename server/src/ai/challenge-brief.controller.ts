import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { AuthRequest, SessionGuard } from '../common/http';
import { BriefResult } from './challenge-brief.schema';
import { ChallengeBriefService } from './challenge-brief.service';

@Controller('ai')
export class ChallengeBriefController {
  constructor(private readonly brief: ChallengeBriefService) {}

  @Post('challenge-brief')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  generate(@Req() request: AuthRequest, @Body() body: unknown): Promise<BriefResult> {
    return this.brief.generate(request.user, body);
  }
}
