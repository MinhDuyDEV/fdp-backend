import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ratings')
@Check('"score" >= 1 AND "score" <= 5')
export class Rating {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  score!: number;

  @Column()
  userId!: number;

  @Column()
  storyId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
