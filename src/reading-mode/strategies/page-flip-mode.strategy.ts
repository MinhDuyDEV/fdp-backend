import { ReadingModeStrategy } from './reading-mode.strategy';

export class PageFlipModeStrategy implements ReadingModeStrategy {
  render(content: string): string {
    return content;
  }

  getName(): string {
    return 'page-flip';
  }
}
