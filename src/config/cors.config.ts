import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:4200',
];

export function parseCorsOrigins(corsOrigin?: string): string[] {
  const configuredOrigins = corsOrigin
    ?.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return configuredOrigins?.length ? configuredOrigins : DEFAULT_CORS_ORIGINS;
}

export function createCorsOptions(
  corsOrigin = process.env.CORS_ORIGIN,
): CorsOptions {
  return {
    origin: parseCorsOrigins(corsOrigin),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  };
}
