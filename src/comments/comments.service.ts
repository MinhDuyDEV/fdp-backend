import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import type { PaginatedResult } from '../shared/interfaces/paginated-result.interface';
import { Story } from '../stories/entities/story.entity';
import { User } from '../users/entities/user.entity';
import type { CreateCommentDto } from './dto/create-comment.dto';
import type { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async create(dto: CreateCommentDto): Promise<Comment> {
    // FK existence checks
    const story = await this.commentRepository.manager.findOne(Story, {
      where: { id: dto.storyId },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${dto.storyId} not found`);
    }

    const user = await this.commentRepository.manager.findOne(User, {
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${dto.userId} not found`);
    }

    const comment = this.commentRepository.create({
      ...dto,
      story,
      user,
    });
    return this.commentRepository.save(comment);
  }

  async findByStory(
    storyId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Comment>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await this.commentRepository.findAndCount({
      where: { storyId },
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async update(
    id: number,
    dto: UpdateCommentDto,
    currentUserId: number,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    if (comment.userId !== currentUserId) {
      throw new ForbiddenException('You can only update your own comments');
    }
    comment.content = dto.content;
    return this.commentRepository.save(comment);
  }

  async delete(id: number, currentUserId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    if (comment.userId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.commentRepository.remove(comment);
  }
}
