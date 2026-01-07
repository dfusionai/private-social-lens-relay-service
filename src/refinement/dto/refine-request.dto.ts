import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class RefineRequestDto {
  @ApiProperty({
    description: 'ID of the file in the Data Registry',
    example: 12345,
  })
  @IsNumber()
  fileId: number;

  @ApiProperty({
    description: 'Original encryption key used to encrypt the file',
    example: '0x1234...',
  })
  @IsString()
  encryptionKey: string;
}
