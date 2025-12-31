import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PaymentStatus } from '../../shared/enums/payment-status.enum';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @Column({ type: 'text' })
  provider!: string; // stripe/razorpay/cash/etc

  @Column({ name: 'provider_payment_id', type: 'text', nullable: true })
  providerPaymentId!: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    enumName: 'payment_status',
    default: PaymentStatus.RequiresPaymentMethod,
  })
  status!: PaymentStatus;

  @Column({ name: 'amount_pence', type: 'integer' })
  amountPence!: number;

  @Column({ type: 'char', length: 3, default: () => "'GBP'" })
  currency!: string;

  @Column({ type: 'jsonb', nullable: true })
  raw!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
