import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../stories/entities/story.entity';
import { User } from '../users/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
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

    const comment = this.commentRepository.create(dto);
    return this.commentRepository.save(comment);
  }

  async findByStory(storyId: number): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { storyId },
      order: { createdAt: 'DESC' },
    });
  }
}
