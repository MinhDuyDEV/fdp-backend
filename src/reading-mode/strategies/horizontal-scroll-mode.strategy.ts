import { Injectable } from '@nestjs/common';
import type {
  ReadingModeStrategy,
  RenderResult,
} from './reading-mode.strategy';

@Injectable()
export class HorizontalScrollModeStrategy implements ReadingModeStrategy {
  render(content: string): RenderResult {
    return {
      content,
      mode: 'horizontal-scroll',
      styles: {
        backgroundColor: '#f5f5f5',
        color: '#333333',
        fontFamily: 'Verdana, sans-serif',
        lineHeight: '1.6',
        padding: '1.5rem',
        overflowX: 'auto',
      },
      metadata: {
        scrollable: true,
        layout: 'horizontal',
      },
    };
  }

  getName(): string {
    return 'horizontal-scroll';
  }
}
