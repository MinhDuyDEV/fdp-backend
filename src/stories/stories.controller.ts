import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ChaptersService } from '../chapters/chapters.service';
import { Chapter } from '../chapters/entities/chapter.entity';
import { CommentsService } from '../comments/comments.service';
import { Comment } from '../comments/entities/comment.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { RatingsService } from '../ratings/ratings.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { Story, StoryGenre } from './entities/story.entity';
import { StoriesService } from './stories.service';

@Controller('stories')
export class StoriesController {
  constructor(
    private readonly storiesService: StoriesService,
    private readonly chaptersService: ChaptersService,
    private readonly commentsService: CommentsService,
    private readonly ratingsService: RatingsService,
  ) {}

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

  @Get(':storyId/chapters')
  async findChapters(
    @Param('storyId', ParseIntPipe) storyId: number,
  ): Promise<Chapter[]> {
    return this.chaptersService.findByStory(storyId);
  }

  @Get(':storyId/comments')
  async findComments(
    @Param('storyId', ParseIntPipe) storyId: number,
  ): Promise<Comment[]> {
    return this.commentsService.findByStory(storyId);
  }

  @Get(':storyId/ratings')
  async findRatings(
    @Param('storyId', ParseIntPipe) storyId: number,
  ): Promise<Rating[]> {
    return this.ratingsService.findByStory(storyId);
  }

  @Get(':storyId/ratings/summary')
  async getRatingsSummary(
    @Param('storyId', ParseIntPipe) storyId: number,
  ): Promise<{ storyId: number; averageScore: number; totalRatings: number }> {
    return this.ratingsService.getStoryRatingSummary(storyId);
  }
}
