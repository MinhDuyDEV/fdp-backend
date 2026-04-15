import { Module } from '@nestjs/common';
import { ReadingModeController } from './reading-mode.controller';
import { ReadingModeService } from './reading-mode.service';

@Module({
  controllers: [ReadingModeController],
  providers: [ReadingModeService],
  exports: [ReadingModeService],
})
export class ReadingModeModule {}
