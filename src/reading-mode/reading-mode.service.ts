import { Injectable } from '@nestjs/common';
import type { ReadingProgressService } from '../reading-progress/reading-progress.service';
import type { RenderResult } from './strategies/reading-mode.strategy';
import type { ReadingModeContext } from './strategies/reading-mode-context';

@Injectable()
export class ReadingModeService {
  constructor(
    private readonly context: ReadingModeContext,
    private readonly progressService: ReadingProgressService,
  ) {}

  setMode(userId: number, mode: string): string {
    // Validate mode exists, then set on context for immediate rendering
    this.context.setStrategy(mode);
    return this.context.getCurrentMode();
  }

  async getModeForUser(userId: number, storyId: number): Promise<string> {
    try {
      const progress = await this.progressService.getProgress(userId, storyId);
      return progress.readingMode;
    } catch {
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
