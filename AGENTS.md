# Backend Knowledge Base

## Tech Stack

- Framework: NestJS `^11.0.1` (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- Language: TypeScript `^5.7.3` (CJS build via Nest CLI)
- Runtime: Node.js `v24.14.0` validated
- Package manager: npm (`package-lock.json` present)
- ORM: TypeORM `^0.3.x` via `@nestjs/typeorm`
- Database: PostgreSQL 16 (Docker)
- Config: `@nestjs/config` (`.env` based)
- Lint/format: ESLint `^9.18.0` + Prettier `^3.4.2`
- Tests: Jest `^30.0.0` + Supertest `^7.0.0`

## File Structure

```text
src/
  main.ts                              # bootstrap + listen
  app.module.ts                        # root module (ConfigModule, TypeORM, all feature modules)
  app.controller.ts                    # GET / health endpoint
  app.service.ts
  config/
    database.config.ts                 # TypeORM async config from env vars
  stories/
    stories.module.ts                  # Factory Pattern module
    stories.controller.ts / .service.ts
    entities/story.entity.ts           # Story with genre enum
    dto/create-story.dto.ts
    factories/                         # Factory Pattern
      story.factory.ts                 # Abstract StoryFactory
      action-story.factory.ts         # Concrete: Hành động
      horror-story.factory.ts         # Concrete: Kinh dị
      romance-story.factory.ts        # Concrete: Lãng mạn
      detective-story.factory.ts      # Concrete: Trinh thám
  chapters/
    chapters.module.ts / .controller.ts / .service.ts
    entities/chapter.entity.ts         # FK → story
    dto/create-chapter.dto.ts
  reading-progress/
    reading-progress.module.ts         # Singleton Pattern module
    reading-progress.controller.ts / .service.ts
    entities/reading-progress.entity.ts
    singleton/
      reading-progress-manager.ts      # Singleton Pattern
  reading-mode/
    reading-mode.module.ts             # Strategy Pattern module
    reading-mode.controller.ts / .service.ts
    strategies/                        # Strategy Pattern
      reading-mode.strategy.ts         # Interface ReadingModeStrategy
      day-mode.strategy.ts             # Concrete: Night
      night-mode.strategy.ts
      scroll-mode.strategy.ts
      page-flip-mode.strategy.ts
      reading-mode-context.ts          # Context holding current strategy
  comments/
    comments.module.ts / .controller.ts / .service.ts
    entities/comment.entity.ts         # FK → story
    dto/create-comment.dto.ts
  ratings/
    ratings.module.ts / .controller.ts / .service.ts
    entities/rating.entity.ts          # FK → story, score 1-5
    dto/create-rating.dto.ts
  notifications/
    notifications.module.ts            # Observer Pattern module
    notifications.controller.ts / .service.ts
    observers/
      chapter-update.observer.ts       # Observer Pattern (Subject + ReaderObserver)
docker-compose.yml                     # app + postgres containers
Dockerfile                             # multi-stage build
.env.example                           # environment template
test/
  app.e2e-spec.ts
  jest-e2e.json
```

## Commands (validated)

```bash
npm run build
npm run lint
npx tsc --noEmit
npm run test -- --runInBand
npm run test:e2e -- --runInBand
PORT=3101 npm run start
PORT=3102 npm run start:dev
PORT=3103 npm run start:prod
PORT=3104 npm run start:debug
docker compose up -d                   # start postgres + app
docker compose up postgres -d          # start postgres only (for local dev)
```

## Code Example (from codebase)

```ts
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

## Testing Conventions

- Unit tests colocated in `src/*.spec.ts`
- E2E tests in `test/*.e2e-spec.ts`
- Use `--runInBand` for deterministic local verification

## Boundaries

- Always: keep module/controller/service separation, validate with lint+tests
- Always: use ConfigService for env vars, never hardcode DB credentials
- Ask first: adding dependencies, changing API contract, changing port strategy
- Never: edit `dist/` directly, commit `.env` (only `.env.example`), use `git add .`

## Gotchas

- `src/main.ts` triggers `@typescript-eslint/no-floating-promises` warning on `bootstrap()`
- Default port `3000` can conflict; set `PORT` for local parallel runs
- PostgreSQL must be running before app starts (use `docker compose up postgres -d`)
- TypeORM `synchronize: true` is for dev only — disable in production
