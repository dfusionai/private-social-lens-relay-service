import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseContractService } from './base-contract.service';
import { IDataRegistryContract, Permission } from '../interfaces';
import { dataRegistryAbi } from '../abis';
import { BlockchainModuleConfig } from '../../config/blockchain-config.type';
import { WalletService } from '../../wallet/wallet.service';
import { TransactionService } from '../../wallet/transaction.service';

/**
 * Service for interacting with the Data Registry smart contract
 */
@Injectable()
export class DataRegistryContractService
  extends BaseContractService
  implements IDataRegistryContract
{
  constructor(
    protected readonly configService: ConfigService,
    protected readonly walletService: WalletService,
    protected readonly transactionService: TransactionService,
  ) {
    super(configService, walletService, transactionService);
    this.initializeDataRegistryContract();
  }

  /**
   * Initialize the Data Registry contract
   */
  private initializeDataRegistryContract(): void {
    const config = this.configService.get<BlockchainModuleConfig>(
      'blockchain',
      { infer: true },
    );
    if (!config) {
      throw new Error('Blockchain configuration not found');
    }

    const contractAddress = config.contracts.dataRegistry.address;
    this.initializeContract(dataRegistryAbi, contractAddress);
  }

  /**
   * Adds a file to the registry with specified permissions
   *
   * @param url - URL of the file
   * @param ownerAddress - Address of the file owner
   * @param permissions - Array of permission objects with account and key
   * @returns Transaction hash
   */
  async addFileWithPermissions(
    url: string,
    ownerAddress: string,
    permissions: Permission[],
  ): Promise<string> {
    this.logger.log(
      `Adding file with URL ${url} to registry with ${permissions.length} permissions`,
    );

    return this.sendTransactionWithPoolWallet(
      'addFileWithPermissions',
      '0',
      url,
      ownerAddress,
      permissions,
    );
  }
}
