import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { BlockchainModuleConfig } from '../../config/blockchain-config.type';
import { WalletService } from '../../wallet/wallet.service';
import { TransactionService } from '../../wallet/transaction.service';

/**
 * Base service for interacting with smart contracts
 *
 * This service provides common functionality for all contract types
 */
@Injectable()
export abstract class BaseContractService implements OnModuleInit {
  protected readonly logger = new Logger(this.constructor.name);
  protected provider: ethers.providers.JsonRpcProvider;
  protected wallet: ethers.Wallet;
  protected contract: ethers.Contract;
  protected useWalletPool = false;
  protected chainId: number;

  protected constructor(
    protected readonly configService: ConfigService,
    protected readonly walletService: WalletService,
    protected readonly transactionService: TransactionService,
  ) {}

  /**
   * Lifecycle hook that is called when the module is initialized
   */
  async onModuleInit(): Promise<void> {
    this.initializeProvider();
    await this.initializeWallet();

    // Check wallet pool configuration
    const config = this.configService.get<BlockchainModuleConfig>(
      'blockchain',
      { infer: true },
    );
    if (config && config.wallet.pool.enabled) {
      this.useWalletPool = true;
      this.logger.log('Contract service configured to use wallet pool');
    }

    // Store chain ID
    if (config) {
      this.chainId = config.blockchain.chainId;
    }
  }

  /**
   * Initialize the Ethereum provider
   */
  protected initializeProvider(): void {
    const config = this.configService.get<BlockchainModuleConfig>(
      'blockchain',
      { infer: true },
    );
    if (!config) {
      throw new Error('Blockchain configuration not found');
    }

    this.provider = new ethers.providers.JsonRpcProvider(
      config.blockchain.provider,
    );
    this.logger.log(
      `Provider initialized for network: ${config.blockchain.network}`,
    );
  }

  /**
   * Get the chain ID for the current blockchain
   * @returns The chain ID as a number
   */
  public getChainId(): number {
    return this.chainId;
  }

  /**
   * Initialize the wallet for transaction signing
   */
  protected async initializeWallet(): Promise<void> {
    const config = this.configService.get<BlockchainModuleConfig>(
      'blockchain',
      { infer: true },
    );
    if (!config) {
      throw new Error('Blockchain configuration not found');
    }

    const walletId = 'default'; // Use a constant ID for the default wallet

    try {
      // Try to get the wallet from the wallet service
      if (this.walletService.walletExists(walletId)) {
        this.wallet = await this.walletService.getWallet(
          walletId,
          this.provider,
        );
        this.logger.log('Wallet retrieved from secure storage');
      } else {
        // If wallet doesn't exist, create it from environment variable (for backward compatibility)
        const privateKeyEnvVar = config.wallet.privateKeyEnvVar;
        const privateKey = process.env[privateKeyEnvVar];

        if (!privateKey) {
          throw new Error(
            `Private key not found in environment variable: ${privateKeyEnvVar}`,
          );
        }

        // Store the wallet securely
        await this.walletService.storeWallet(walletId, privateKey);
        this.wallet = await this.walletService.getWallet(
          walletId,
          this.provider,
        );
        this.logger.log('Wallet created and stored securely');
      }
    } catch (error) {
      this.logger.error(`Failed to initialize wallet: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize the contract with the given ABI and address
   *
   * @param abi - Contract ABI
   * @param address - Contract address
   */
  protected initializeContract(abi: any[], address: string): void {
    if (!address) {
      throw new Error('Contract address not provided');
    }

    this.contract = new ethers.Contract(address, abi, this.wallet);
    this.logger.log(`Contract initialized at address: ${address}`);
  }

  /**
   * Send a transaction to the contract
   *
   * @param method - Contract method to call
   * @param args - Arguments for the method
   * @returns Transaction hash
   */
  protected async sendTransaction(
    method: string,
    value: string = '0',
    ...args: any[]
  ): Promise<string> {
    try {
      // Get the contract interface
      const contractInterface = this.contract.interface;

      // Encode the function data
      const data = contractInterface.encodeFunctionData(method, args);

      // Get the contract address
      const to = this.contract.address;

      // Use the transaction service to send the transaction
      const txHash = await this.transactionService.sendTransaction(
        'default', // Use the default wallet
        to,
        data,
        value, // Value to send
        'medium', // Medium priority
      );

      this.logger.log(`Transaction sent: ${txHash}`);

      return txHash;
    } catch (error) {
      this.logger.error(
        `Error sending transaction to ${method}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Send a transaction to the contract using a wallet from the pool
   *
   * @param method - Contract method to call
   * @param value - Value to send in ether
   * @param args - Arguments for the method
   * @returns Transaction hash
   */
  protected async sendTransactionWithPoolWallet(
    method: string,
    value: string = '0',
    ...args: any[]
  ): Promise<string> {
    try {
      // Check if wallet pool is enabled, otherwise fallback to default wallet
      if (!this.useWalletPool) {
        this.logger.warn('Wallet pool not enabled, using default wallet');
        return this.sendTransaction(method, value, ...args);
      }

      // Get the contract interface
      const contractInterface = this.contract.interface;

      // Encode the function data
      const data = contractInterface.encodeFunctionData(method, args);

      // Get the contract address
      const to = this.contract.address;

      // Use the transaction service with pool wallet to send the transaction
      const txHash =
        await this.transactionService.sendTransactionWithPoolWallet(
          to,
          data,
          value,
          'medium',
        );

      this.logger.log(`Transaction sent with pool wallet: ${txHash}`);

      return txHash;
    } catch (error) {
      this.logger.error(
        `Error sending transaction to ${method} with pool wallet: ${error.message}`,
      );
      throw error;
    }
  }
}
