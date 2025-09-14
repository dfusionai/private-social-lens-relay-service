import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsObject, IsString } from 'class-validator';

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

export class WalrusRelayUploadRequestDto {
  @ApiProperty({
    type: 'number',
    example: 5,
    description: 'Epochs to store the file',
  })
  @IsString()
  epochs: string;

  @ApiProperty({
    type: 'string',
    example: '',
    description: 'Access policy object id',
  })
  @IsString()
  policyObjectId: string;

  @ApiProperty({
    type: 'string',
    example: '',
    description: 'Sui move package module: seal manager object id',
  })
  @IsString()
  movePackageId: string;

  @ApiProperty({
    type: 'array',
    example: 5,
    description: 'Seal key servers for encryption',
  })
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => JSON.parse(value))
  keyServers: string[];
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
