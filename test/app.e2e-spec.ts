/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let user1Id: number;
  let user2Id: number;
  let baseStoryId: number;
  let baseChapterId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const suffix = Date.now();

    const user1Res = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: `reader-one-${suffix}`,
        email: `reader-one-${suffix}@example.com`,
      })
      .expect(201);
    user1Id = user1Res.body.id as number;

    const user2Res = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: `reader-two-${suffix}`,
        email: `reader-two-${suffix}@example.com`,
      })
      .expect(201);
    user2Id = user2Res.body.id as number;

    const storyRes = await request(app.getHttpServer())
      .post('/stories')
      .send({
        title: `Seed Story ${suffix}`,
        description: 'Seed story for e2e',
        author: 'Seed Author',
        genre: 'Action',
      })
      .expect(201);
    baseStoryId = storyRes.body.id as number;

    const chapterRes = await request(app.getHttpServer())
      .post('/chapters')
      .send({
        title: 'Seed Chapter 1',
        content: 'Seed content',
        chapterNumber: 1,
        storyId: baseStoryId,
      })
      .expect(201);
    baseChapterId = chapterRes.body.id as number;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health check', () => {
    it('GET / returns 200', () => {
      return request(app.getHttpServer()).get('/').expect(200);
    });
  });

  describe('DTO Validation (Task A)', () => {
    it('POST /stories with empty body returns 400', () => {
      return request(app.getHttpServer()).post('/stories').send({}).expect(400);
    });

    it('POST /stories with invalid genre returns 400', () => {
      return request(app.getHttpServer())
        .post('/stories')
        .send({
          title: 'Test',
          description: 'Desc',
          author: 'Author',
          genre: 'InvalidGenre',
        })
        .expect(400);
    });

    it('POST /stories with valid payload is accepted', () => {
      return request(app.getHttpServer())
        .post('/stories')
        .send({
          title: 'Test Story',
          description: 'A test story',
          author: 'Test Author',
          genre: 'Action',
        })
        .expect(201);
    });
  });

  describe('Stories - Factory Pattern (Task C)', () => {
    it('POST /stories creates a story with genre Action', async () => {
      const res = await request(app.getHttpServer())
        .post('/stories')
        .send({
          title: 'Action Hero',
          description: 'An action story',
          author: 'Author A',
          genre: 'Action',
        })
        .expect(201);

      expect(res.body.genre).toBe('Action');
      expect(res.body.title).toBe('Action Hero');
    });

    it('POST /stories creates a story with genre Horror', async () => {
      const res = await request(app.getHttpServer())
        .post('/stories')
        .send({
          title: 'Horror Night',
          description: 'A horror story',
          author: 'Author H',
          genre: 'Horror',
        })
        .expect(201);

      expect(res.body.genre).toBe('Horror');
    });

    it('GET /stories returns paginated stories', async () => {
      const res = await request(app.getHttpServer())
        .get('/stories')
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.totalItems).toBeGreaterThan(0);
      expect(res.body.meta.currentPage).toBe(1);
    });

    it('GET /stories?genre=Action filters by genre with pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/stories?genre=Action&limit=5&page=1')
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });
  });

  describe('Reading Progress - Singleton Pattern (Task D)', () => {
    it('POST /reading-progress saves progress', async () => {
      const res = await request(app.getHttpServer())
        .post('/reading-progress')
        .send({
          userId: user1Id,
          storyId: baseStoryId,
          chapterId: baseChapterId,
          scrollPosition: 150,
          readingMode: 'day',
        })
        .expect(201);

      expect(res.body.userId).toBe(user1Id);
      expect(res.body.chapterId).toBe(baseChapterId);
    });

    it('GET /reading-progress retrieves saved progress', async () => {
      const res = await request(app.getHttpServer())
        .get(`/reading-progress?userId=${user1Id}&storyId=${baseStoryId}`)
        .expect(200);

      expect(res.body.userId).toBe(user1Id);
    });
  });

  describe('Reading Mode - Strategy Pattern (Task E)', () => {
    it('GET /reading-mode/modes returns available modes', async () => {
      const res = await request(app.getHttpServer())
        .get('/reading-mode/modes')
        .expect(200);

      expect(res.body.modes).toContain('day');
      expect(res.body.modes).toContain('night');
      expect(res.body.modes).toContain('scroll');
      expect(res.body.modes).toContain('page-flip');
    });

    it('POST /reading-mode/set switches mode', async () => {
      const res = await request(app.getHttpServer())
        .post('/reading-mode/set')
        .send({ userId: user1Id, mode: 'night' })
        .expect(201);

      expect(res.body.mode).toBe('night');
    });

    it('POST /reading-mode/render renders content with distinct output', async () => {
      const res = await request(app.getHttpServer())
        .post('/reading-mode/render')
        .send({ content: 'Test content', mode: 'scroll' })
        .expect(201);

      expect(res.body.content).toBe('Test content');
      expect(res.body.mode).toBe('scroll');
      expect(res.body.styles).toBeDefined();
    });

    it('Day and night render produce different styles', async () => {
      const dayRes = await request(app.getHttpServer())
        .post('/reading-mode/render')
        .send({ content: 'Hello', mode: 'day' })
        .expect(201);

      const nightRes = await request(app.getHttpServer())
        .post('/reading-mode/render')
        .send({ content: 'Hello', mode: 'night' })
        .expect(201);

      expect(dayRes.body.styles).toBeDefined();
      expect(nightRes.body.styles).toBeDefined();
      expect(dayRes.body.styles.backgroundColor).not.toBe(
        nightRes.body.styles.backgroundColor,
      );
    });

    it('POST /reading-mode/set with invalid mode returns 400', async () => {
      return request(app.getHttpServer())
        .post('/reading-mode/set')
        .send({ userId: user1Id, mode: 'invalid-mode' })
        .expect(400);
    });
  });

  describe('Notifications - Observer Pattern (Task F)', () => {
    it('POST /notifications/subscribe subscribes a user to a story', async () => {
      const res = await request(app.getHttpServer())
        .post('/notifications/subscribe')
        .send({ userId: user1Id, storyId: baseStoryId })
        .expect(201);

      expect(res.body.message).toContain('subscribed');
    });

    it('GET /notifications returns notification log', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications')
        .expect(200);

      expect(Array.isArray(res.body.notifications)).toBe(true);
    });

    it('POST /notifications/unsubscribe removes a user from a story', async () => {
      const res = await request(app.getHttpServer())
        .post('/notifications/unsubscribe')
        .send({ userId: user1Id, storyId: baseStoryId })
        .expect(201);

      expect(res.body.message).toContain('unsubscribed');
    });
  });

  describe('Chapters with Notification (Task G)', () => {
    it('POST /chapters creates a chapter and triggers notification', async () => {
      // Subscribe to story 1 first to see the notification
      await request(app.getHttpServer())
        .post('/notifications/subscribe')
        .send({ userId: user2Id, storyId: baseStoryId })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/chapters')
        .send({
          title: 'Chapter 1',
          content: 'The beginning...',
          chapterNumber: 1,
          storyId: baseStoryId,
        })
        .expect(201);

      expect(res.body.title).toBe('Chapter 1');

      // Verify notification was created
      const notifs = await request(app.getHttpServer())
        .get('/notifications')
        .expect(200);

      expect(notifs.body.notifications.length).toBeGreaterThan(0);
    });

    it('GET /stories/:storyId/chapters returns paginated chapters', async () => {
      const res = await request(app.getHttpServer())
        .get(`/stories/${baseStoryId}/chapters`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
    });
  });

  describe('Comments (Task H)', () => {
    it('POST /comments creates a comment', async () => {
      const res = await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Great story!',
          userId: user1Id,
          storyId: baseStoryId,
        })
        .expect(201);

      expect(res.body.content).toBe('Great story!');
    });

    it('GET /stories/:storyId/comments returns comments', async () => {
      const res = await request(app.getHttpServer())
        .get(`/stories/${baseStoryId}/comments`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('Ratings with Aggregation (Task I)', () => {
    it('POST /ratings creates a rating', async () => {
      const res = await request(app.getHttpServer())
        .post('/ratings')
        .send({
          score: 4,
          userId: user2Id,
          storyId: baseStoryId,
        })
        .expect(201);

      expect(res.body.score).toBe(4);
    });

    it('POST /ratings upserts existing rating', async () => {
      const res = await request(app.getHttpServer())
        .post('/ratings')
        .send({
          score: 5,
          userId: user2Id,
          storyId: baseStoryId,
        })
        .expect(201);

      expect(res.body.score).toBe(5);
    });

    it('GET /stories/:storyId/ratings returns ratings', async () => {
      const res = await request(app.getHttpServer())
        .get(`/stories/${baseStoryId}/ratings`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /stories/:storyId/ratings/summary returns aggregate', async () => {
      const res = await request(app.getHttpServer())
        .get(`/stories/${baseStoryId}/ratings/summary`)
        .expect(200);

      expect(res.body.storyId).toBe(baseStoryId);
      expect(res.body.averageScore).toBeGreaterThan(0);
      expect(res.body.totalRatings).toBeGreaterThan(0);
    });
  });

  describe('Phase 2: DTO Validation', () => {
    it('POST /reading-progress with negative scrollPosition returns 400', async () => {
      return request(app.getHttpServer())
        .post('/reading-progress')
        .send({
          userId: user1Id,
          storyId: baseStoryId,
          chapterId: baseChapterId,
          scrollPosition: -5,
          readingMode: 'day',
        })
        .expect(400);
    });

    it('POST /reading-progress with invalid readingMode returns 400', async () => {
      return request(app.getHttpServer())
        .post('/reading-progress')
        .send({
          userId: user1Id,
          storyId: baseStoryId,
          chapterId: baseChapterId,
          scrollPosition: 0,
          readingMode: 'invalid-mode',
        })
        .expect(400);
    });
  });

  describe('Phase 2: FK Validation (404 on invalid refs)', () => {
    it('POST /chapters with invalid storyId returns 404', async () => {
      return request(app.getHttpServer())
        .post('/chapters')
        .send({
          title: 'Orphan Chapter',
          content: 'No story',
          chapterNumber: 99,
          storyId: 99999,
        })
        .expect(404);
    });

    it('POST /comments with invalid userId returns 404', async () => {
      return request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Orphan comment',
          userId: 99999,
          storyId: baseStoryId,
        })
        .expect(404);
    });

    it('POST /ratings with invalid storyId returns 404', async () => {
      return request(app.getHttpServer())
        .post('/ratings')
        .send({
          score: 3,
          userId: user1Id,
          storyId: 99999,
        })
        .expect(404);
    });
  });

  describe('Phase 2: Chapter Navigation', () => {
    it('POST /chapters creates a second chapter', async () => {
      const res = await request(app.getHttpServer())
        .post('/chapters')
        .send({
          title: 'Chapter 2',
          content: 'The middle...',
          chapterNumber: 2,
          storyId: baseStoryId,
        })
        .expect(201);

      expect(res.body.chapterNumber).toBe(2);
    });

    it('GET /stories/:storyId/chapters/:chapterId/next returns next chapter', async () => {
      // Get chapter 1 id first
      const chaptersRes = await request(app.getHttpServer())
        .get(`/stories/${baseStoryId}/chapters`)
        .expect(200);

      const chapter1 = chaptersRes.body.data.find(
        (c: { chapterNumber: number }) => c.chapterNumber === 1,
      );
      if (!chapter1) return;

      const res = await request(app.getHttpServer())
        .get(`/stories/${baseStoryId}/chapters/${chapter1.id}/next`)
        .expect(200);

      expect(res.body.next).not.toBeNull();
      expect(res.body.next.chapterNumber).toBe(2);
    });

    it('GET /stories/:storyId/chapters/:chapterId/previous returns previous chapter', async () => {
      const chaptersRes = await request(app.getHttpServer())
        .get(`/stories/${baseStoryId}/chapters`)
        .expect(200);

      const chapter2 = chaptersRes.body.data.find(
        (c: { chapterNumber: number }) => c.chapterNumber === 2,
      );
      if (!chapter2) return;

      const res = await request(app.getHttpServer())
        .get(`/stories/${baseStoryId}/chapters/${chapter2.id}/previous`)
        .expect(200);

      expect(res.body.previous).not.toBeNull();
      expect(res.body.previous.chapterNumber).toBe(1);
    });

    it('Last chapter next returns null', async () => {
      const chaptersRes = await request(app.getHttpServer())
        .get(`/stories/${baseStoryId}/chapters`)
        .expect(200);

      const lastChapter =
        chaptersRes.body.data[chaptersRes.body.data.length - 1];
      if (!lastChapter) return;

      const res = await request(app.getHttpServer())
        .get(`/stories/${baseStoryId}/chapters/${lastChapter.id}/next`)
        .expect(200);

      expect(res.body.next).toBeNull();
    });
  });

  describe('Phase 2: Per-User Reading Mode', () => {
    it('GET /reading-mode/current returns the persisted user-specific mode', async () => {
      await request(app.getHttpServer())
        .post('/reading-progress')
        .send({
          userId: user1Id,
          storyId: baseStoryId,
          chapterId: baseChapterId,
          scrollPosition: 10,
          readingMode: 'night',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/reading-mode/current?userId=${user1Id}&storyId=${baseStoryId}`)
        .expect(200);

      expect(res.body.mode).toBe('night');
    });

    it('Two users can have different modes', async () => {
      await request(app.getHttpServer())
        .post('/reading-progress')
        .send({
          userId: user1Id,
          storyId: baseStoryId,
          chapterId: baseChapterId,
          scrollPosition: 25,
          readingMode: 'day',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/reading-progress')
        .send({
          userId: user2Id,
          storyId: baseStoryId,
          chapterId: baseChapterId,
          scrollPosition: 0,
          readingMode: 'night',
        })
        .expect(201);

      const user1Mode = await request(app.getHttpServer())
        .get(`/reading-mode/current?userId=${user1Id}&storyId=${baseStoryId}`)
        .expect(200);

      const user2Mode = await request(app.getHttpServer())
        .get(`/reading-mode/current?userId=${user2Id}&storyId=${baseStoryId}`)
        .expect(200);

      expect(user1Mode.body.mode).toBe('day');
      expect(user2Mode.body.mode).toBe('night');
    });
  });

  describe('Phase 2: CORS', () => {
    it('OPTIONS request returns CORS headers', async () => {
      const res = await request(app.getHttpServer())
        .options('/')
        .set('Origin', 'http://localhost:4200')
        .expect(204);

      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
