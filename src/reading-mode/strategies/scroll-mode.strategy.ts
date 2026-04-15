import { ReadingModeStrategy } from './reading-mode.strategy';

export class ScrollModeStrategy implements ReadingModeStrategy {
  render(content: string): string {
    return content;
  }

  getName(): string {
    return 'scroll';
  }
}
