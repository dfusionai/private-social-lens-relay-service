import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class WalrusUploadRequestDto {
  // @ApiProperty({
  //   type: 'string',
  //   format: 'binary',
  //   description: 'File to upload',
  // })
  // file: any; // purely for docs, file is uploaded via @UploadedFile

  @ApiProperty({
    type: 'number',
    example: 5,
    description: 'Epochs to store the file',
  })
  @IsString()
  epochs: string;
}

export class WalrusUploadResponseDto {
  @ApiProperty({ description: 'Walrus ID', example: '0xdef456...' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Walrus blob ID', example: '0xdef456...' })
  @IsString()
  blobId: string;

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
  blobObject: {
    id: {
      id: string;
    };
    registered_epoch: number;
    blob_id: string;
    size: string;
    encoding_type: number;
    certified_epoch: number | null;
    storage: {
      id: {
        id: string;
      };
      start_epoch: number;
      end_epoch: number;
      storage_size: string;
    };
    deletable: boolean;
  };
}
