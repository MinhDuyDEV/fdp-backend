import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import type { ReadingModeService } from "./reading-mode.service";

@Controller("reading-mode")
export class ReadingModeController {
	constructor(private readonly readingModeService: ReadingModeService) {}

	@Get("modes")
	getAvailableModes(): { modes: string[] } {
		return { modes: this.readingModeService.getAvailableModes() };
	}

	@Get("current")
	getCurrentMode(
		@Query("userId") userId?: number,
		@Query("storyId") storyId?: number,
	): Promise<{ mode: string }> {
		if (userId && storyId) {
			return this.readingModeService
				.getModeForUser(userId, storyId)
				.then((mode) => ({ mode }));
		}
		return Promise.resolve({ mode: this.readingModeService.getCurrentMode() });
	}

	@Post("set")
  async setMode(@Body() body: { userId: number; mode: string }): Promise<{ mode: string }> {
    const current = await this.readingModeService.setMode(body.userId, body.mode);
    return { mode: current };
  }

	@Post("render")
  async render(
    @Body()
    body: { content: string; mode?: string; userId?: number; storyId?: number },
  ): Promise<{
    content: string;
    mode: string;
    styles: Record<string, string>;
    metadata?: Record<string, unknown>;
  }> {
    const result = await this.readingModeService.render(
      body.content,
      body.mode,
      body.userId,
      body.storyId,
    );
    return result;
  }
}
