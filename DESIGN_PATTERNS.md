# Design Patterns — Online Reading App

This document maps each of the four required design patterns to their implementation in the codebase, explaining **why** the pattern was chosen, **how** it is implemented, and **where** the key files live.

---

## 1. Factory Pattern — Story Creation by Genre

### Intent

Encapsulate object creation so that the client code (`StoriesService`) does not need to know the concrete class being instantiated. Adding a new genre requires only a new factory class — no changes to the service logic.

### Participants

| Role                 | Class / File                                                                 |
| -------------------- | ---------------------------------------------------------------------------- |
| **Abstract Creator** | `StoryFactory` — `src/stories/factories/story.factory.ts`                    |
| **Concrete Creator** | `ActionStoryFactory` — `src/stories/factories/action-story.factory.ts`       |
| **Concrete Creator** | `HorrorStoryFactory` — `src/stories/factories/horror-story.factory.ts`       |
| **Concrete Creator** | `RomanceStoryFactory` — `src/stories/factories/romance-story.factory.ts`     |
| **Concrete Creator** | `DetectiveStoryFactory` — `src/stories/factories/detective-story.factory.ts` |
| **Client**           | `StoriesService` — `src/stories/stories.service.ts`                          |
| **Product**          | `Story` entity — `src/stories/entities/story.entity.ts`                      |

### How It Works

1. `StoryFactory` defines the abstract method `createStory(dto: CreateStoryDto): Story`.
2. Each concrete factory (`ActionStoryFactory`, `HorrorStoryFactory`, etc.) is an `@Injectable()` NestJS provider that overrides `createStory` to instantiate a `Story` entity with the correct `StoryGenre` enum value.
3. `StoriesService` receives all four factories via constructor injection and stores them in a `Map<StoryGenre, StoryFactory>` called `factoryMap`.
4. When `create(dto)` is called, the service looks up `dto.genre` in the map, retrieves the matching factory, and delegates `factory.createStory(dto)` to it. The resulting entity is then persisted via TypeORM.

### Code Snippet

```typescript
// src/stories/stories.service.ts (constructor)
this.factoryMap = new Map<StoryGenre, StoryFactory>([
  [StoryGenre.Action, actionFactory],
  [StoryGenre.Horror, horrorFactory],
  [StoryGenre.Romance, romanceFactory],
  [StoryGenre.Detective, detectiveFactory],
]);

// src/stories/stories.service.ts (create method)
async create(dto: CreateStoryDto): Promise<Story> {
  const factory = this.factoryMap.get(dto.genre);
  if (!factory) {
    throw new Error(`No factory registered for genre: ${dto.genre}`);
  }
  const story = factory.createStory(dto);
  return this.storyRepository.save(story);
}
```

### Extensibility

To add a new genre (e.g., `SciFi`):

1. Add `SciFi` to the `StoryGenre` enum.
2. Create `SciFiStoryFactory extends StoryFactory` with `@Injectable()`.
3. Register it in the module providers and inject it into `StoriesService`.
4. Add the map entry: `[StoryGenre.SciFi, sciFiFactory]`.

No existing factory or service logic changes are needed (Open/Closed Principle).

---

## 2. Singleton Pattern — Reading Progress Manager

### Intent

Ensure a single shared instance manages all reading progress caching. This avoids duplicate caches, guarantees consistent state, and provides a fast in-memory lookup layer in front of the database.

### Participants

| Role          | Class / File                                                                            |
| ------------- | --------------------------------------------------------------------------------------- |
| **Singleton** | `ReadingProgressManager` — `src/reading-progress/singleton/reading-progress-manager.ts` |
| **Client**    | `ReadingProgressService` — `src/reading-progress/reading-progress.service.ts`           |

### How It Works

1. `ReadingProgressManager` is marked `@Injectable()` with NestJS's default singleton scope. NestJS Dependency Injection guarantees exactly one instance is created and shared across all consumers.
2. Internally it holds a `private progressStore: Map<string, ReadingProgress>` keyed by `"userId:storyId"`.
3. `ReadingProgressService` uses the manager as a **cache layer**:
   - **Read path**: `getProgress(userId, storyId)` checks the cache first via `progressManager.getProgress()`. On cache miss, it queries the database, then populates the cache.
   - **Write path**: `saveProgress(dto)` persists to the database first, then updates the cache via `progressManager.setProgress()`.

### Code Snippet

