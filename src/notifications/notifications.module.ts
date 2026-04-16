import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import {
  ChapterUpdateSubject,
  ReaderObserverFactory,
} from './observers/chapter-update.observer';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ChapterUpdateSubject,
    ReaderObserverFactory,
  ],
  exports: [NotificationsService, ChapterUpdateSubject],
})
export class NotificationsModule {}
