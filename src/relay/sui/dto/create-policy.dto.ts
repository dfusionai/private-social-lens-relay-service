import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePolicyDto {
  @ApiProperty({ description: 'Package Object ID', example: '0xabc123...' })
  @IsString()
  packageObjectId: string;

  @ApiProperty({ description: 'DLP wallet Sui address', example: '0x...' })
  @IsString()
  dlpWalletAddress: string;
}

export class CreatePolicyResponseDto {
  @ApiProperty({ description: 'Transaction digest' })
  digest: string;

  @ApiProperty({ description: 'Created policy objectId', nullable: true })
  policyObjectId: string | null;
}
