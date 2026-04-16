import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { GetCurrentModeDto } from './dto/get-current-mode.dto';
import { SetReadingModeDto } from './dto/set-reading-mode.dto';
import { ReadingModeService } from './reading-mode.service';

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
  async render(
    @Body()
    body: {
      content: string;
      mode?: string;
      userId?: number;
      storyId?: number;
    },
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
