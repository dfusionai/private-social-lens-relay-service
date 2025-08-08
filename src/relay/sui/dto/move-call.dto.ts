import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class MoveCallDto {
  @ApiProperty({ description: 'Package object ID', example: '0xabc123...' })
  @IsString()
  packageObjectId: string;

  @ApiProperty({ description: 'Move module name', example: 'my_module' })
  @IsString()
  module: string;

  @ApiProperty({ description: 'Move entry function name', example: 'my_entry' })
  @IsString()
  function: string;

  @ApiProperty({
    description: 'Type arguments for the Move call',
    example: ['0x2::sui::SUI'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  typeArguments?: string[];

  @ApiProperty({
    description: 'Arguments for the Move call (pure or object IDs)',
    example: ['arg1', 123, true],
    required: false,
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  arguments?: any[];
}
