import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DayModeStrategy } from './day-mode.strategy';
import { NightModeStrategy } from './night-mode.strategy';
import { PageFlipModeStrategy } from './page-flip-mode.strategy';
import type {
  ReadingModeStrategy,
  RenderResult,
} from './reading-mode.strategy';
import { HorizontalScrollModeStrategy } from './horizontal-scroll-mode.strategy';
import { ScrollModeStrategy } from './scroll-mode.strategy';

/**
 * Strategy Pattern: ReadingModeContext
 *
 * Holds the current reading-mode strategy and dispatches render calls.
 * Unlike a bare context class, this is a NestJS @Injectable() that
 * receives all concrete strategies via DI and selects at runtime.
 */
@Injectable()
export class ReadingModeContext {
  private strategy: ReadingModeStrategy;
  private readonly strategyMap: Map<string, ReadingModeStrategy>;

  constructor(
    @Inject(DayModeStrategy)
    private readonly dayStrategy: DayModeStrategy,
    @Inject(NightModeStrategy)
    private readonly nightStrategy: NightModeStrategy,
    @Inject(ScrollModeStrategy)
    private readonly scrollStrategy: ScrollModeStrategy,
    @Inject(HorizontalScrollModeStrategy)
    private readonly horizontalScrollStrategy: HorizontalScrollModeStrategy,
    @Inject(PageFlipModeStrategy)
    private readonly pageFlipStrategy: PageFlipModeStrategy,
  ) {
    this.strategy = dayStrategy; // default
    this.strategyMap = new Map<string, ReadingModeStrategy>([
      ['day', dayStrategy],
      ['night', nightStrategy],
      ['scroll', scrollStrategy],
      ['horizontal-scroll', horizontalScrollStrategy],
      ['page-flip', pageFlipStrategy],
    ]);
  }

  setStrategy(modeName: string): void {
    const strategy = this.strategyMap.get(modeName);
    if (!strategy) {
      throw new BadRequestException(`Unknown reading mode: ${modeName}`);
    }
    this.strategy = strategy;
  }

  /**
   * Validate a mode name and return it without mutating shared state.
   * Prefer this over setStrategy + getCurrentMode for per-request operations.
   */
  validateMode(modeName: string): string {
    const strategy = this.strategyMap.get(modeName);
    if (!strategy) {
      throw new BadRequestException(`Unknown reading mode: ${modeName}`);
    }
    return strategy.getName();
  }

  /**
   * Render content with a specific mode without mutating the shared strategy.
   * Thread-safe for concurrent requests in a singleton context.
   */
  renderWithMode(content: string, modeName: string): RenderResult {
    const strategy = this.strategyMap.get(modeName);
    if (!strategy) {
      throw new BadRequestException(`Unknown reading mode: ${modeName}`);
    }
    return strategy.render(content);
  }

  render(content: string): RenderResult {
    return this.strategy.render(content);
  }

  getCurrentMode(): string {
    return this.strategy.getName();
  }

  getAvailableModes(): string[] {
    return Array.from(this.strategyMap.keys());
  }
}
