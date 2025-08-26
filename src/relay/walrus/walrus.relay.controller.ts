import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../../auth/api-key.guard';
import { WalrusService } from '../../blockchain/sui/walrus.relay.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  WalrusUploadRequestDto,
  WalrusUploadResponseDto,
} from './dto/upload.dto';

@ApiTags('Walrus Relay')
@Controller('relay/walrus')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  required: true,
  description: 'API Key for authentication',
})
export class WalrusRelayController {
  constructor(private readonly walrusService: WalrusService) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload encrypted chat data using Walrus relay' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: WalrusUploadRequestDto })
  @ApiOkResponse({
    type: WalrusUploadResponseDto,
    description: 'Result of Walrus upload via relay',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: WalrusUploadRequestDto,
  ) {
    // const result = await this.walrusService.uploadFileViaRelay(file, uploadDto);
    const result =
      await this.walrusService.uploadFileViaRelayWalrusWriteFilesFlowApi(
        file,
        uploadDto,
      );
    return result;
  }
}
