import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import type { PaginatedResult } from '../shared/interfaces/paginated-result.interface';
import { CreateRatingDto } from './dto/create-rating.dto';
import type { Rating } from './entities/rating.entity';
import { RatingsService } from './ratings.service';

type AuthenticatedRequest = {
  user: {
    userId: number;
  };
};

@Controller('ratings')
export class RatingsController {
  constructor(
    @Inject(RatingsService)
    private readonly ratingsService: RatingsService,
  ) {}

  @Post()
  async create(
    @Body(
      new ValidationPipe({ transform: true, expectedType: CreateRatingDto }),
    )
    dto: CreateRatingDto,
  ): Promise<Rating> {
    return this.ratingsService.create(dto);
  }

  @Get('story/:storyId')
  async findByStory(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Query(
      new ValidationPipe({ transform: true, expectedType: PaginationQueryDto }),
    )
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Rating>> {
    return this.ratingsService.findByStory(storyId, query);
  }

  @Get('story/:storyId/summary')
  async getStoryRatingSummary(
    @Param('storyId', ParseIntPipe) storyId: number,
  ): Promise<{ storyId: number; averageScore: number; totalRatings: number }> {
    return this.ratingsService.getStoryRatingSummary(storyId);
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    await this.ratingsService.delete(id, request.user.userId);
    return { message: 'Rating deleted' };
  }
}
