import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import type { GetCurrentModeDto } from './dto/get-current-mode.dto';
import type { RenderDto } from './dto/render.dto';
import type { SetReadingModeDto } from './dto/set-reading-mode.dto';
import { ReadingModeService } from './reading-mode.service';

/**
 * NOTE (I3 / auth): All endpoints trust client-supplied userId.
 * Authentication and authorization are out of scope for Phase 2.
 * TODO: Add an auth guard that extracts userId from the authenticated session.
 */
@Controller('reading-mode')
export class ReadingModeController {
  constructor(
    @Inject(ReadingModeService)
    private readonly readingModeService: ReadingModeService,
  ) {}

  @Get('modes')
  getAvailableModes(): { modes: string[] } {
    return { modes: this.readingModeService.getAvailableModes() };
  }

  @Get('current')
  async getCurrentMode(
    @Query() query: GetCurrentModeDto,
  ): Promise<{ mode: string }> {
    const mode = await this.readingModeService.getCurrentModeForUser(
      query.userId,
      query.storyId,
    );
    return { mode };
  }

  @Post('set')
  async setMode(@Body() body: SetReadingModeDto): Promise<{
    mode: string;
  }> {
    const current = await this.readingModeService.setMode(
      body.userId,
      body.mode,
      body.storyId,
    );
    return { mode: current };
  }

  @Post('render')
  async render(@Body() body: RenderDto): Promise<{
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
