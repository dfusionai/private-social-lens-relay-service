import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SuiTransactionService } from '../../blockchain/sui/sui.transaction.service';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import {
  CreatePolicyDto,
  CreatePolicyResponseDto,
} from './dto/create-policy.dto';
import {
  SaveEncryptedFileDto,
  SaveEncryptedFileResponseDto,
} from './dto/save-encrypted-file.dto';
import { ClientConfigDto } from './dto/client-config.dto';

@ApiTags('Sui Relay')
@Controller('relay/sui')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  required: true,
  description: 'API Key for authentication',
})
export class SuiRelayController {
  constructor(private readonly suiTx: SuiTransactionService) {}

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

  @Post('save-encrypted-file')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Save encrypted file onchain via seal_manager::save_encrypted_file',
  })
  @ApiBody({ type: SaveEncryptedFileDto })
  @ApiOkResponse({ type: SaveEncryptedFileResponseDto })
  async saveEncryptedFile(@Body() dto: SaveEncryptedFileDto) {
    const onChainFileObjId = await this.suiTx.saveEncryptedFileOnchain(
      dto.fileId,
      dto.policyObjId,
      dto.metadata,
    );
    return { onChainFileObjId } as SaveEncryptedFileResponseDto;
  }

  @Get('client-config')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ClientConfigDto })
  getClientConfig() {
    return this.suiTx.getClientConfig();
  }
}
