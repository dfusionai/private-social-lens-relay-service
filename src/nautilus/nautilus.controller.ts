import {
  Body,
  Controller,
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
import { ApiKeyGuard } from '../auth/api-key.guard';
import { NautilusService } from './nautilus.service';

@ApiTags('Nautilus Relay')
@Controller('relay/nautilus-tee')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  required: true,
  description: 'API Key for authentication',
})
export class NautilusController {
  constructor(private readonly nautilusService: NautilusService) {}

  @Post('encrypt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Encrypt raw chat data',
  })
  @ApiBody({ type: String })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        encryptedData: { type: 'string' },
        message: { type: 'string' },
        error: { type: 'string', nullable: true },
      },
    },
  })
  async encryptChats(@Body() body: { telegramChats: string }) {
    try {
      const encryptedData = await this.nautilusService.encryptData(
        body.telegramChats,
      );

      return {
        success: true,
        encryptedData,
        message: 'Chats encrypted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to encrypt chats',
      };
    }
  }
}
