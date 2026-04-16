import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PaginatedResult } from '../shared/interfaces/paginated-result.interface';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('subscribe')
  subscribe(@Body() body: { userId: number; storyId: number }): {
    message: string;
  } {
    return this.notificationsService.subscribe(body.userId, body.storyId);
  }

  @Post('unsubscribe')
  unsubscribe(@Body() body: { userId: number; storyId: number }): {
    message: string;
  } {
    return this.notificationsService.unsubscribe(body.userId, body.storyId);
  }

  @Get()
  getNotifications(): { notifications: string[] } {
    return { notifications: this.notificationsService.getNotifications() };
  }

  @Get('subscribers')
  getSubscriberCount(): { count: number } {
    return { count: this.notificationsService.getSubscriberCount() };
  }

  @Get('user/:userId')
  async getUserNotifications(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() query: NotificationQueryDto,
  ): Promise<PaginatedResult<Notification>> {
    return this.notificationsService.findByUser(userId, query);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(id);
  }
}
