import { Body, Controller, HttpCode, HttpException, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthRequest, SessionGuard } from '../common/http';
import { BriefResult } from './challenge-brief.schema';
import { ChallengeBriefService } from './challenge-brief.service';
import type { BriefStreamEvent } from './challenge-brief.stream';

@Controller('ai')
export class ChallengeBriefController {
  constructor(private readonly brief: ChallengeBriefService) {}

  @Post('challenge-brief')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  generate(@Req() request: AuthRequest, @Body() body: unknown): Promise<BriefResult> {
    return this.brief.generate(request.user, body);
  }

  @Post('challenge-brief/stream')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  async stream(@Req() request: AuthRequest, @Body() body: unknown, @Res() response: Response): Promise<void> {
    // Keep normal auth/input errors as HTTP errors before opening the stream.
    const input = this.brief.validateRequest(request.user, body);
    const controller = new AbortController();
    const disconnect = () => { if (!response.writableEnded) controller.abort(); };
    response.on('close', disconnect);
    response.status(200).set({ 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform' });
    response.flushHeaders();
    const send = (event: BriefStreamEvent) => {
      if (!controller.signal.aborted && !response.destroyed) response.write(`event: brief\ndata: ${JSON.stringify(event)}\n\n`);
    };
    const heartbeat = setInterval(() => { if (!response.destroyed) response.write(': keepalive\n\n'); }, 15000);
    try {
      const result = await this.brief.generate(request.user, input, { onProgress: send, signal: controller.signal });
      send({ type: 'complete', result });
    } catch (error) {
      if (!controller.signal.aborted) {
        const status = error instanceof HttpException ? error.getStatus() : 502;
        const message = error instanceof HttpException ? error.message : (input.lang === 'ar' ? 'تعذر إكمال المسودة. حاول مجددًا.' : 'Could not finish the draft. Please try again.');
        send({ type: 'error', status, message });
      }
    } finally {
      clearInterval(heartbeat);
      response.off('close', disconnect);
      response.end();
    }
  }
}
