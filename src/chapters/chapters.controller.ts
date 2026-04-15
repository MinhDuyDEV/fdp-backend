import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import type { PaginationQueryDto } from '../stories/dto/pagination-query.dto';
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
    @Query() pagination?: PaginationQueryDto,
  ): Promise<{
    data: Chapter[];
    meta: {
      totalItems: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.chaptersService.findByStory(storyId, pagination);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Chapter> {
    return this.chaptersService.findOne(id);
  }
}
