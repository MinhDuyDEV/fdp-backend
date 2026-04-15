import { ReadingModeStrategy } from './reading-mode.strategy';

export class DayModeStrategy implements ReadingModeStrategy {
  render(content: string): string {
    return content;
  }

  getName(): string {
    return 'day';
  }
}
