import { Injectable } from '@nestjs/common';
import type {
  ReadingModeStrategy,
  RenderResult,
} from './reading-mode.strategy';

@Injectable()
export class ScrollModeStrategy implements ReadingModeStrategy {
  render(content: string): RenderResult {
    return {
      content,
      mode: 'scroll',
      styles: {
        backgroundColor: '#f5f5f5',
        color: '#333333',
        fontFamily: 'Verdana, sans-serif',
        lineHeight: '1.6',
        padding: '1.5rem',
        overflowY: 'auto',
      },
      metadata: {
        scrollable: true,
        layout: 'continuous',
      },
    };
  }

  getName(): string {
    return 'scroll';
  }
}
