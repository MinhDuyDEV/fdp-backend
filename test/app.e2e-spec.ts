/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
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

    it('GET /stories returns all stories', async () => {
      const res = await request(app.getHttpServer())
        .get('/stories')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('GET /stories?genre=Action filters by genre', async () => {
      const res = await request(app.getHttpServer())
        .get('/stories?genre=Action')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Reading Progress - Singleton Pattern (Task D)', () => {
    it('POST /reading-progress saves progress', async () => {
      const res = await request(app.getHttpServer())
        .post('/reading-progress')
        .send({
          userId: 1,
          storyId: 1,
          chapterId: 1,
          scrollPosition: 150,
          readingMode: 'day',
        })
        .expect(201);

      expect(res.body.userId).toBe(1);
      expect(res.body.chapterId).toBe(1);
    });

    it('GET /reading-progress retrieves saved progress', async () => {
      const res = await request(app.getHttpServer())
        .get('/reading-progress?userId=1&storyId=1')
        .expect(200);

      expect(res.body.userId).toBe(1);
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
        .send({ mode: 'night' })
        .expect(201);

      expect(res.body.mode).toBe('night');
    });

    it('POST /reading-mode/render renders content', async () => {
      const res = await request(app.getHttpServer())
        .post('/reading-mode/render')
        .send({ content: 'Test content', mode: 'scroll' })
        .expect(201);

      expect(res.body.rendered).toBe('Test content');
      expect(res.body.mode).toBe('scroll');
    });

    it('POST /reading-mode/set with invalid mode returns 400', async () => {
      return request(app.getHttpServer())
        .post('/reading-mode/set')
        .send({ mode: 'invalid-mode' })
        .expect(400);
    });
  });

  describe('Notifications - Observer Pattern (Task F)', () => {
    it('POST /notifications/subscribe subscribes a user to a story', async () => {
      const res = await request(app.getHttpServer())
        .post('/notifications/subscribe')
        .send({ userId: 1, storyId: 1 })
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
        .send({ userId: 1, storyId: 1 })
        .expect(201);

      expect(res.body.message).toContain('unsubscribed');
    });
  });

  describe('Chapters with Notification (Task G)', () => {
    it('POST /chapters creates a chapter and triggers notification', async () => {
      // Subscribe to story 1 first to see the notification
      await request(app.getHttpServer())
        .post('/notifications/subscribe')
        .send({ userId: 99, storyId: 1 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/chapters')
        .send({
          title: 'Chapter 1',
          content: 'The beginning...',
          chapterNumber: 1,
          storyId: 1,
        })
        .expect(201);

      expect(res.body.title).toBe('Chapter 1');

      // Verify notification was created
      const notifs = await request(app.getHttpServer())
        .get('/notifications')
        .expect(200);

      expect(notifs.body.notifications.length).toBeGreaterThan(0);
    });

    it('GET /stories/:storyId/chapters returns chapters for a story', async () => {
      const res = await request(app.getHttpServer())
        .get('/stories/1/chapters')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Comments (Task H)', () => {
    it('POST /comments creates a comment', async () => {
      const res = await request(app.getHttpServer())
        .post('/comments')
        .send({
          content: 'Great story!',
          userId: 1,
          storyId: 1,
        })
        .expect(201);

      expect(res.body.content).toBe('Great story!');
    });

    it('GET /stories/:storyId/comments returns comments', async () => {
      const res = await request(app.getHttpServer())
        .get('/stories/1/comments')
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
          userId: 2,
          storyId: 1,
        })
        .expect(201);

      expect(res.body.score).toBe(4);
    });

    it('POST /ratings upserts existing rating', async () => {
      const res = await request(app.getHttpServer())
        .post('/ratings')
        .send({
          score: 5,
          userId: 2,
          storyId: 1,
        })
        .expect(201);

      expect(res.body.score).toBe(5);
    });

    it('GET /stories/:storyId/ratings returns ratings', async () => {
      const res = await request(app.getHttpServer())
        .get('/stories/1/ratings')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /stories/:storyId/ratings/summary returns aggregate', async () => {
      const res = await request(app.getHttpServer())
        .get('/stories/1/ratings/summary')
        .expect(200);

      expect(res.body.storyId).toBe(1);
      expect(res.body.averageScore).toBeGreaterThan(0);
      expect(res.body.totalRatings).toBeGreaterThan(0);
    });
  });
});