```typescript
// src/reading-progress/singleton/reading-progress-manager.ts
@Injectable()
export class ReadingProgressManager {
  private progressStore = new Map<string, ReadingProgress>();

  private buildKey(userId: number, storyId: number): string {
    return `${userId}:${storyId}`;
  }

  getProgress(userId: number, storyId: number): ReadingProgress | undefined {
    return this.progressStore.get(this.buildKey(userId, storyId));
  }

  setProgress(userId: number, storyId: number, progress: ReadingProgress): void {
    this.progressStore.set(this.buildKey(userId, storyId), progress);
  }
}
```

### Why NestJS Singleton Scope

NestJS providers are singletons by default. By relying on the DI container rather than implementing a hand-rolled `getInstance()` static method, we get:

- Testability: the manager can be replaced with a mock in unit tests.
- Lifecycle management: NestJS handles creation and destruction.
- No global mutable state: the singleton is scoped to the DI container.

---

## 3. Observer Pattern — Chapter Update Notifications

### Intent

Decouple the act of publishing a new chapter from the notification delivery mechanism. When a chapter is created, all subscribed readers are notified automatically without the chapter-creation code knowing who the subscribers are.

### Participants

| Role                   | Class / File                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **Subject**            | `ChapterUpdateSubject` — `src/notifications/observers/chapter-update.observer.ts`  |
| **Observer Interface** | `ReaderObserver` — `src/notifications/observers/chapter-update.observer.ts`        |
| **Concrete Observer**  | `InAppReaderObserver` — `src/notifications/observers/chapter-update.observer.ts`   |
| **Observer Factory**   | `ReaderObserverFactory` — `src/notifications/observers/chapter-update.observer.ts` |
| **Orchestrator**       | `NotificationsService` — `src/notifications/notifications.service.ts`              |
| **Trigger**            | `ChaptersService.create()` — `src/chapters/chapters.service.ts`                    |

### How It Works

1. **Subscribe**: `NotificationsService.subscribe(userId, storyId)` creates an `InAppReaderObserver` via `ReaderObserverFactory` and attaches it to the `ChapterUpdateSubject`. Observers are stored in a `Map<string, ReaderObserver>` keyed by `"userId:storyId"`.

2. **Notify**: When `ChaptersService.create()` persists a new chapter, it calls `NotificationsService.notifyChapterUpdate(storyId, chapterId, chapterTitle)`. This calls `subject.notifyForStory(storyId, message)` which iterates all registered observers, filters by `storyId`, and calls `observer.update(message)` on each match.

3. **Persist**: In addition to the in-memory observer notification, the service also persists `Notification` entities to the database for each subscribed user so they can be queried later (`GET /notifications/user/:userId`) and marked as read (`PATCH /notifications/:id/read`).

4. **Unsubscribe**: `NotificationsService.unsubscribe(userId, storyId)` detaches the observer from the subject.

### Code Snippet

```typescript
// src/notifications/observers/chapter-update.observer.ts (Subject)
notifyForStory(storyId: number, message: string): void {
  this.notificationLog.push(message);
  for (const observer of this.observers.values()) {
    if (observer.getStoryId() === storyId) {
      observer.update(message);
    }
  }
}

// src/notifications/notifications.service.ts (subscribe)
subscribe(userId: number, storyId: number): { message: string } {
  const observer = this.observerFactory.create(userId, storyId);
  this.subject.attach(observer);
  return { message: `User ${userId} subscribed to story ${storyId} updates` };
}
```

### Flow Diagram

```
User subscribes → ReaderObserverFactory.create() → subject.attach(observer)
                                                          ↓
Chapter created → notifyChapterUpdate() → subject.notifyForStory()
                                                ↓
                                    observer.update(message) for each match
                                                ↓
                                    Notification entity persisted to DB
```

---

## 4. Strategy Pattern — Reading Mode

### Intent

Allow the rendering behavior of story content to be selected and swapped at runtime without modifying the client code. Each reading mode (Day, Night, Scroll, Page Flip) encapsulates its own rendering logic — styles, layout metadata, and content transformations.

### Participants

| Role                   | Class / File                                                                      |
| ---------------------- | --------------------------------------------------------------------------------- |
| **Strategy Interface** | `ReadingModeStrategy` — `src/reading-mode/strategies/reading-mode.strategy.ts`    |
| **Concrete Strategy**  | `DayModeStrategy` — `src/reading-mode/strategies/day-mode.strategy.ts`            |
| **Concrete Strategy**  | `NightModeStrategy` — `src/reading-mode/strategies/night-mode.strategy.ts`        |
| **Concrete Strategy**  | `ScrollModeStrategy` — `src/reading-mode/strategies/scroll-mode.strategy.ts`      |
| **Concrete Strategy**  | `PageFlipModeStrategy` — `src/reading-mode/strategies/page-flip-mode.strategy.ts` |
| **Context**            | `ReadingModeContext` — `src/reading-mode/strategies/reading-mode-context.ts`      |
| **Client**             | `ReadingModeService` — `src/reading-mode/reading-mode.service.ts`                 |

