import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { OffchainStorageService } from './offchain-storage.service';
import { UploadResponseDto } from './dto/upload-response.dto';

@ApiTags('Offchain Storage')
@Controller('relay/offchain-storage')
// @UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key for authentication',
  required: true,
})
export class OffchainStorageController {
  constructor(
    private readonly offchainStorageService: OffchainStorageService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Upload encrypted file to offchain storage',
    description:
      'Uploads an encrypted file to offchain storage (currently Pinata IPFS) and returns the public URL.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The encrypted file to upload',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'File uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No file provided',
  })
  @ApiResponse({
    status: HttpStatus.BAD_GATEWAY,
    description: 'Storage upload failed',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    return this.offchainStorageService.uploadFile(file);
  }
}

