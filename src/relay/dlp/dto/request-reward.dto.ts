import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for requesting a reward for a data labeling contribution
 */
export class RequestRewardDto {
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
    description: 'Index of the proof in the contract',
    example: 0,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  proofIndex: number;
}
