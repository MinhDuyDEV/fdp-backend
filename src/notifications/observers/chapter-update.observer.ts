import { Injectable } from '@nestjs/common';

/**
 * Observer Pattern: ReaderObserver interface
 *
 * Defines the contract for observers that receive chapter update notifications.
 */
export interface ReaderObserver {
  getUserId(): number;
  update(message: string): void;
}

/**
 * Observer Pattern: ChapterUpdateSubject
 *
 * The Subject maintains a set of observers and notifies them when
 * a new chapter is published. This is the "subject" side of the
 * GoF Observer pattern, intentionally kept explicit (not replaced
 * by @nestjs/event-emitter) for assignment clarity.
 */
@Injectable()
export class ChapterUpdateSubject {
  private readonly observers = new Map<number, ReaderObserver>();
  private readonly notificationLog: string[] = [];

  attach(observer: ReaderObserver): void {
    this.observers.set(observer.getUserId(), observer);
  }

  detach(userId: number): void {
    this.observers.delete(userId);
  }

  notify(message: string): void {
    this.notificationLog.push(message);
    for (const observer of this.observers.values()) {
      observer.update(message);
    }
  }

  getNotificationLog(): string[] {
    return [...this.notificationLog];
  }

  hasObserver(userId: number): boolean {
    return this.observers.has(userId);
  }

  getObserverCount(): number {
    return this.observers.size;
  }
}

/**
 * Observer Pattern: InAppReaderObserver
 *
 * Concrete observer that stores in-app notifications for a specific user.
 * Each subscribed user gets their own observer instance.
 */
@Injectable()
export class InAppReaderObserver implements ReaderObserver {
  private userId: number;
  private readonly messages: string[] = [];

  setUserId(userId: number): void {
    this.userId = userId;
  }

  getUserId(): number {
    return this.userId;
  }

  update(message: string): void {
    this.messages.push(message);
  }

  getMessages(): string[] {
    return [...this.messages];
  }
}

/**
 * Factory for creating InAppReaderObserver instances per user.
 * Since each observer needs a unique userId, we use a factory
 * instead of sharing a single singleton observer.
 */
@Injectable()
export class ReaderObserverFactory {
  create(userId: number): InAppReaderObserver {
    const observer = new InAppReaderObserver();
    observer.setUserId(userId);
    return observer;
  }
}
