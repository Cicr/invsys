import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,
} from 'typeorm';

@Entity('price_history')
export class PriceHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  oldPriceUsd: number;

  @Column('decimal', { precision: 10, scale: 2 })
  newPriceUsd: number;

  @CreateDateColumn()
  changedAt: Date;
}
