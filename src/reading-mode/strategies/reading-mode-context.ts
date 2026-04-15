import { ReadingModeStrategy } from './reading-mode.strategy';

export class ReadingModeContext {
  constructor(private strategy: ReadingModeStrategy) {}

  setStrategy(strategy: ReadingModeStrategy): void {
    this.strategy = strategy;
  }

  render(content: string): string {
    return this.strategy.render(content);
  }

  getCurrentMode(): string {
    return this.strategy.getName();
  }
}
