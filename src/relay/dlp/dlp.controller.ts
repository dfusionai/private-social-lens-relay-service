import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { DlpContractService } from '../../blockchain/contracts/services';
import { RequestRewardDto } from './dto';
import { TransactionResponse } from '../common/interfaces';
import { TransactionsService } from '../../transactions/transactions.service';
import { TransactionStatus } from '../../transactions/domain/transaction.status';
import { ApiKeyGuard } from '../../auth/api-key.guard';

@ApiTags('Vana Relay')
@Controller('relay/dlp')
@UseGuards(ApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'API Key for authentication',
  required: true,
})
export class DlpController {
  constructor(
    private readonly dlpContractService: DlpContractService,
    private readonly transactionService: TransactionsService,
  ) {}

  @Post('request-reward')
  @ApiOperation({
    summary: 'Request a reward for a data labeling contribution',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The reward request has been successfully submitted',
    schema: {
      type: 'object',
      properties: {
        transactionHash: {
          type: 'string',
          example:
            '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
        status: {
          type: 'string',
          example: 'success',
          enum: ['success', 'pending', 'failed'],
        },
        timestamp: { type: 'string', example: '2023-09-15T12:34:56.789Z' },
        metadata: {
          type: 'object',
          properties: {
            fileId: { type: 'number', example: 1 },
            proofIndex: { type: 'number', example: 0 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or missing API key',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'An error occurred while processing the request',
  })
  async requestReward(
    @Body() requestRewardDto: RequestRewardDto,
  ): Promise<TransactionResponse> {
    try {
      // Store transaction in the database
      const transaction = await this.transactionService.create({
        method: 'requestReward',
        chainId: Number(this.dlpContractService.getChainId()),
        parameters: {
          fileId: requestRewardDto.fileId,
          proofIndex: requestRewardDto.proofIndex,
        },
        metadata: {
          fileId: requestRewardDto.fileId,
          proofIndex: requestRewardDto.proofIndex,
        },
        transactionState: TransactionStatus.PENDING,
      });

      let transactionHash: string | null = null;

      try {
        transactionHash = await this.dlpContractService.requestReward(
          requestRewardDto.fileId,
          requestRewardDto.proofIndex,
        );
      } catch (contractError) {
        // Contract call failed, update transaction data
        await this.transactionService.update(transaction.id, {
          transactionHash,
          transactionState: TransactionStatus.FAILED,
          errorMessage: contractError?.message,
        });
        throw new HttpException(
          `Failed to request reward: ${contractError.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.transactionService.update(transaction.id, {
        transactionHash,
        transactionState: TransactionStatus.SUCCESS,
      });

      return {
        transactionHash: transactionHash,
        status: TransactionStatus.SUCCESS,
        timestamp: transaction.createdAt.toISOString(),
        metadata: transaction.metadata,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to request reward: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
