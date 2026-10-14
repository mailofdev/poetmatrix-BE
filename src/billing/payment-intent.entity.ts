import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('payment_intents')
export class PaymentIntent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ length: 16 })
  plan: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ name: 'order_id', length: 64, unique: true })
  orderId: string;

  @Column({ name: 'payment_id', type: 'varchar', length: 64, nullable: true, unique: true })
  paymentId: string | null;

  @Column({ length: 16, default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
