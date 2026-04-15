import { Injectable } from '@nestjs/common';
import { ReadingModeStrategy } from './strategies/reading-mode.strategy';
import { ReadingModeContext } from './strategies/reading-mode-context';

@Injectable()
export class ReadingModeService {
  constructor(private readonly context: ReadingModeContext) {}

  setMode(mode: string): string {
    this.context.setStrategy(mode);
    return this.context.getCurrentMode();
  }

  render(content: string, mode?: string): string {
    if (mode) {
      this.context.setStrategy(mode);
    }
    return this.context.render(content);
  }

  getCurrentMode(): string {
    return this.context.getCurrentMode();
  }

  getAvailableModes(): string[] {
    return this.context.getAvailableModes();
  }

  getStrategy(mode: string): ReadingModeStrategy {
    // Force-select the strategy to validate mode, then return info
    this.context.setStrategy(mode);
    return {
      render: (c: string) => this.context.render(c),
      getName: () => this.context.getCurrentMode(),
    };
  }
}
