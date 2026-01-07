import { ApiProperty } from '@nestjs/swagger';

export class RefineResponseDto {
  @ApiProperty({
    description: 'Transaction hash from addRefinementWithPermission',
    example: '0xabc123...',
  })
  add_refinement_tx_hash: string;
}
