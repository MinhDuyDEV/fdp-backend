import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import type { ChaptersService } from '../chapters/chapters.service';
import type { Chapter } from '../chapters/entities/chapter.entity';
import type { CommentsService } from '../comments/comments.service';
import type { Comment } from '../comments/entities/comment.entity';
import type { Rating } from '../ratings/entities/rating.entity';
import type { RatingsService } from '../ratings/ratings.service';
import type { CreateStoryDto } from './dto/create-story.dto';
import type { PaginationQueryDto } from './dto/pagination-query.dto';
import type { Story, StoryGenre } from './entities/story.entity';
import type { StoriesService } from './stories.service';

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
  async findAll(
    @Query('genre') genre?: StoryGenre,
    @Query() pagination?: PaginationQueryDto,
  ): Promise<{
    data: Story[];
    meta: {
      totalItems: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    return this.storiesService.findAll(genre, pagination);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Story> {
    return this.storiesService.findOne(id);
  }

  @Get(':storyId/chapters')
  async findChapters(
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

  @Get(':storyId/chapters/:chapterId/next')
  async nextChapter(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
  ): Promise<{ next: Chapter | null }> {
    const next = await this.chaptersService.nextChapter(storyId, chapterId);
    return { next };
  }

  @Get(':storyId/chapters/:chapterId/previous')
  async previousChapter(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
  ): Promise<{ previous: Chapter | null }> {
    const previous = await this.chaptersService.previousChapter(
      storyId,
      chapterId,
    );
    return { previous };
  }
}
