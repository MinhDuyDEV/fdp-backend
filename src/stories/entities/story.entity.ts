import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
