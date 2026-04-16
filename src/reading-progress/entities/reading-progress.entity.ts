import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Chapter } from '../../chapters/entities/chapter.entity';
import { Story } from '../../stories/entities/story.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reading_progress')
@Unique('UQ_reading_progress_user_story', ['userId', 'storyId'])
export class ReadingProgress {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.readingProgress, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @Column()
  userId!: number;

  @ManyToOne(() => Story, (story) => story.readingProgress, {
    onDelete: 'CASCADE',
  })
  story!: Story;

  @Column()
  storyId!: number;

  @ManyToOne(() => Chapter)
  chapter!: Chapter;

  @Column()
  chapterId!: number;

  @Column({ type: 'int', default: 0 })
  scrollPosition!: number;

  @Column()
  readingMode!: string;

  @Column({ type: 'timestamp' })
  lastReadAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
