import { Inject, Injectable } from '@nestjs/common';
import { ReadingProgressService } from '../reading-progress/reading-progress.service';
import type { RenderResult } from './strategies/reading-mode.strategy';
import { ReadingModeContext } from './strategies/reading-mode-context';

@Injectable()
export class ReadingModeService {
  private readonly userModeOverrides = new Map<number, string>();

  constructor(
    @Inject(ReadingModeContext)
    private readonly context: ReadingModeContext,
    @Inject(ReadingProgressService)
    private readonly progressService: ReadingProgressService,
  ) {}

  setMode(userId: number, mode: string): string {
    this.context.setStrategy(mode);
    const currentMode = this.context.getCurrentMode();
    this.userModeOverrides.set(userId, currentMode);
    return currentMode;
  }

  async getModeForUser(userId: number, storyId: number): Promise<string> {
    try {
      const progress = await this.progressService.getProgress(userId, storyId);
      return progress.readingMode;
    } catch {
      const overriddenMode = this.userModeOverrides.get(userId);
      if (overriddenMode) {
        return overriddenMode;
      }

      return 'day'; // default
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
    } else if (userId && storyId) {
      const userMode = await this.getModeForUser(userId, storyId);
      this.context.setStrategy(userMode);
    }
    return this.context.render(content);
  }

  getCurrentMode(): string {
    return this.context.getCurrentMode();
  }

  getAvailableModes(): string[] {
    return this.context.getAvailableModes();
  }
}
