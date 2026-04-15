import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import type { ReadingProgress } from './entities/reading-progress.entity';
import type { ReadingProgressService } from './reading-progress.service';

@Controller('reading-progress')
export class ReadingProgressController {
  constructor(private readonly progressService: ReadingProgressService) {}

  @Post()
  async saveProgress(
    @Body()
    body: {
      userId: number;
      storyId: number;
      chapterId: number;
      scrollPosition: number;
      readingMode: string;
    },
  ): Promise<ReadingProgress> {
    return this.progressService.saveProgress(
      body.userId,
      body.storyId,
      body.chapterId,
      body.scrollPosition,
      body.readingMode,
    );
  }

  @Get()
  async getProgress(
    @Query('userId') userId: number,
    @Query('storyId') storyId: number,
  ): Promise<ReadingProgress> {
    return this.progressService.getProgress(userId, storyId);
  }
}
