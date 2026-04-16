import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  getNotifications(): string[] {
    return this.subject.getNotificationLog();
  }

  getSubscriberCount(): number {
    return this.subject.getObserverCount();
  }
}
