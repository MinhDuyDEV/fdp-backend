import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChaptersModule } from './chapters/chapters.module';
import { CommentsModule } from './comments/comments.module';
import { databaseConfig } from './config/database.config';
import { NotificationsModule } from './notifications/notifications.module';
import { RatingsModule } from './ratings/ratings.module';
import { ReadingModeModule } from './reading-mode/reading-mode.module';
import { ReadingProgressModule } from './reading-progress/reading-progress.module';
import { StoriesModule } from './stories/stories.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) =>
        databaseConfig(configService),
      inject: [ConfigService],
    }),
    StoriesModule,
    ChaptersModule,
    ReadingProgressModule,
    ReadingModeModule,
    CommentsModule,
    RatingsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
