import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ChaptersService } from '../chapters/chapters.service';
import type { Chapter } from '../chapters/entities/chapter.entity';
import { CommentsService } from '../comments/comments.service';
import type { Comment } from '../comments/entities/comment.entity';
import type { Rating } from '../ratings/entities/rating.entity';
import { RatingsService } from '../ratings/ratings.service';
import type { CreateStoryDto } from './dto/create-story.dto';
import type { PaginationQueryDto } from './dto/pagination-query.dto';
import type { Story } from './entities/story.entity';
import { StoriesService } from './stories.service';

/**
 * NOTE (I3 / auth): All endpoints trust client-supplied userId or are public.
 * TODO: Add auth guard once authentication is in scope.
 */
@Controller('stories')
export class StoriesController {
  constructor(
    @Inject(StoriesService)
    private readonly storiesService: StoriesService,
    @Inject(ChaptersService)
    private readonly chaptersService: ChaptersService,
    @Inject(CommentsService)
    private readonly commentsService: CommentsService,
    @Inject(RatingsService)
    private readonly ratingsService: RatingsService,
  ) {}

  @Post()
  async create(@Body() dto: CreateStoryDto): Promise<Story> {
    return this.storiesService.create(dto);
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto): Promise<
    | Story[]
    | {
        data: Story[];
        meta: {
          totalItems: number;
          itemsPerPage: number;
          totalPages: number;
          currentPage: number;
        };
      }
  > {
    return this.storiesService.findAll(query.genre, query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Story> {
    return this.storiesService.findOne(id);
  }

  @Get(':storyId/chapters')
  async findChapters(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Query() pagination?: PaginationQueryDto,
  ): Promise<
    | Chapter[]
    | {
        data: Chapter[];
        meta: {
          totalItems: number;
          itemsPerPage: number;
          totalPages: number;
          currentPage: number;
        };
      }
  > {
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
