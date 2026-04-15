import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { ReadingProgress } from './entities/reading-progress.entity';
import type { ReadingProgressManager } from './singleton/reading-progress-manager';

@Injectable()
export class ReadingProgressService {
  constructor(
    @InjectRepository(ReadingProgress)
    private readonly progressRepository: Repository<ReadingProgress>,
    private readonly progressManager: ReadingProgressManager,
  ) {}

  async saveProgress(
    userId: number,
    storyId: number,
    chapterId: number,
    scrollPosition: number,
    readingMode: string,
  ): Promise<ReadingProgress> {
    // Upsert: find existing or create new
    let progress = await this.progressRepository.findOne({
      where: { userId, storyId },
    });

    if (progress) {
      progress.chapterId = chapterId;
      progress.scrollPosition = scrollPosition;
      progress.readingMode = readingMode;
      progress.lastReadAt = new Date();
    } else {
      progress = this.progressRepository.create({
        userId,
        storyId,
        chapterId,
        scrollPosition,
        readingMode,
        lastReadAt: new Date(),
      });
    }

    const saved = await this.progressRepository.save(progress);

    // Singleton Pattern: update in-memory cache via the manager
    this.progressManager.setProgress(userId, storyId, saved);

    return saved;
  }

  async getProgress(userId: number, storyId: number): Promise<ReadingProgress> {
    // Singleton Pattern: check in-memory cache first, then fall back to DB
    const cached = this.progressManager.getProgress(userId, storyId);
    if (cached) {
      return cached;
    }

    const progress = await this.progressRepository.findOne({
      where: { userId, storyId },
    });
    if (!progress) {
      throw new NotFoundException(
        `No reading progress found for user ${userId} and story ${storyId}`,
      );
    }

    // Populate cache
    this.progressManager.setProgress(userId, storyId, progress);
    return progress;
  }
}
