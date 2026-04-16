import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Story } from '../../stories/entities/story.entity';

@Entity('chapters')
@Index(['storyId', 'chapterNumber'])
export class Chapter {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column()
  chapterNumber!: number;

  @ManyToOne(() => Story, (story) => story.chapters, { onDelete: 'CASCADE' })
  story!: Story;

  @Column()
  storyId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
