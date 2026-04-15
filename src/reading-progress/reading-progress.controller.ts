import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ReadingProgress } from './entities/reading-progress.entity';
import { ReadingProgressService } from './reading-progress.service';
import { SaveProgressDto } from './dto/save-progress.dto';

@Controller('reading-progress')
export class ReadingProgressController {
  constructor(private readonly progressService: ReadingProgressService) {}

  @Post()
  async saveProgress(
    @Body() dto: SaveProgressDto,
  ): Promise<ReadingProgress> {
    return this.progressService.saveProgress(
      dto.userId,
      dto.storyId,
      dto.chapterId,
      dto.scrollPosition,
      dto.readingMode,
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
