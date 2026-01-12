import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'Public URL to the uploaded file',
    example: 'https://storage.socialtruth.io/blobs/a1b2c3d4e5f6...',
  })
  url: string;

  @ApiProperty({
    description:
      'Content hash (SHA-256) of the uploaded file. Named ipfsHash for backward compatibility.',
    example: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
  })
  ipfsHash: string;

  @ApiProperty({
    description: 'Size of the uploaded file in bytes',
    example: 12345,
  })
  size: number;
}
