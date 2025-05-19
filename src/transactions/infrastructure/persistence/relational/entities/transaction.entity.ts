import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { TransactionStatus } from '../../../../domain/transaction.status';

@Entity({
  name: 'transaction',
})
export class TransactionEntity extends EntityRelationalHelper {
  @Column({
    nullable: false,
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  transactionState: TransactionStatus;

  @Column({
    nullable: true,
    type: String,
  })
  errorMessage?: string | null;

  @Column({
    nullable: true,
    type: 'jsonb',
  })
  metadata?: Record<string, any>;

  @Column({
    nullable: true,
    type: 'jsonb',
  })
  parameters?: Record<string, any>;

  @Column({
    nullable: false,
    type: String,
  })
  method: string;

  @Column({
    nullable: false,
    type: Number,
  })
  chainId: number;

  @Column({
    nullable: true,
    type: String,
  })
  transactionHash?: string | null;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
