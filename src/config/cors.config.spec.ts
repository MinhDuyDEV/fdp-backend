import {
  createCorsOptions,
  DEFAULT_CORS_ORIGINS,
  parseCorsOrigins,
} from './cors.config';

describe('cors config', () => {
  it('allows the Next.js dev origins by default', () => {
    expect(parseCorsOrigins()).toEqual(DEFAULT_CORS_ORIGINS);
    expect(parseCorsOrigins()).toContain('http://localhost:3000');
    expect(parseCorsOrigins()).toContain('http://127.0.0.1:3000');
    expect(parseCorsOrigins()).toContain('http://localhost:3001');
  });

  it('parses comma-separated configured origins', () => {
    expect(
      parseCorsOrigins('http://localhost:3000, https://mangako.example.com'),
    ).toEqual(['http://localhost:3000', 'https://mangako.example.com']);
  });

  it('keeps credentialed preflight settings enabled', () => {
    expect(createCorsOptions('http://localhost:3000')).toMatchObject({
      origin: ['http://localhost:3000'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
  });
});
