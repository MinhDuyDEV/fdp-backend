import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Story } from '../../stories/entities/story.entity';

@Entity('chapters')
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
