import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async create(@Body() dto: CreateCommentDto): Promise<Comment> {
    return this.commentsService.create(dto);
  }

  @Get('story/:storyId')
  async findByStory(
    @Param('storyId', ParseIntPipe) storyId: number,
  ): Promise<Comment[]> {
    return this.commentsService.findByStory(storyId);
  }
}
