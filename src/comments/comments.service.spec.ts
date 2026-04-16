/* eslint-disable @typescript-eslint/unbound-method */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { Story } from '../stories/entities/story.entity';
import type { User } from '../users/entities/user.entity';
import { CommentsService } from './comments.service';
import type { CreateCommentDto } from './dto/create-comment.dto';
import type { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';

describe('CommentsService', () => {
  let service: CommentsService;
  let repository: jest.Mocked<Repository<Comment>>;
  let mockManager: { findOne: jest.Mock };

  const mockUser: User = { id: 1 } as User;
  const mockStory: Story = { id: 1 } as Story;

  const mockComment: Comment = {
    id: 1,
    content: 'This is a test comment',
    userId: 1,
    storyId: 1,
    user: mockUser,
    story: mockStory,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepositoryFactory = () => ({
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    manager: mockManager,
  });

  beforeEach(async () => {
    mockManager = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useFactory: mockRepositoryFactory,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    repository = module.get(getRepositoryToken(Comment));
  });

  describe('create', () => {
    const createDto: CreateCommentDto = {
      content: 'This is a test comment',
      userId: 1,
      storyId: 1,
    };

    it('should create and return a comment', async () => {
      mockManager.findOne
        .mockResolvedValueOnce(mockStory)
        .mockResolvedValueOnce(mockUser);
      repository.create.mockReturnValue(mockComment);
      repository.save.mockResolvedValue(mockComment);

      const result = await service.create(createDto);

      expect(mockManager.findOne).toHaveBeenCalledTimes(2);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockComment);
      expect(result).toEqual(mockComment);
    });

    it('should throw NotFoundException when story not found', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Story with id 1 not found',
      );
    });
  });

  describe('findByStory', () => {
    it('should return paginated results with data, total, page, limit', async () => {
      const comments = [mockComment];
      repository.findAndCount.mockResolvedValue([comments, 1]);

      const result = await service.findByStory(1, { page: 1, limit: 20 });

      expect(result).toEqual({
        data: comments,
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { storyId: 1 },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });

    it('should use default pagination when not provided', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findByStory(1, {});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('update', () => {
    const updateDto: UpdateCommentDto = { content: 'Updated content' };

    it('should update comment content and return it', async () => {
      const updatedComment = { ...mockComment, content: 'Updated content' };
      repository.findOne.mockResolvedValue({ ...mockComment });
      repository.save.mockResolvedValue(updatedComment);

      const result = await service.update(1, updateDto, 1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repository.save).toHaveBeenCalled();
      expect(result.content).toBe('Updated content');
    });

    it('should throw NotFoundException when comment not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(999, updateDto, 1)).rejects.toThrow(
        'Comment with id 999 not found',
      );
    });

    it('should throw ForbiddenException when user updates another user comment', async () => {
      repository.findOne.mockResolvedValue({ ...mockComment, userId: 2 });

      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.update(1, updateDto, 1)).rejects.toThrow(
        'You can only update your own comments',
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should remove a comment', async () => {
      repository.findOne.mockResolvedValue(mockComment);
      repository.remove.mockResolvedValue(mockComment);

      await service.delete(1, 1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repository.remove).toHaveBeenCalledWith(mockComment);
    });

    it('should throw NotFoundException when comment not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.delete(999, 1)).rejects.toThrow(NotFoundException);
      await expect(service.delete(999, 1)).rejects.toThrow(
        'Comment with id 999 not found',
      );
    });

    it('should throw ForbiddenException when user deletes another user comment', async () => {
      repository.findOne.mockResolvedValue({ ...mockComment, userId: 2 });

      await expect(service.delete(1, 1)).rejects.toThrow(ForbiddenException);
      await expect(service.delete(1, 1)).rejects.toThrow(
        'You can only delete your own comments',
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
