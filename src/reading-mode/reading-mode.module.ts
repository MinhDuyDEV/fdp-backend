import { Module } from '@nestjs/common';
import { ReadingModeController } from './reading-mode.controller';
import { ReadingModeService } from './reading-mode.service';
import { DayModeStrategy } from './strategies/day-mode.strategy';
import { NightModeStrategy } from './strategies/night-mode.strategy';
import { PageFlipModeStrategy } from './strategies/page-flip-mode.strategy';
import { ReadingModeContext } from './strategies/reading-mode-context';
import { ScrollModeStrategy } from './strategies/scroll-mode.strategy';

@Module({
  controllers: [ReadingModeController],
  providers: [
    ReadingModeService,
    ReadingModeContext,
    DayModeStrategy,
    NightModeStrategy,
    ScrollModeStrategy,
    PageFlipModeStrategy,
  ],
  exports: [ReadingModeService],
})
export class ReadingModeModule {}
