import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import {
  ChapterUpdateSubject,
  ReaderObserverFactory,
} from './observers/chapter-update.observer';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ChapterUpdateSubject,
    ReaderObserverFactory,
  ],
  exports: [NotificationsService, ChapterUpdateSubject],
})
export class NotificationsModule {}
