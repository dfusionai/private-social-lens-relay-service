import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from './transaction.status';

export class Transaction {
  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  transactionState: TransactionStatus;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  errorMessage?: string | null;

  @ApiProperty({
    type: () => 'jsonb',
    nullable: true,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    type: () => 'jsonb',
    nullable: true,
  })
  parameters?: Record<string, any>;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  method: string;

  @ApiProperty({
    type: () => Number,
    nullable: false,
  })
  chainId: number;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  transactionHash?: string | null;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
