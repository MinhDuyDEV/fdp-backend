import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../shared/interfaces/paginated-result.interface';
import { NotificationQueryDto } from './dto/notification-query.dto';
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
    private readonly subject: ChapterUpdateSubject,
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
    chapterTitle: string,
  ): Promise<void> {
    const message = `New chapter "${chapterTitle}" (Ch.${chapterId}) added to story ${storyId}`;
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
    query: NotificationQueryDto,
  ): Promise<PaginatedResult<Notification>> {
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

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
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
