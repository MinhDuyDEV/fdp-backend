import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ReadingProgressService } from '../reading-progress/reading-progress.service';
import { ModeOverrideStore } from './mode-override.store';
import type { RenderResult } from './strategies/reading-mode.strategy';
import { ReadingModeContext } from './strategies/reading-mode-context';

/**
 * Coordinates reading-mode selection, rendering, and per-user overrides.
 *
 * NOTE (I3 / auth): All endpoints currently trust client-supplied userId.
 * Authentication and authorization are out of scope for Phase 2.
 * A future auth guard should replace userId with the authenticated principal.
 */
@Injectable()
export class ReadingModeService {
  constructor(
    @Inject(ReadingModeContext)
    private readonly context: ReadingModeContext,
    @Inject(ReadingProgressService)
    private readonly progressService: ReadingProgressService,
    @Inject(ModeOverrideStore)
    private readonly overrideStore: ModeOverrideStore,
  ) {}

  async setMode(
    userId: number,
    mode: string,
    storyId?: number,
  ): Promise<string> {
    // Validate without mutating the shared singleton context (I1 fix)
    const currentMode = this.context.validateMode(mode);

    if (storyId !== undefined) {
      const updatedCount = await this.progressService.updateReadingMode(
        userId,
        currentMode,
        storyId,
      );
      // Store override for this user+story. If no progress row exists yet
      // (first-time reader), the override is consumed by saveProgress when
      // progress is eventually created (I6 fix). (C1 fix: single set call)
      if (updatedCount === 0) {
        this.overrideStore.set(
          ModeOverrideStore.makeKey(userId, storyId),
          currentMode,
        );
      }
      return currentMode;
    }

    this.overrideStore.set(ModeOverrideStore.makeKey(userId), currentMode);
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

      const overriddenMode = this.overrideStore.get(
        ModeOverrideStore.makeKey(userId, storyId),
      );
      if (overriddenMode) {
        return overriddenMode;
      }

      const userOverride = this.overrideStore.get(
        ModeOverrideStore.makeKey(userId),
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
    // Resolve effective mode without mutating the shared context (I1 fix)
    let effectiveMode: string;
    if (mode) {
      effectiveMode = this.context.validateMode(mode);
    } else if (userId) {
      effectiveMode = storyId
        ? await this.getModeForUser(userId, storyId)
        : (this.overrideStore.get(ModeOverrideStore.makeKey(userId)) ?? 'day');
    } else {
      effectiveMode = this.context.getCurrentMode();
    }
    return this.context.renderWithMode(content, effectiveMode);
  }

  async getCurrentModeForUser(
    userId?: number,
    storyId?: number,
  ): Promise<string> {
    if (userId && storyId) {
      return this.getModeForUser(userId, storyId);
    }
    if (userId) {
      return this.overrideStore.get(ModeOverrideStore.makeKey(userId)) ?? 'day';
    }
    return this.getCurrentMode();
  }

  getCurrentMode(): string {
    return this.context.getCurrentMode();
  }

  getAvailableModes(): string[] {
    return this.context.getAvailableModes();
  }
}
