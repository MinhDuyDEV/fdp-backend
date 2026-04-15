import { Injectable } from '@nestjs/common';
import { ReadingModeStrategy } from './reading-mode.strategy';

@Injectable()
export class ScrollModeStrategy implements ReadingModeStrategy {
  render(content: string): string {
    return content;
  }

  getName(): string {
    return 'scroll';
  }
}
