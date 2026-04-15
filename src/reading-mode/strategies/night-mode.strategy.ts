import { ReadingModeStrategy } from './reading-mode.strategy';

export class NightModeStrategy implements ReadingModeStrategy {
  render(content: string): string {
    return content;
  }

  getName(): string {
    return 'night';
  }
}
