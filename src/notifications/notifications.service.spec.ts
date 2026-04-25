import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { NotificationQueryDto } from './dto/notification-query.dto';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import {
  ChapterUpdateSubject,
  InAppReaderObserver,
  ReaderObserverFactory,
} from './observers/chapter-update.observer';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockNotificationRepository: Partial<Repository<Notification>>;
  let mockSubject: Partial<ChapterUpdateSubject>;
  let mockFactory: Partial<ReaderObserverFactory>;

  beforeEach(async () => {
    mockSubject = {
      hasObserver: jest.fn(),
      attach: jest.fn(),
      detach: jest.fn(),
      notifyForStory: jest.fn(),
      getSubscribedUserIds: jest.fn(),
      getNotificationLog: jest.fn(),
      getObserverCount: jest.fn(),
    };

    mockFactory = {
      create: jest.fn(),
    };

    mockNotificationRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: ChapterUpdateSubject,
          useValue: mockSubject,
        },
        {
          provide: ReaderObserverFactory,
          useValue: mockFactory,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    mockNotificationRepository = module.get(getRepositoryToken(Notification));
    mockSubject = module.get(ChapterUpdateSubject);
    mockFactory = module.get(ReaderObserverFactory);
  });

  describe('subscribe', () => {
    it('should create observer and attach to subject', () => {
      const userId = 1;
      const storyId = 10;
      const mockObserver = new InAppReaderObserver();

      (mockSubject.hasObserver as jest.Mock).mockReturnValue(false);
      (mockFactory.create as jest.Mock).mockReturnValue(mockObserver);

      const result = service.subscribe(userId, storyId);

      expect(mockSubject.hasObserver).toHaveBeenCalledWith(userId, storyId);
      expect(mockFactory.create).toHaveBeenCalledWith(userId, storyId);
      expect(mockSubject.attach).toHaveBeenCalledWith(mockObserver);
      expect(result.message).toBe(
        `User ${userId} subscribed to story ${storyId} updates`,
      );
    });

    it('should return "already subscribed" if observer exists', () => {
      const userId = 1;
      const storyId = 10;

      (mockSubject.hasObserver as jest.Mock).mockReturnValue(true);

      const result = service.subscribe(userId, storyId);

      expect(mockSubject.hasObserver).toHaveBeenCalledWith(userId, storyId);
      expect(mockFactory.create).not.toHaveBeenCalled();
      expect(mockSubject.attach).not.toHaveBeenCalled();
      expect(result.message).toBe(
        `User ${userId} is already subscribed to story ${storyId}`,
      );
    });
  });

  describe('unsubscribe', () => {
    it('should detach observer from subject', () => {
      const userId = 1;
      const storyId = 10;

      (mockSubject.hasObserver as jest.Mock).mockReturnValue(true);

      const result = service.unsubscribe(userId, storyId);

      expect(mockSubject.hasObserver).toHaveBeenCalledWith(userId, storyId);
      expect(mockSubject.detach).toHaveBeenCalledWith(userId, storyId);
      expect(result.message).toBe(
        `User ${userId} unsubscribed from story ${storyId} updates`,
      );
    });

    it('should return "not subscribed" if no observer', () => {
      const userId = 1;
      const storyId = 10;

      (mockSubject.hasObserver as jest.Mock).mockReturnValue(false);

      const result = service.unsubscribe(userId, storyId);

      expect(mockSubject.hasObserver).toHaveBeenCalledWith(userId, storyId);
      expect(mockSubject.detach).not.toHaveBeenCalled();
      expect(result.message).toBe(
        `User ${userId} is not subscribed to story ${storyId}`,
      );
    });
  });

  describe('notifyChapterUpdate', () => {
    it('should call notifyForStory on subject AND persist notifications to DB', async () => {
      const storyId = 10;
      const chapterId = 5;
      const chapterNumber = 3;
      const chapterTitle = 'The Beginning';
      const userIds = [1, 2, 3];
      const expectedMessage = `Chương ${chapterNumber}: "${chapterTitle}" vừa được cập nhật!`;

      (mockSubject.getSubscribedUserIds as jest.Mock).mockReturnValue(userIds);
      (mockSubject.notifyForStory as jest.Mock).mockReturnValue(undefined);
      (mockNotificationRepository.create as jest.Mock).mockReturnValue(
        userIds.map((userId) => ({
          userId,
          storyId,
          chapterId,
          message: expectedMessage,
          isRead: false,
        })),
      );
      (mockNotificationRepository.save as jest.Mock).mockResolvedValue([]);

      await service.notifyChapterUpdate(storyId, chapterId, chapterNumber, chapterTitle);

      expect(mockSubject.notifyForStory).toHaveBeenCalledWith(
        storyId,
        expectedMessage,
      );
      expect(mockSubject.getSubscribedUserIds).toHaveBeenCalledWith(storyId);
      expect(mockNotificationRepository.create).toHaveBeenCalledTimes(
        userIds.length,
      );
      expect(mockNotificationRepository.save).toHaveBeenCalled();
    });

    it('should not persist when no subscribers', async () => {
      const storyId = 10;
      const chapterId = 5;
      const chapterNumber = 3;
      const chapterTitle = 'The Beginning';

      (mockSubject.getSubscribedUserIds as jest.Mock).mockReturnValue([]);
      (mockSubject.notifyForStory as jest.Mock).mockReturnValue(undefined);

      await service.notifyChapterUpdate(storyId, chapterId, chapterNumber, chapterTitle);

      expect(mockSubject.notifyForStory).toHaveBeenCalled();
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByUser', () => {
    it('should return paginated notifications for a user', async () => {
      const userId = 1;
      const query: NotificationQueryDto = { page: 1, limit: 10 };
      const mockNotifications: Partial<Notification>[] = [
        { id: 1, userId, storyId: 10, message: 'Test 1', isRead: false },
        { id: 2, userId, storyId: 10, message: 'Test 2', isRead: true },
      ];

      (mockNotificationRepository.findAndCount as jest.Mock).mockResolvedValue([
        mockNotifications,
        2,
      ]);

      const result = await service.findByUser(userId, userId, query);

      expect(mockNotificationRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(mockNotifications);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter unread-only when unreadOnly=true', async () => {
      const userId = 1;
      const query: NotificationQueryDto = {
        page: 1,
        limit: 10,
        unreadOnly: true,
      };
      const mockNotifications: Partial<Notification>[] = [
        { id: 1, userId, storyId: 10, message: 'Unread 1', isRead: false },
      ];

      (mockNotificationRepository.findAndCount as jest.Mock).mockResolvedValue([
        mockNotifications,
        1,
      ]);

      const result = await service.findByUser(userId, userId, query);

      expect(mockNotificationRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId, isRead: false },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result.data).toEqual(mockNotifications);
      expect(result.total).toBe(1);
    });

    it('should throw ForbiddenException when requesting other user notifications', async () => {
      const query: NotificationQueryDto = { page: 1, limit: 10 };

      await expect(service.findByUser(2, 1, query)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findByUser(2, 1, query)).rejects.toThrow(
        'You can only view your own notifications',
      );
      expect(mockNotificationRepository.findAndCount).not.toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('should set isRead=true and save', async () => {
      const notificationId = 1;
      const mockNotification: Partial<Notification> = {
        id: notificationId,
        userId: 1,
        storyId: 10,
        message: 'Test',
        isRead: false,
      };

      (mockNotificationRepository.findOne as jest.Mock).mockResolvedValue(
        mockNotification,
      );
      (mockNotificationRepository.save as jest.Mock).mockResolvedValue({
        ...mockNotification,
        isRead: true,
      });

      const result = await service.markAsRead(notificationId, 1);

      expect(mockNotificationRepository.findOne).toHaveBeenCalledWith({
        where: { id: notificationId },
      });
      expect(result.isRead).toBe(true);
      expect(mockNotificationRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when notification not found', async () => {
      const notificationId = 999;

      (mockNotificationRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.markAsRead(notificationId, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.markAsRead(notificationId, 1)).rejects.toThrow(
        `Notification with id ${notificationId} not found`,
      );
    });

    it('should throw ForbiddenException when marking another user notification as read', async () => {
      const notificationId = 1;
      (mockNotificationRepository.findOne as jest.Mock).mockResolvedValue({
        id: notificationId,
        userId: 2,
        storyId: 10,
        message: 'Test',
        isRead: false,
      });

      await expect(service.markAsRead(notificationId, 1)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.markAsRead(notificationId, 1)).rejects.toThrow(
        'You can only mark your own notifications as read',
      );
      expect(mockNotificationRepository.save).not.toHaveBeenCalled();
    });
  });
});
