import { Injectable } from '@nestjs/common';
import type { ReadingModeStrategy } from './reading-mode.strategy';

@Injectable()
export class DayModeStrategy implements ReadingModeStrategy {
  render(content: string): string {
    return content;
  }

  getName(): string {
    return 'day';
  }
}
