import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { RefinementService } from './refinement.service';
import { RefineRequestDto } from './dto/refine-request.dto';
import { RefineResponseDto } from './dto/refine-response.dto';

@ApiTags('Refinement')
@Controller('relay/refinement')
// @UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key for authentication',
  required: true,
})
export class RefinementController {
  constructor(private readonly refinementService: RefinementService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refine data via external refinement service',
    description:
      'Calls the external refinement service to process data. ' +
      'The backend adds refiner_id and PINATA_API_JWT from its own config.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Refinement completed successfully',
    type: RefineResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request body',
  })
  @ApiResponse({
    status: HttpStatus.BAD_GATEWAY,
    description: 'Refinement service call failed',
  })
  async refineData(
    @Body() refineRequest: RefineRequestDto,
  ): Promise<RefineResponseDto> {
    return this.refinementService.refineData(
      refineRequest.fileId,
      refineRequest.encryptionKey,
    );
  }
}

