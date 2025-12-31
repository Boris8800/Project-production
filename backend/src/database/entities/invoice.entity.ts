import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('invoices')
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @Column({ name: 'invoice_number', type: 'text', unique: true })
  invoiceNumber!: string;

  @Column({ name: 'issued_at', type: 'timestamptz', default: () => 'now()' })
  issuedAt!: Date;

  @Column({ name: 'subtotal_pence', type: 'integer' })
  subtotalPence!: number;

  @Column({ name: 'tax_pence', type: 'integer', default: 0 })
  taxPence!: number;

  @Column({ name: 'total_pence', type: 'integer' })
  totalPence!: number;

  @Column({ type: 'char', length: 3, default: () => "'GBP'" })
  currency!: string;

  @Column({ name: 'pdf_url', type: 'text', nullable: true })
  pdfUrl!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
