import { ReadingProgress } from '../entities/reading-progress.entity';

export class ReadingProgressManager {
  private static instance: ReadingProgressManager;
  private readonly progressStore = new Map<string, ReadingProgress>();

  private constructor() {}

  static getInstance(): ReadingProgressManager {
    if (!ReadingProgressManager.instance) {
      ReadingProgressManager.instance = new ReadingProgressManager();
    }

    return ReadingProgressManager.instance;
  }

  setProgress(
    userId: number,
    storyId: number,
    progress: ReadingProgress,
  ): void {
    this.progressStore.set(`${userId}:${storyId}`, progress);
  }

  getProgress(userId: number, storyId: number): ReadingProgress | undefined {
    return this.progressStore.get(`${userId}:${storyId}`);
  }
}
