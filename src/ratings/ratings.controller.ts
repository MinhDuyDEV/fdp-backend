import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import { PaginatedResult } from '../shared/interfaces/paginated-result.interface';
import { CreateRatingDto } from './dto/create-rating.dto';
import { Rating } from './entities/rating.entity';
import { RatingsService } from './ratings.service';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  async create(@Body() dto: CreateRatingDto): Promise<Rating> {
    return this.ratingsService.create(dto);
  }

  @Get('story/:storyId')
  async findByStory(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Query() query: PaginationQueryDto,
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
  ): Promise<{ message: string }> {
    await this.ratingsService.delete(id);
    return { message: 'Rating deleted' };
  }
}
