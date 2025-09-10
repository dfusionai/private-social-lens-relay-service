import { ApiProperty } from '@nestjs/swagger';

export class ClientConfigDto {
  @ApiProperty({ type: Array<string> })
  keyServers: Array<string>;

  @ApiProperty({ type: String })
  movePackageId: string;

  @ApiProperty({ type: String })
  policyObjectId: string;
}
