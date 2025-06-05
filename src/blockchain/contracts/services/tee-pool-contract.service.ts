import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseContractService } from './base-contract.service';
import { ITeePoolContract } from '../interfaces';
import { teePoolAbi } from '../abis';
import { BlockchainModuleConfig } from '../../config/blockchain-config.type';
import { WalletService } from '../../wallet/wallet.service';
import { TransactionService } from '../../wallet/transaction.service';

/**
 * Service for interacting with the TEE Pool smart contract
 */
@Injectable()
export class TeePoolContractService
  extends BaseContractService
  implements ITeePoolContract
{
  constructor(
    configService: ConfigService,
    walletService: WalletService,
    transactionService: TransactionService,
  ) {
    super(configService, walletService, transactionService);
    this.initializeTeePoolContract();
  }

  /**
   * Initialize the TEE Pool contract
   */
  private initializeTeePoolContract(): void {
    const config = this.configService.get<BlockchainModuleConfig>(
      'blockchain',
      { infer: true },
    );
    if (!config) {
      throw new Error('Blockchain configuration not found');
    }

    const contractAddress = config.contracts.teePool.address;
    this.initializeContract(teePoolAbi, contractAddress);
  }

  /**
   * Requests a contribution proof from the TEE Pool
   *
   * @param fileId - ID of the file in the Data Registry
   * @param teeFee - Tee fee in wei
   * @returns Transaction hash
   */
  async requestContributionProof(
    fileId: number,
    teeFee: string,
  ): Promise<string> {
    this.logger.log(`Requesting contribution proof for file ID: ${fileId}`);

    return this.sendTransactionWithPoolWallet(
      'requestContributionProof',
      teeFee.toString(),
      fileId,
    );
  }
}
