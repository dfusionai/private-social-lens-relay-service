import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'Public URL to the uploaded file',
    example: 'https://dfusion-social-lens.mypinata.cloud/ipfs/QmXyz...',
  })
  url: string;

  @ApiProperty({
    description: 'IPFS hash (CID) of the uploaded file',
    example: 'QmXyz123abc...',
  })
  ipfsHash: string;

  @ApiProperty({
    description: 'Size of the uploaded file in bytes',
    example: 12345,
  })
  size: number;
}

