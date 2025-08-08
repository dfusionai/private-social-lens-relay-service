import { ApiProperty } from '@nestjs/swagger';

export class MoveCallResponseDto {
  @ApiProperty({ description: 'Transaction digest', example: 'HE6p...8P7' })
  digest: string;
}
