import {
  // decorators here

  IsString,
  IsOptional,
  IsNumber,
} from 'class-validator';

import {
  // decorators here
  ApiProperty,
} from '@nestjs/swagger';
import { TransactionStatus } from '../domain/transaction.status';
export class CreateTransactionDto {
  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  transactionState: TransactionStatus;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  errorMessage?: string | null;

  @ApiProperty({
    required: false,
    type: () => 'jsonb',
  })
  @IsOptional()
  @IsString()
  metadata?: Record<string, any>;

  @ApiProperty({
    required: false,
    type: () => 'jsonb',
  })
  @IsOptional()
  @IsString()
  parameters?: Record<string, any>;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  method: string;

  @ApiProperty({
    required: true,
    type: () => Number,
  })
  @IsNumber()
  chainId: number;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  transactionHash?: string | null;

  // Don't forget to use the class-validator decorators in the DTO properties.
}
