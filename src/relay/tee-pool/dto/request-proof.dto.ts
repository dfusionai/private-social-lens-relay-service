import { IsNumber, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for requesting a contribution proof from the TEE Pool
 */
export class RequestProofDto {
  @ApiProperty({
    description: 'ID of the file in the Data Registry',
    example: 1,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  fileId: number;

  @ApiProperty({
    description: 'Tee fee in wei',
    example: 10000000000000000,
    type: String,
  })
  @IsString()
  teeFee: string;
}
