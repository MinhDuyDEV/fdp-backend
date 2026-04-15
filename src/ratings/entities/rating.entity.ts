import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Story } from '../../stories/entities/story.entity';
import { User } from '../../users/entities/user.entity';

@Entity('ratings')
@Check('"score" >= 1 AND "score" <= 5')
@Unique('UQ_rating_user_story', ['userId', 'storyId'])
export class Rating {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  score!: number;

  @ManyToOne(() => User, (user) => user.ratings, { onDelete: 'CASCADE' })
  user!: User;

  @Column()
  userId!: number;

  @ManyToOne(() => Story, (story) => story.ratings, { onDelete: 'CASCADE' })
  story!: Story;

  @Column()
  storyId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
