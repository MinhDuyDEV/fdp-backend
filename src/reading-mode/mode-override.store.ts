import { Injectable } from '@nestjs/common';

/**
 * Bounded in-memory mode override store with LRU-like max-size eviction (I2 fix).
 *
 * Shared between ReadingModeService (set/get) and ReadingProgressService (consume).
 * Extracted as a standalone @Injectable() to avoid circular module dependencies.
 */
@Injectable()
export class ModeOverrideStore {
  private static readonly MAX_ENTRIES = 10_000;
  private readonly store = new Map<string, string>();

  /** Build a cache key for a user or user+story pair. */
  static makeKey(userId: number, storyId?: number): string {
    return storyId === undefined ? `${userId}` : `${userId}:${storyId}`;
  }

  set(key: string, value: string): void {
    // Simple eviction: when at capacity, delete the oldest entry (first inserted)
    if (
      this.store.size >= ModeOverrideStore.MAX_ENTRIES &&
      !this.store.has(key)
    ) {
      const firstKey: string | undefined = this.store.keys().next().value as
        | string
        | undefined;
      if (firstKey !== undefined) {
        this.store.delete(firstKey);
      }
    }
    this.store.set(key, value);
  }

  get(key: string): string | undefined {
    return this.store.get(key);
  }

  /**
   * Get and remove an override (I6 fix).
   * Used by saveProgress to apply a pending mode override on first save.
   */
  consume(key: string): string | undefined {
    const value = this.store.get(key);
    if (value !== undefined) {
      this.store.delete(key);
    }
    return value;
  }

  get size(): number {
    return this.store.size;
  }
}
