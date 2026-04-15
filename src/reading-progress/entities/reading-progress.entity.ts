import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('reading_progress')
export class ReadingProgress {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  storyId!: number;

  @Column()
  chapterId!: number;

  @Column({ type: 'int', default: 0 })
  scrollPosition!: number;

  @Column()
  readingMode!: string;

  @Column({ type: 'timestamp' })
  lastReadAt!: Date;
}
