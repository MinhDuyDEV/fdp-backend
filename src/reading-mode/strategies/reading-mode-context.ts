import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DayModeStrategy } from './day-mode.strategy';
import { NightModeStrategy } from './night-mode.strategy';
import { PageFlipModeStrategy } from './page-flip-mode.strategy';
import type {
  ReadingModeStrategy,
  RenderResult,
} from './reading-mode.strategy';
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
    @Inject(PageFlipModeStrategy)
    private readonly pageFlipStrategy: PageFlipModeStrategy,
  ) {
    this.strategy = dayStrategy; // default
    this.strategyMap = new Map<string, ReadingModeStrategy>([
      ['day', dayStrategy],
      ['night', nightStrategy],
      ['scroll', scrollStrategy],
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
