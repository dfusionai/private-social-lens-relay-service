import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseContractService } from './base-contract.service';
import { IDlpContract } from '../interfaces';
import { dlpAbi } from '../abis';
import { BlockchainModuleConfig } from '../../config/blockchain-config.type';
import { WalletService } from '../../wallet/wallet.service';
import { TransactionService } from '../../wallet/transaction.service';

/**
 * Service for interacting with the DLP (Data Labeling Protocol) smart contract
 */
@Injectable()
export class DlpContractService
  extends BaseContractService
  implements IDlpContract
{
  constructor(
    protected readonly configService: ConfigService,
    protected readonly walletService: WalletService,
    protected readonly transactionService: TransactionService,
  ) {
    super(configService, walletService, transactionService);
    this.initializeDlpContract();
  }

  /**
   * Initialize the DLP contract
   */
  private initializeDlpContract(): void {
    const config = this.configService.get<BlockchainModuleConfig>(
      'blockchain',
      { infer: true },
    );
    if (!config) {
      throw new Error('Blockchain configuration not found');
    }

    const contractAddress = config.contracts.dlp.address;
    this.initializeContract(dlpAbi, contractAddress);
  }

  /**
   * Requests a reward for a data labeling contribution
   *
   * @param fileId - ID of the file in the Data Registry
   * @param proofIndex - Index of the proof in the contract
   * @returns Transaction hash
   */
  async requestReward(fileId: number, proofIndex: number): Promise<string> {
    this.logger.log(
      `Requesting reward for file ID ${fileId} with proof index ${proofIndex}`,
    );

    return this.sendTransactionWithPoolWallet(
      'requestReward',
      '0',
      fileId,
      proofIndex,
    );
  }
}
