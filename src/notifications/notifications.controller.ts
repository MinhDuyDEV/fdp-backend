import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import type { PaginatedResult } from '../shared/interfaces/paginated-result.interface';
import { NotificationQueryDto } from './dto/notification-query.dto';
import type { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

type AuthenticatedRequest = {
  user: {
    userId: number;
  };
};

@Controller('notifications')
export class NotificationsController {
  constructor(
    @Inject(NotificationsService)
    private readonly notificationsService: NotificationsService,
  ) {}

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
    @Query(
      new ValidationPipe({
        transform: true,
        expectedType: NotificationQueryDto,
      }),
    )
    query: NotificationQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<PaginatedResult<Notification>> {
    return this.notificationsService.findByUser(
      userId,
      request.user.userId,
      query,
    );
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(id, request.user.userId);
  }
}
