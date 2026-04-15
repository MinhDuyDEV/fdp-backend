import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import type { ChaptersService } from './chapters.service';
import type { CreateChapterDto } from './dto/create-chapter.dto';
import type { Chapter } from './entities/chapter.entity';

@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  async create(@Body() dto: CreateChapterDto): Promise<Chapter> {
    return this.chaptersService.create(dto);
  }

  @Get('story/:storyId')
  async findByStory(
    @Param('storyId', ParseIntPipe) storyId: number,
  ): Promise<Chapter[]> {
    return this.chaptersService.findByStory(storyId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Chapter> {
    return this.chaptersService.findOne(id);
  }
}
