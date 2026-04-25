import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { PaginatedResult } from '../shared/interfaces/paginated-result.interface';
import type { NotificationQueryDto } from './dto/notification-query.dto';
import { Notification } from './entities/notification.entity';
import {
  ChapterUpdateSubject,
  ReaderObserverFactory,
} from './observers/chapter-update.observer';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject(ChapterUpdateSubject)
    private readonly subject: ChapterUpdateSubject,
    @Inject(ReaderObserverFactory)
    private readonly observerFactory: ReaderObserverFactory,
  ) {}

  subscribe(userId: number, storyId: number): { message: string } {
    if (this.subject.hasObserver(userId, storyId)) {
      return {
        message: `User ${userId} is already subscribed to story ${storyId}`,
      };
    }
    const observer = this.observerFactory.create(userId, storyId);
    this.subject.attach(observer);
    return { message: `User ${userId} subscribed to story ${storyId} updates` };
  }

  unsubscribe(userId: number, storyId: number): { message: string } {
    if (!this.subject.hasObserver(userId, storyId)) {
      return {
        message: `User ${userId} is not subscribed to story ${storyId}`,
      };
    }
    this.subject.detach(userId, storyId);
    return {
      message: `User ${userId} unsubscribed from story ${storyId} updates`,
    };
  }

  async notifyChapterUpdate(
    storyId: number,
    chapterId: number,
    chapterNumber: number,
    chapterTitle: string,
  ): Promise<void> {
    const message = `Chương ${chapterNumber}: "${chapterTitle}" vừa được cập nhật!`;
    // Observer Pattern: notify only observers subscribed to this story (in-memory)
    this.subject.notifyForStory(storyId, message);

    // Persist notifications to DB for each subscribed user
    const subscribedUserIds = this.subject.getSubscribedUserIds(storyId);
    const notifications = subscribedUserIds.map((userId) =>
      this.notificationRepository.create({
        userId,
        storyId,
        chapterId,
        message,
        isRead: false,
      }),
    );
    if (notifications.length > 0) {
      await this.notificationRepository.save(notifications);
    }
  }

  async findByUser(
    userId: number,
    currentUserId: number,
    query: NotificationQueryDto,
  ): Promise<PaginatedResult<Notification>> {
    if (userId !== currentUserId) {
      throw new ForbiddenException('You can only view your own notifications');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = { userId };
    if (query.unreadOnly) {
      where.isRead = false;
    }

    const [data, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async markAsRead(id: number, currentUserId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    if (notification.userId !== currentUserId) {
      throw new ForbiddenException(
        'You can only mark your own notifications as read',
      );
    }
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  getNotifications(): string[] {
    return this.subject.getNotificationLog();
  }

  getSubscriberCount(): number {
    return this.subject.getObserverCount();
  }
}
