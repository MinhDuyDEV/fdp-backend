import { Body, Controller, Get, Post } from '@nestjs/common';
import type { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('subscribe')
  subscribe(@Body() body: { userId: number }): { message: string } {
    return this.notificationsService.subscribe(body.userId);
  }

  @Post('unsubscribe')
  unsubscribe(@Body() body: { userId: number }): { message: string } {
    return this.notificationsService.unsubscribe(body.userId);
  }

  @Get()
  getNotifications(): { notifications: string[] } {
    return { notifications: this.notificationsService.getNotifications() };
  }

  @Get('subscribers')
  getSubscriberCount(): { count: number } {
    return { count: this.notificationsService.getSubscriberCount() };
  }
}
