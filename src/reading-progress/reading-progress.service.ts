import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Chapter } from '../chapters/entities/chapter.entity';
import { ModeOverrideStore } from '../reading-mode/mode-override.store';
import { Story } from '../stories/entities/story.entity';
import { User } from '../users/entities/user.entity';
import { ReadingProgress } from './entities/reading-progress.entity';
import { ReadingProgressManager } from './singleton/reading-progress-manager';

@Injectable()
export class ReadingProgressService {
  constructor(
    @InjectRepository(ReadingProgress)
    private readonly progressRepository: Repository<ReadingProgress>,
    @Inject(ReadingProgressManager)
    private readonly progressManager: ReadingProgressManager,
    @Inject(ModeOverrideStore)
    private readonly modeOverrideStore: ModeOverrideStore,
  ) {}

  async saveProgress(
    userId: number,
    storyId: number,
    chapterId: number,
    scrollPosition: number,
    readingMode: string,
  ): Promise<ReadingProgress> {
    // FK existence checks
    const story = await this.progressRepository.manager.findOne(Story, {
      where: { id: storyId },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${storyId} not found`);
    }

    const chapter = await this.progressRepository.manager.findOne(Chapter, {
      where: { id: chapterId },
    });
    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${chapterId} not found`);
    }

    if (chapter.storyId !== storyId) {
      throw new NotFoundException(
        `Chapter with id ${chapterId} does not belong to story ${storyId}`,
      );
    }

    const user = await this.progressRepository.manager.findOne(User, {
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const lastReadAt = new Date();

    // I6 fix: consume any pending mode override set before first save
    const overrideKey = ModeOverrideStore.makeKey(userId, storyId);
    const overrideMode = this.modeOverrideStore.consume(overrideKey);
    const effectiveMode = overrideMode ?? readingMode;

    await this.progressRepository.upsert(
      {
        userId,
        storyId,
        chapterId,
        scrollPosition,
        readingMode: effectiveMode,
        lastReadAt,
      },
      {
        conflictPaths: ['userId', 'storyId'],
      },
    );

    const saved = await this.progressRepository.findOne({
      where: { userId, storyId },
    });
    if (!saved) {
      throw new NotFoundException(
        `No reading progress found for user ${userId} and story ${storyId}`,
      );
    }

    // Singleton Pattern: update in-memory cache via the manager
    this.progressManager.setProgress(userId, storyId, saved);

    return saved;
  }

  async getProgress(userId: number, storyId: number): Promise<ReadingProgress> {
    const progress = await this.findProgress(userId, storyId);
    if (!progress) {
      throw new NotFoundException(
        `No reading progress found for user ${userId} and story ${storyId}`,
      );
    }

    return progress;
  }

  async findProgress(
    userId: number,
    storyId: number,
  ): Promise<ReadingProgress | null> {
    // Singleton Pattern: check in-memory cache first, then fall back to DB
    const cached = this.progressManager.getProgress(userId, storyId);
    if (cached) {
      return cached;
    }

    const progress = await this.progressRepository.findOne({
      where: { userId, storyId },
    });
    if (!progress) {
      return null;
    }

    // Populate cache
    this.progressManager.setProgress(userId, storyId, progress);
    return progress;
  }

  async updateReadingMode(
    userId: number,
    readingMode: string,
    storyId?: number,
  ): Promise<number> {
    const progressEntries = await this.progressRepository.find({
      where: storyId === undefined ? { userId } : { userId, storyId },
      order: { storyId: 'ASC' },
    });

    if (progressEntries.length === 0) {
      return 0;
    }

    const lastReadAt = new Date();
    const updatedEntries = progressEntries.map((progress) => ({
      ...progress,
      readingMode,
      lastReadAt,
    }));

    const savedEntries = await this.progressRepository.save(updatedEntries);
    const normalizedEntries = Array.isArray(savedEntries)
      ? savedEntries
      : [savedEntries];

    normalizedEntries.forEach((progress) => {
      this.progressManager.setProgress(
        progress.userId,
        progress.storyId,
        progress,
      );
    });

    return normalizedEntries.length;
  }
}
