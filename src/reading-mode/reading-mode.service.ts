import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ReadingProgressService } from '../reading-progress/reading-progress.service';
import type { RenderResult } from './strategies/reading-mode.strategy';
import { ReadingModeContext } from './strategies/reading-mode-context';

@Injectable()
export class ReadingModeService {
  private readonly userModeOverrides = new Map<string, string>();

  constructor(
    @Inject(ReadingModeContext)
    private readonly context: ReadingModeContext,
    @Inject(ReadingProgressService)
    private readonly progressService: ReadingProgressService,
  ) {}

  async setMode(
    userId: number,
    mode: string,
    storyId?: number,
  ): Promise<string> {
    this.context.setStrategy(mode);
    const currentMode = this.context.getCurrentMode();

    if (storyId !== undefined) {
      const updatedCount = await this.progressService.updateReadingMode(
        userId,
        currentMode,
        storyId,
      );
      // If no progress row exists yet (first-time reader), still store the
      // mode override in memory so it's applied when progress is eventually saved.
      if (updatedCount === 0) {
        this.userModeOverrides.set(
          this.getOverrideKey(userId, storyId),
          currentMode,
        );
      }

      this.userModeOverrides.set(
        this.getOverrideKey(userId, storyId),
        currentMode,
      );
      return currentMode;
    }

    this.userModeOverrides.set(this.getOverrideKey(userId), currentMode);
    return currentMode;
  }

  async getModeForUser(userId: number, storyId: number): Promise<string> {
    try {
      const progress = await this.progressService.getProgress(userId, storyId);
      return progress.readingMode;
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }

      const overriddenMode = this.userModeOverrides.get(
        this.getOverrideKey(userId, storyId),
      );
      if (overriddenMode) {
        return overriddenMode;
      }

      const userOverride = this.userModeOverrides.get(
        this.getOverrideKey(userId),
      );
      if (userOverride) {
        return userOverride;
      }

      return 'day';
    }
  }

  async render(
    content: string,
    mode?: string,
    userId?: number,
    storyId?: number,
  ): Promise<RenderResult> {
    if (mode) {
      this.context.setStrategy(mode);
    } else if (userId) {
      const userMode = storyId
        ? await this.getModeForUser(userId, storyId)
        : (this.userModeOverrides.get(this.getOverrideKey(userId)) ?? 'day');
      this.context.setStrategy(userMode);
    }
    return this.context.render(content);
  }

  async getCurrentModeForUser(
    userId?: number,
    storyId?: number,
  ): Promise<string> {
    if (userId && storyId) {
      return this.getModeForUser(userId, storyId);
    }
    if (userId) {
      return this.userModeOverrides.get(this.getOverrideKey(userId)) ?? 'day';
    }
    return this.getCurrentMode();
  }

  getCurrentMode(): string {
    return this.context.getCurrentMode();
  }

  getAvailableModes(): string[] {
    return this.context.getAvailableModes();
  }

  private getOverrideKey(userId: number, storyId?: number): string {
    return storyId === undefined ? `${userId}` : `${userId}:${storyId}`;
  }
}
