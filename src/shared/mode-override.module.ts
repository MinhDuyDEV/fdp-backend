import { Global, Module } from '@nestjs/common';
import { ModeOverrideStore } from '../reading-mode/mode-override.store';

/**
 * Global module that provides ModeOverrideStore to both
 * ReadingModeModule and ReadingProgressModule without circular imports.
 */
@Global()
@Module({
  providers: [ModeOverrideStore],
  exports: [ModeOverrideStore],
})
export class ModeOverrideModule {}
