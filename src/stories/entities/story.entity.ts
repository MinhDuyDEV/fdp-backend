import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Chapter } from '../../chapters/entities/chapter.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Rating } from '../../ratings/entities/rating.entity';
import { ReadingProgress } from '../../reading-progress/entities/reading-progress.entity';

export enum StoryGenre {
  Action = 'Action',
  Horror = 'Horror',
  Romance = 'Romance',
  Detective = 'Detective',
}

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column()
  author!: string;

  @Column({ type: 'enum', enum: StoryGenre })
  genre!: StoryGenre;

  @Column({ nullable: true })
  coverImage!: string;

  @Column({ default: 0 })
  viewCount!: number;

  @OneToMany(() => Chapter, (chapter) => chapter.story)
  chapters!: Chapter[];

  @OneToMany(() => Comment, (comment) => comment.story)
  comments!: Comment[];

  @OneToMany(() => Rating, (rating) => rating.story)
  ratings!: Rating[];

  @OneToMany(() => ReadingProgress, (progress) => progress.story)
  readingProgress!: ReadingProgress[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
