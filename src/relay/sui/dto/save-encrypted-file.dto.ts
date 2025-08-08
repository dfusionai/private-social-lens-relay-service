import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class SaveEncryptedFileDto {
  @ApiProperty({ description: 'File ID in hex format', example: '0xabc123...' })
  @IsString()
  fileId: string;

  @ApiProperty({ description: 'Policy Object ID', example: '0xdef456...' })
  @IsString()
  policyObjId: string;

  @ApiProperty({
    description: 'File metadata object',
    example: {
      name: 'example.txt',
      size: 1024,
      type: 'text/plain',
      encryptedKey: 'encrypted_key_data',
    },
  })
  @IsObject()
  metadata: Record<string, any>;
}

export class SaveEncryptedFileResponseDto {
  @ApiProperty({
    description: 'On-chain file object ID',
    example: '0x789abc...',
  })
  onChainFileObjId: string;
}