### How It Works

1. `ReadingModeStrategy` defines the interface: `render(content: string): RenderResult` and `getName(): string`.
2. Four concrete strategies implement this interface, each producing distinct styling:
   - **DayModeStrategy**: White background, dark text, serif font.
   - **NightModeStrategy**: Dark background (#1a1a2e), light text (#e0e0e0), reduced brightness filter.
   - **ScrollModeStrategy**: Continuous scroll layout, infinite scroll metadata.
   - **PageFlipModeStrategy**: Paginates content into chunks (500 chars/page), adds page count and current page metadata.
3. `ReadingModeContext` is an `@Injectable()` that receives all four strategies via DI and stores them in a `Map<string, ReadingModeStrategy>`.
4. Two rendering paths:
   - **`setStrategy(modeName)` + `render(content)`**: Sets the active strategy on the context, then renders. Used for persistent mode switching.
   - **`renderWithMode(content, modeName)`**: Looks up the strategy by name and renders directly without mutating shared state. Safe for concurrent requests.

### Code Snippet

```typescript
// src/reading-mode/strategies/reading-mode-context.ts
@Injectable()
export class ReadingModeContext {
  private strategy: ReadingModeStrategy;
  private strategyMap: Map<string, ReadingModeStrategy>;

  constructor(
    dayMode: DayModeStrategy,
    nightMode: NightModeStrategy,
    scrollMode: ScrollModeStrategy,
    pageFlipMode: PageFlipModeStrategy,
  ) {
    this.strategyMap = new Map([
      [dayMode.getName(), dayMode],
      [nightMode.getName(), nightMode],
      [scrollMode.getName(), scrollMode],
      [pageFlipMode.getName(), pageFlipMode],
    ]);
    this.strategy = dayMode; // default
  }

  setStrategy(modeName: string): void {
    const strategy = this.strategyMap.get(modeName);
    if (!strategy) {
      throw new BadRequestException(`Unknown reading mode: ${modeName}`);
    }
    this.strategy = strategy;
  }

  renderWithMode(content: string, modeName: string): RenderResult {
    const strategy = this.strategyMap.get(modeName);
    if (!strategy) {
      throw new BadRequestException(`Unknown reading mode: ${modeName}`);
    }
    return strategy.render(content);
  }
}
```

### Per-User Mode Persistence

Reading mode preference is stored per user per story via the reading progress system. When a user saves progress (`POST /reading-progress`), the `readingMode` field is persisted alongside `chapterId` and `scrollPosition`. The `ModeOverrideStore` (`src/reading-mode/mode-override.store.ts`) provides an in-memory override layer for the current session.

### Extensibility

To add a new reading mode (e.g., `Sepia`):

1. Create `SepiaModeStrategy implements ReadingModeStrategy` with `@Injectable()`.
2. Register it in `ReadingModeModule` providers.
3. Inject it into `ReadingModeContext` and add to the `strategyMap`.

No existing strategy or context logic changes are needed (Open/Closed Principle).

---

## Pattern Summary

| Pattern       | Problem Solved                         | Key Abstraction          | Files                                 |
| ------------- | -------------------------------------- | ------------------------ | ------------------------------------- |
| **Factory**   | Genre-specific story creation          | `StoryFactory`           | `src/stories/factories/*.ts`          |
| **Singleton** | Centralized progress cache             | `ReadingProgressManager` | `src/reading-progress/singleton/*.ts` |
| **Observer**  | Decoupled chapter update notifications | `ChapterUpdateSubject`   | `src/notifications/observers/*.ts`    |
| **Strategy**  | Runtime-swappable reading modes        | `ReadingModeStrategy`    | `src/reading-mode/strategies/*.ts`    |

---

## How to Verify

```bash
# Run unit tests (pattern-specific tests included)
npm run test -- --runInBand

# Run e2e tests (requires PostgreSQL)
docker compose up postgres -d
npm run test:e2e -- --runInBand

# Type check
npx tsc --noEmit

# Lint
npm run lint
```
