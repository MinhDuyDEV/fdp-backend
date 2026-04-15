import { Injectable } from '@nestjs/common';
import {
  ChapterUpdateSubject,
  ReaderObserverFactory,
} from './observers/chapter-update.observer';

@Injectable()
export class NotificationsService {
  constructor(
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

  notifyChapterUpdate(
    storyId: number,
    chapterId: number,
    chapterTitle: string,
  ): void {
    const message = `New chapter "${chapterTitle}" (Ch.${chapterId}) added to story ${storyId}`;
    // Observer Pattern: notify only observers subscribed to this story
    this.subject.notifyForStory(storyId, message);
  }

  getNotifications(): string[] {
    return this.subject.getNotificationLog();
  }

  getSubscriberCount(): number {
    return this.subject.getObserverCount();
  }
}
