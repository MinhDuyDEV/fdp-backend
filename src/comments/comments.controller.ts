import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import type { PaginatedResult } from '../shared/interfaces/paginated-result.interface';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import type { Comment } from './entities/comment.entity';

type AuthenticatedRequest = {
  user: {
    userId: number;
  };
};

@Controller('comments')
export class CommentsController {
  constructor(
    @Inject(CommentsService)
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  async create(
    @Body(
      new ValidationPipe({ transform: true, expectedType: CreateCommentDto }),
    )
    dto: CreateCommentDto,
  ): Promise<Comment> {
    return this.commentsService.create(dto);
  }

  @Get('story/:storyId')
  async findByStory(
    @Param('storyId', ParseIntPipe) storyId: number,
    @Query(
      new ValidationPipe({ transform: true, expectedType: PaginationQueryDto }),
    )
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Comment>> {
    return this.commentsService.findByStory(storyId, query);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(
      new ValidationPipe({ transform: true, expectedType: UpdateCommentDto }),
    )
    dto: UpdateCommentDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<Comment> {
    return this.commentsService.update(id, dto, request.user.userId);
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    await this.commentsService.delete(id, request.user.userId);
    return { message: 'Comment deleted' };
  }
}
