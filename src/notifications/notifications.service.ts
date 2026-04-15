import { Injectable } from '@nestjs/common';
import type {
  ChapterUpdateSubject,
  ReaderObserverFactory,
} from './observers/chapter-update.observer';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly subject: ChapterUpdateSubject,
    private readonly observerFactory: ReaderObserverFactory,
  ) {}

  subscribe(userId: number): { message: string } {
    if (this.subject.hasObserver(userId)) {
      return { message: `User ${userId} is already subscribed` };
    }
    const observer = this.observerFactory.create(userId);
    this.subject.attach(observer);
    return { message: `User ${userId} subscribed to chapter updates` };
  }

  unsubscribe(userId: number): { message: string } {
    if (!this.subject.hasObserver(userId)) {
      return { message: `User ${userId} is not subscribed` };
    }
    this.subject.detach(userId);
    return { message: `User ${userId} unsubscribed from chapter updates` };
  }

  notifyChapterUpdate(
    storyId: number,
    chapterId: number,
    chapterTitle: string,
  ): void {
    const message = `New chapter "${chapterTitle}" (Ch.${chapterId}) added to story ${storyId}`;
    this.subject.notify(message);
  }

  getNotifications(): string[] {
    return this.subject.getNotificationLog();
  }

  getSubscriberCount(): number {
    return this.subject.getObserverCount();
  }
}
