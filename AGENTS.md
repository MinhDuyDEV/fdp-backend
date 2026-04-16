# Backend Knowledge Base

## Tech Stack

- NestJS `^11.0.1` + TypeScript `^5.7.3` + Node.js `v24.14.0`
- TypeORM `^0.3.28` + PostgreSQL 16 (Docker) + `@nestjs/config`
- Validation: `class-validator` + `class-transformer` (DTO decorators)
- Test: Jest `^30.0.0` + Supertest `^7.0.0` | Lint: ESLint `^9.18.0` + Prettier

## File Structure

```text
src/
  main.ts / app.module.ts / app.controller.ts
  config/database.config.ts
  stories/         # Factory Pattern (genre-keyed dispatch → 4 concrete factories)
  chapters/        # FK→story, Observer trigger on create
  reading-progress/ # Singleton Pattern (@Injectable ReadingProgressManager + Map cache)
  reading-mode/    # Strategy Pattern (ReadingModeContext + 4 strategies: day/night/scroll/page-flip)
  comments/        # FK→story
  ratings/         # FK→story, score 1-5
  notifications/   # Observer Pattern (ChapterUpdateSubject + InAppReaderObserver)
  users/           # User CRUD
docker-compose.yml | Dockerfile | .env.example | test/jest-e2e.json
```

## Commands (validated)

```bash
npm run build && npm run lint && npx tsc --noEmit
npm run test -- --runInBand      # unit (1 suite)
npm run test:e2e -- --runInBand  # e2e (needs DB)
docker compose up postgres -d     # start DB only
```

## Code Example

```ts
// Factory Pattern dispatch — src/stories/stories.service.ts
this.factoryMap = new Map<StoryGenre, StoryFactory>([
  [StoryGenre.Action, actionFactory],
  [StoryGenre.Horror, horrorFactory],
]);
const story = factory.createStory(dto); // delegates to concrete factory
```

## Boundaries

- Always: module/controller/service separation, validate via lint+tests
- Always: ConfigService for env vars, ValidationPipe enabled globally
- Ask first: new deps, API contract changes, port strategy
- Never: edit `dist/`, commit `.env`, use `git add .`

## Gotchas

- `bootstrap()` in `main.ts` triggers `no-floating-promises` lint warning
- Default port 3000 conflicts; set `PORT` for parallel runs
- PostgreSQL must be running before app start (`docker compose up postgres -d`)
- TypeORM `synchronize: true` is dev-only — disable in production
