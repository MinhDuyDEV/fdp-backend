import { Body, Controller, Get, Post } from '@nestjs/common';
import type { ReadingModeService } from './reading-mode.service';

@Controller('reading-mode')
export class ReadingModeController {
  constructor(private readonly readingModeService: ReadingModeService) {}

  @Get('modes')
  getAvailableModes(): { modes: string[] } {
    return { modes: this.readingModeService.getAvailableModes() };
  }

  @Get('current')
  getCurrentMode(): { mode: string } {
    return { mode: this.readingModeService.getCurrentMode() };
  }

  @Post('set')
  setMode(@Body() body: { mode: string }): { mode: string } {
    const current = this.readingModeService.setMode(body.mode);
    return { mode: current };
  }

  @Post('render')
  render(@Body() body: { content: string; mode?: string }): {
    rendered: string;
    mode: string;
  } {
    const rendered = this.readingModeService.render(body.content, body.mode);
    return { rendered, mode: this.readingModeService.getCurrentMode() };
  }
}
