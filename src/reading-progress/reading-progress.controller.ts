import {
  Body,
  Controller,
  Get,
  Inject,
  ParseIntPipe,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { SaveProgressDto } from './dto/save-progress.dto';
import type { ReadingProgress } from './entities/reading-progress.entity';
import { ReadingProgressService } from './reading-progress.service';

@Controller('reading-progress')
export class ReadingProgressController {
  constructor(
    @Inject(ReadingProgressService)
    private readonly progressService: ReadingProgressService,
  ) {}

  @Post()
  async saveProgress(
    @Body(
      new ValidationPipe({ transform: true, expectedType: SaveProgressDto }),
    )
    dto: SaveProgressDto,
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
    @Query('userId', ParseIntPipe) userId: number,
    @Query('storyId', ParseIntPipe) storyId: number,
  ): Promise<ReadingProgress | null> {
    return this.progressService.findProgress(userId, storyId);
  }
}
