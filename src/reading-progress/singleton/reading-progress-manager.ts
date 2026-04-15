import { Injectable } from '@nestjs/common';
import { ReadingProgress } from '../entities/reading-progress.entity';

/**
 * Singleton Pattern: ReadingProgressManager
 *
 * NestJS DI manages a single instance per app lifecycle (default scope).
 * The Manager provides an in-memory cache layer on top of DB persistence,
 * enabling fast lookups for the most recent reading position.
 *
 * The manual static getInstance() is intentionally replaced by @Injectable()
 * to integrate with Nest's dependency injection, while still preserving
 * the singleton semantic (one shared instance across all consumers).
 */
@Injectable()
export class ReadingProgressManager {
  private readonly progressStore = new Map<string, ReadingProgress>();

  private static buildKey(userId: number, storyId: number): string {
    return `${userId}:${storyId}`;
  }

  setProgress(
    userId: number,
    storyId: number,
    progress: ReadingProgress,
  ): void {
    this.progressStore.set(
      ReadingProgressManager.buildKey(userId, storyId),
      progress,
    );
  }

  getProgress(userId: number, storyId: number): ReadingProgress | undefined {
    return this.progressStore.get(
      ReadingProgressManager.buildKey(userId, storyId),
    );
  }

  removeProgress(userId: number, storyId: number): void {
    this.progressStore.delete(ReadingProgressManager.buildKey(userId, storyId));
  }
}
