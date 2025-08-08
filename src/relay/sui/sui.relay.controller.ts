import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuiTransactionService } from '../../blockchain/sui/sui.transaction.service';
// import { ApiKeyGuard } from '../../auth/api-key.guard';
import { MoveCallDto } from './dto/move-call.dto';
import { MoveCallResponseDto } from './dto/move-call-response.dto';
import {
  CreatePolicyDto,
  CreatePolicyResponseDto,
} from './dto/create-policy.dto';

@ApiTags('sui-relay')
@Controller('relay/sui')
// @UseGuards(ApiKeyGuard)
// @ApiHeader({
//   name: 'x-api-key',
//   required: true,
//   description: 'API Key for authentication',
// })
export class SuiRelayController {
  constructor(private readonly suiTx: SuiTransactionService) {}

  @Post('move-call')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Relay a Sui Move call transaction' })
  @ApiBody({ type: MoveCallDto })
  @ApiOkResponse({ type: MoveCallResponseDto })
  async moveCall(@Body() dto: MoveCallDto) {
    const digest = await this.suiTx.sendMoveCall(dto);
    const response: MoveCallResponseDto = { digest };
    return response;
  }

  @Post('create-policy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create access policy via seal_manager::create_access_policy',
  })
  @ApiBody({ type: CreatePolicyDto })
  @ApiOkResponse({ type: CreatePolicyResponseDto })
  async createPolicy(@Body() dto: CreatePolicyDto) {
    const { digest, policyObjectId } = await this.suiTx.createAccessPolicy(
      dto.packageObjectId,
      dto.dlpWalletAddress,
    );
    return { digest, policyObjectId } as CreatePolicyResponseDto;
  }
}
