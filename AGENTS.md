# Backend Knowledge Base

## Tech Stack

- NestJS `^11.0.1` + TypeScript `^5.7.3` + Node.js `v24.14.0`
- TypeORM `^0.3.28` + PostgreSQL 16 (Docker) + `@nestjs/config`
- Auth: `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt` + `bcryptjs`
- Validation: `class-validator` + `class-transformer` (DTO decorators)
- Test: Jest `^30.0.0` + Supertest `^7.0.0` | Lint: ESLint `^9.18.0` + Prettier

## File Structure

```text
src/
  main.ts / app.module.ts / app.controller.ts
  config/database.config.ts
  shared/          # @Global modules (ModeOverrideStore)
  stories/         # Factory Pattern (genre-keyed dispatch → 4 concrete factories)
  chapters/        # FK→story, Observer trigger on create, composite index (storyId, chapterNumber)
  reading-progress/ # Singleton Pattern (@Injectable ReadingProgressManager + Map cache)
  reading-mode/    # Strategy Pattern (ReadingModeContext + 4 strategies: day/night/scroll/page-flip)
  comments/        # FK→story
  ratings/         # FK→story, score 1-5
  notifications/   # Observer Pattern (ChapterUpdateSubject + InAppReaderObserver)
  auth/            # JWT Auth (login/register/logout, global JwtAuthGuard + @Public decorator)
  users/           # User CRUD
docker-compose.yml | Dockerfile | .env.example | test/jest-e2e.json
```

## Commands (validated)

```bash
npm run build && npm run lint && npx tsc --noEmit
npm run test -- --runInBand      # unit (7 suites, 51 tests)
npm run test:e2e -- --runInBand  # e2e (needs DB; auth: 11 tests)
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
- Always use `@Inject(ServiceName)` on constructor params — prevents ESLint from converting to `import type` which silently breaks NestJS DI
- `consistent-type-imports` ESLint rule is disabled — it breaks class-validator DTOs and NestJS DI at runtime

<!-- bv-agent-instructions-v1 -->

---

## Beads Workflow Integration

This project uses [beads_viewer](https://github.com/Dicklesworthstone/beads_viewer) for issue tracking. Issues are stored in `.beads/` and tracked in git.

### Essential Commands

```bash
# View issues (launches TUI - avoid in automated sessions)
bv

# CLI commands for agents (use these instead)
bd ready              # Show issues ready to work (no blockers)
bd list --status=open # All open issues
bd show <id>          # Full issue details with dependencies
bd create --title="..." --type=task --priority=2
bd update <id> --status=in_progress
bd close <id> --reason="Completed"
bd close <id1> <id2>  # Close multiple issues at once
bd sync               # Commit and push changes
```

### Workflow Pattern

1. **Start**: Run `bd ready` to find actionable work
2. **Claim**: Use `bd update <id> --status=in_progress`
3. **Work**: Implement the task
4. **Complete**: Use `bd close <id>`
5. **Sync**: Always run `bd sync` at session end

### Key Concepts

- **Dependencies**: Issues can block other issues. `bd ready` shows only unblocked work.
- **Priority**: P0=critical, P1=high, P2=medium, P3=low, P4=backlog (use numbers, not words)
- **Types**: task, bug, feature, epic, question, docs
- **Blocking**: `bd dep add <issue> <depends-on>` to add dependencies

### Session Protocol

**Before ending any session, run this checklist:**

```bash
git status              # Check what changed
git add <files>         # Stage code changes
bd sync                 # Commit beads changes
git commit -m "..."     # Commit code
bd sync                 # Commit any new beads changes
git push                # Push to remote
```

### Best Practices

- Check `bd ready` at session start to find available work
- Update status as you work (in_progress → closed)
- Create new issues with `bd create` when you discover tasks
- Use descriptive titles and set appropriate priority/type
- Always `bd sync` before ending session

<!-- end-bv-agent-instructions -->
