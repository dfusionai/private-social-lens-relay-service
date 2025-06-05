import {
  IsString,
  IsArray,
  IsEthereumAddress,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for permission object
 */
export class PermissionDto {
  @ApiProperty({
    description: 'Ethereum address of the account with permission',
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsString()
  @IsEthereumAddress()
  @IsNotEmpty()
  account: string;

  @ApiProperty({
    description: 'Access key for the permission',
    example: 'key-123456',
  })
  @IsString()
  @IsNotEmpty()
  key: string;
}

/**
 * DTO for adding a file to the Data Registry with permissions
 */
export class AddFileDto {
  @ApiProperty({
    description: 'URL of the file',
    example: 'https://example.com/files/file-123456',
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'Ethereum address of the file owner',
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsString()
  @IsEthereumAddress()
  @IsNotEmpty()
  ownerAddress: string;

  @ApiProperty({
    description: 'Array of permission objects with account and key',
    type: [PermissionDto],
    example: [
      {
        account: '0x1234567890123456789012345678901234567890',
        key: 'key-123456',
      },
      {
        account: '0x0987654321098765432109876543210987654321',
        key: 'key-654321',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions: PermissionDto[];
}
