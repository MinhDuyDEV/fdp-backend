import { Injectable } from '@nestjs/common';

/**
 * Observer Pattern: ReaderObserver interface
 *
 * Defines the contract for observers that receive chapter update notifications.
 */
export interface ReaderObserver {
  getUserId(): number;
  getStoryId(): number;
  update(message: string): void;
}

/**
 * Observer Pattern: ChapterUpdateSubject
 *
 * The Subject maintains a set of observers and notifies them when
 * a new chapter is published. This is the "subject" side of the
 * GoF Observer pattern, intentionally kept explicit (not replaced
 * by @nestjs/event-emitter) for assignment clarity.
 *
 * Observers are keyed by `userId:storyId` so notifications are
 * story-scoped — only observers subscribed to a specific story
 * receive updates for that story.
 */
@Injectable()
export class ChapterUpdateSubject {
  private readonly observers = new Map<string, ReaderObserver>();
  private readonly notificationLog: string[] = [];

  private static buildKey(userId: number, storyId: number): string {
    return `${userId}:${storyId}`;
  }

  attach(observer: ReaderObserver): void {
    const key = ChapterUpdateSubject.buildKey(
      observer.getUserId(),
      observer.getStoryId(),
    );
    this.observers.set(key, observer);
  }

  detach(userId: number, storyId: number): void {
    this.observers.delete(ChapterUpdateSubject.buildKey(userId, storyId));
  }

  /**
   * Notify only observers subscribed to the given story.
   */
  notifyForStory(storyId: number, message: string): void {
    this.notificationLog.push(message);
    for (const observer of this.observers.values()) {
      if (observer.getStoryId() === storyId) {
        observer.update(message);
      }
    }
  }

  getNotificationLog(): string[] {
    return [...this.notificationLog];
  }

  hasObserver(userId: number, storyId: number): boolean {
    return this.observers.has(ChapterUpdateSubject.buildKey(userId, storyId));
  }

  getObserverCount(): number {
    return this.observers.size;
  }
}

/**
 * Observer Pattern: InAppReaderObserver
 *
 * Concrete observer that stores in-app notifications for a specific user
 * subscribed to a specific story.
 */
@Injectable()
export class InAppReaderObserver implements ReaderObserver {
  private userId: number;
  private storyId: number;
  private readonly messages: string[] = [];

  setUserId(userId: number): void {
    this.userId = userId;
  }

  setStoryId(storyId: number): void {
    this.storyId = storyId;
  }

  getUserId(): number {
    return this.userId;
  }

  getStoryId(): number {
    return this.storyId;
  }

  update(message: string): void {
    this.messages.push(message);
  }

  getMessages(): string[] {
    return [...this.messages];
  }
}

/**
 * Factory for creating InAppReaderObserver instances per user+story.
 * Since each observer needs unique userId+storyId, we use a factory
 * instead of sharing a single singleton observer.
 */
@Injectable()
export class ReaderObserverFactory {
  create(userId: number, storyId: number): InAppReaderObserver {
    const observer = new InAppReaderObserver();
    observer.setUserId(userId);
    observer.setStoryId(storyId);
    return observer;
  }
}
