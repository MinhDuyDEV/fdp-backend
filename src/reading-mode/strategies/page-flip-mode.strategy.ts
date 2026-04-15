import { Injectable } from '@nestjs/common';
import type {
  ReadingModeStrategy,
  RenderResult,
} from './reading-mode.strategy';

@Injectable()
export class PageFlipModeStrategy implements ReadingModeStrategy {
  render(content: string): RenderResult {
    const words = content.split(/\s+/);
    const wordsPerPage = 200;
    const pages: string[][] = [];
    for (let i = 0; i < words.length; i += wordsPerPage) {
      pages.push(words.slice(i, i + wordsPerPage));
    }
    if (pages.length === 0) {
      pages.push([]);
    }

    return {
      content,
      mode: 'page-flip',
      styles: {
        backgroundColor: '#faf8f0',
        color: '#2c2c2c',
        fontFamily: 'Palatino, serif',
        lineHeight: '1.9',
        padding: '3rem',
        pageBreakInside: 'avoid',
      },
      metadata: {
        paginated: true,
        totalPages: pages.length,
        pages: pages.map((p) => p.join(' ')),
      },
    };
  }

  getName(): string {
    return 'page-flip';
  }
}
