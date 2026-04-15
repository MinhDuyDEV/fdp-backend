import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import type { CreateStoryDto } from './dto/create-story.dto';
import type { Story, StoryGenre } from './entities/story.entity';
import type { StoriesService } from './stories.service';

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  async create(@Body() dto: CreateStoryDto): Promise<Story> {
    return this.storiesService.create(dto);
  }

  @Get()
  async findAll(@Query('genre') genre?: StoryGenre): Promise<Story[]> {
    return this.storiesService.findAll(genre);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Story> {
    return this.storiesService.findOne(id);
  }
}
