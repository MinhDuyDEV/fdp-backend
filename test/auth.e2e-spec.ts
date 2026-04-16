/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const suffix = Date.now();
  const testUser = {
    name: `auth-test-${suffix}`,
    password: 'securePassword123',
  };

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe(testUser.name);
      expect(res.body.password).toBeUndefined();
    });

    it('should return 409 for duplicate username', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({})
        .expect(400);
    });

    it('should return 400 for password too short', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: `short-pass-${suffix}`,
          password: '12345',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should return access_token for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          name: testUser.name,
          password: testUser.password,
        })
        .expect(200);

      expect(res.body.access_token).toBeDefined();
      expect(typeof res.body.access_token).toBe('string');
    });

    it('should return 401 for unknown username', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          name: 'nonexistent-user',
          password: 'password123',
        })
        .expect(401);
    });

    it('should return 401 for wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          name: testUser.name,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          name: testUser.name,
          password: testUser.password,
        })
        .expect(200);

      accessToken = res.body.access_token as string;
    });

    it('should return success for authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.message).toBe('Logged out successfully');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });
  });

  describe('Protected route access', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          name: testUser.name,
          password: testUser.password,
        })
        .expect(200);

      accessToken = res.body.access_token as string;
    });

    it('should return 401 when accessing /stories without token', async () => {
      await request(app.getHttpServer()).get('/stories').expect(401);
    });

    it('should access /stories with valid token', async () => {
      await request(app.getHttpServer())
        .get('/stories')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });
});
