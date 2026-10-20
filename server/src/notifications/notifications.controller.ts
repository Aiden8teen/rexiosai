import { Controller, Get, Header, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuthRequest, SessionGuard } from '../common/http';
import { NotificationListDto } from './notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(SessionGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get() @Header('Cache-Control', 'private, no-store') list(@Req() req: AuthRequest, @Query() query: NotificationListDto) {
    return this.notifications.list(req.user.id, query);
  }

  @Patch(':id/read') @Header('Cache-Control', 'private, no-store') markRead(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.notifications.markRead(req.user.id, id);
  }
}
