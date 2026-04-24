import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from '../app.module';
import { SeedDataService } from './seed-data.service';

const logger = new Logger('SeedData');

const loadSeedFixture = (): unknown => {
  const seedPath = join(__dirname, 'data', 'manga-seed.json');
  return JSON.parse(readFileSync(seedPath, 'utf8')) as unknown;
};

async function runSeed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run seed data import in production.');
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const seedDataService = app.get(SeedDataService);
    const summary = await seedDataService.importSeedData(loadSeedFixture());
    logger.log(`Seed import complete: ${JSON.stringify(summary)}`);
  } finally {
    await app.close();
  }
}

void runSeed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error(`Seed import failed: ${message}`, stack);
  process.exitCode = 1;
});
