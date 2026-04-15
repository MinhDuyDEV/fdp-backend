import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import type { CreateRatingDto } from './dto/create-rating.dto';
import type { Rating } from './entities/rating.entity';
import type { RatingsService } from './ratings.service';

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
  ): Promise<Rating[]> {
    return this.ratingsService.findByStory(storyId);
  }

  @Get('story/:storyId/summary')
  async getStoryRatingSummary(
    @Param('storyId', ParseIntPipe) storyId: number,
  ): Promise<{ storyId: number; averageScore: number; totalRatings: number }> {
    return this.ratingsService.getStoryRatingSummary(storyId);
  }
}
