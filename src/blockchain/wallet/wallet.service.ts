import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { BlockchainModuleConfig } from '../config/blockchain-config.type';

/**
 * Service for securely managing wallet private keys
 */
@Injectable()
export class WalletService implements OnModuleInit {
  private readonly logger = new Logger(WalletService.name);
  private readonly encryptionKey: string;
  private readonly storagePath: string;
  private readonly algorithm = 'aes-256-cbc';
  private walletCache: Map<string, ethers.Wallet> = new Map();

  // Wallet pool properties
  private walletPool: string[] = [];
  private inUseWallets: Set<string> = new Set();
  private currentWalletIndex = 0;
  private walletLocks: Map<string, boolean> = new Map();
  private walletAcquisitionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private maxAcquisitionTime = 60000; // 60 seconds timeout

  // Wallet addresses cache
  private walletAddressCache: Map<string, string> = new Map();

  constructor(private readonly configService: ConfigService) {
    // Get encryption key from environment variable
    const encryptionKeyEnvVar =
      process.env.WALLET_ENCRYPTION_KEY_ENV_VAR || 'WALLET_ENCRYPTION_KEY';
    if (!encryptionKeyEnvVar) {
      throw new Error(
        'Environment variable for encryption key not set: WALLET_ENCRYPTION_KEY_ENV_VAR',
      );
    }

    const encryptionKey = process.env[encryptionKeyEnvVar];
    if (!encryptionKey) {
      throw new Error(
        `Encryption key not found in environment variable: ${encryptionKeyEnvVar}`,
      );
    }

    this.encryptionKey = encryptionKey;
    if (!this.encryptionKey) {
      throw new Error(
        `Encryption key not found in environment variable: ${encryptionKeyEnvVar}`,
      );
    }

    // Create storage directory if it doesn't exist
    this.storagePath =
      process.env.WALLET_STORAGE_PATH ||
      path.join(process.cwd(), '.wallet-storage');
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
      this.logger.log(`Created wallet storage directory: ${this.storagePath}`);
    }

    // Initialize wallet pool
    this.initializeWalletPool();
  }

  /**
   * Lifecycle hook to initialize wallet pool from configuration if enabled
   */
  async onModuleInit(): Promise<void> {
    try {
      const config = this.configService.get<BlockchainModuleConfig>(
        'blockchain',
        { infer: true },
      );
      if (!config) {
        this.logger.warn('Blockchain configuration not found for wallet pool');
        return;
      }

      // Check if wallet pool is enabled
      if (config.wallet.pool.enabled) {
        // Update acquisition timeout from config
        this.maxAcquisitionTime = config.wallet.pool.maxAcquisitionTimeMs;

        // Create default wallet if it doesn't exist yet
        if (!this.walletExists('default')) {
          const privateKeyEnvVar = config.wallet.privateKeyEnvVar;
          const privateKey = process.env[privateKeyEnvVar];

          if (privateKey) {
            this.logger.log(
              'Creating default wallet from environment variable',
            );
            await this.storeWallet('default', privateKey);
          }
        }

        // Load wallets from environment variables with prefix
        const prefix = config.wallet.pool.privateKeysEnvPrefix;
        let walletCount = 0;

        // Search all environment variables for the prefix pattern
        await Promise.all(
          Object.keys(process.env)
            .filter((key) => key.startsWith(prefix))
            .map(async (key) => {
              const walletId = key.replace(prefix, '');
              const privateKey = process.env[key];

              // if (privateKey && ethers.utils.isHexString(privateKey)) {
              if (privateKey) {
                if (!this.walletExists(walletId)) {
                  await this.storeWallet(walletId, privateKey);
                  walletCount++;
                } else {
                  this.addToPool(walletId);
                  walletCount++;
                }
              }
            }),
        );

        this.logger.log(
          `Loaded ${walletCount} wallets from environment variables`,
        );

        // If we have fewer wallets than the desired size, log a warning
        if (walletCount < config.wallet.pool.size) {
          this.logger.warn(
            `Wallet pool has only ${walletCount} wallets, but ${config.wallet.pool.size} were requested.`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to initialize wallet pool: ${error.message}`);
    }
  }

  /**
   * Initialize the wallet pool by loading all available wallets
   */
  private initializeWalletPool(): void {
    try {
      if (!fs.existsSync(this.storagePath)) {
        return;
      }

      const files = fs.readdirSync(this.storagePath);
      this.walletPool = files
        .filter((file) => file.endsWith('.enc'))
        .map((file) => file.replace('.enc', ''));

      // Initialize wallet locks
      for (const walletId of this.walletPool) {
        this.walletLocks.set(walletId, false);
      }

      this.logger.log(
        `Wallet pool initialized with ${this.walletPool.length} wallets`,
      );
    } catch (error) {
      this.logger.error(`Failed to initialize wallet pool: ${error.message}`);
    }
  }

  /**
   * Acquire a lock on a wallet
   *
   * @param walletId - ID of the wallet to lock
   * @returns true if lock was acquired, false otherwise
   */
  private acquireLock(walletId: string): boolean {
    if (this.walletLocks.get(walletId)) {
      return false; // Already locked
    }

    this.walletLocks.set(walletId, true);

    // Set a timeout to automatically release the lock in case of failures
    const timeout = setTimeout(() => {
      this.logger.warn(
        `Auto-releasing lock for wallet ${walletId} after timeout`,
      );
      this.releaseLock(walletId);
      this.releaseWallet(walletId);
    }, this.maxAcquisitionTime);

    this.walletAcquisitionTimeouts.set(walletId, timeout);

    return true;
  }

  /**
   * Release a lock on a wallet
   *
   * @param walletId - ID of the wallet to unlock
   */
  private releaseLock(walletId: string): void {
    this.walletLocks.set(walletId, false);

    // Clear any timeout
    const timeout = this.walletAcquisitionTimeouts.get(walletId);
    if (timeout) {
      clearTimeout(timeout);
      this.walletAcquisitionTimeouts.delete(walletId);
    }
  }

  /**
   * Get an available wallet from the pool using round-robin
   *
   * @param provider - Ethereum provider to use with the wallet
   * @param maxAttempts - Maximum number of attempts to find an available wallet
   * @param retryDelay - Delay in ms between retry attempts
   * @returns Wallet ID and ethers wallet instance, or null if no wallet is available
   */
  async getAvailableWallet(
    provider?: ethers.providers.Provider,
    maxAttempts = 15,
    retryDelay = 1000,
  ): Promise<{ walletId: string; wallet: ethers.Wallet } | null> {
    if (this.walletPool.length === 0) {
      this.logger.warn('No wallets available in the pool');
      return null;
    }

    let attempts = 0;

    while (attempts < maxAttempts) {
      const walletId = await this.findAvailableWalletId();

      if (walletId) {
        try {
          const wallet = this.getWallet(walletId, provider);
          return { walletId, wallet };
        } catch (error) {
          this.logger.error(
            `Error getting wallet ${walletId}: ${error.message}`,
          );
          this.releaseWallet(walletId);
          attempts++;
        }
      } else {
        // No wallet available right now, wait and retry
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    this.logger.warn(
      `Failed to get available wallet after ${maxAttempts} attempts`,
    );
    return null;
  }

  /**
   * Find an available wallet ID using round-robin
   *
   * @returns Wallet ID if available, null otherwise
   */
  private findAvailableWalletId(): Promise<string | null> {
    return new Promise((resolve) => {
      // Try to find an available wallet using round-robin
      let checked = 0;

      while (checked < this.walletPool.length) {
        const walletId = this.walletPool[this.currentWalletIndex];

        // Move to next wallet for next call
        this.currentWalletIndex =
          (this.currentWalletIndex + 1) % this.walletPool.length;

        // Check if wallet is not in use and we can acquire a lock
        if (!this.inUseWallets.has(walletId) && this.acquireLock(walletId)) {
          this.inUseWallets.add(walletId);
          this.releaseLock(walletId); // Release the lock but keep it in inUseWallets
          this.logger.debug(`Allocated wallet ${walletId} for use`);
          resolve(walletId);
          return;
        }

        checked++;
      }

      // No wallet available
      resolve(null);
    });
  }

  /**
   * Release a wallet back to the pool
   *
   * @param walletId - ID of the wallet to release
   */
  releaseWallet(walletId: string): void {
    if (this.inUseWallets.has(walletId)) {
      this.inUseWallets.delete(walletId);
      this.logger.debug(`Wallet ${walletId} released back to the pool`);
    }
  }

  /**
   * Add a wallet to the pool
   *
   * @param walletId - ID of the wallet to add
   */
  addToPool(walletId: string): void {
    if (!this.walletExists(walletId)) {
      throw new Error(
        `Cannot add wallet ${walletId} to pool: wallet does not exist`,
      );
    }

    if (!this.walletPool.includes(walletId)) {
      this.walletPool.push(walletId);
      this.walletLocks.set(walletId, false); // Initialize lock state
      this.logger.log(`Wallet ${walletId} added to the pool`);
    }
  }

  /**
   * Remove a wallet from the pool
   *
   * @param walletId - ID of the wallet to remove
   */
  removeFromPool(walletId: string): void {
    const index = this.walletPool.indexOf(walletId);
    if (index !== -1) {
      this.walletPool.splice(index, 1);

      // If the current index is beyond the end of the array after removal,
      // reset it to the beginning
      if (this.currentWalletIndex >= this.walletPool.length) {
        this.currentWalletIndex = 0;
      }

      // If the wallet was in use, remove it from in-use set
      this.inUseWallets.delete(walletId);

      // Remove lock information
      this.walletLocks.delete(walletId);

      // Clear any timeout
      const timeout = this.walletAcquisitionTimeouts.get(walletId);
      if (timeout) {
        clearTimeout(timeout);
        this.walletAcquisitionTimeouts.delete(walletId);
      }

      this.logger.log(`Wallet ${walletId} removed from the pool`);
    }
  }

  /**
   * Get all wallet IDs currently in the pool
   *
   * @returns Array of wallet IDs
   */
  getPoolWallets(): string[] {
    return [...this.walletPool];
  }

  /**
   * Get all wallet IDs currently in use
   *
   * @returns Array of in-use wallet IDs
   */
  getInUseWallets(): string[] {
    return [...this.inUseWallets];
  }

  /**
   * Get wallet pool stats
   *
   * @returns Statistics about the wallet pool
   */
  getPoolStats(): {
    total: number;
    available: number;
    inUse: number;
  } {
    return {
      total: this.walletPool.length,
      available: this.walletPool.length - this.inUseWallets.size,
      inUse: this.inUseWallets.size,
    };
  }

  /**
   * Store a wallet private key securely
   *
   * @param walletId - Identifier for the wallet
   * @param privateKey - Private key to store
   */
  storeWallet(walletId: string, privateKey: string): void {
    try {
      // Encrypt the private key
      const encryptedData = this.encrypt(privateKey);

      // Store the encrypted data
      const filePath = path.join(this.storagePath, `${walletId}.enc`);
      fs.writeFileSync(filePath, JSON.stringify(encryptedData));

      // Add to wallet pool automatically
      if (!this.walletPool.includes(walletId)) {
        this.walletPool.push(walletId);
        this.walletLocks.set(walletId, false); // Initialize lock state
      }

      this.logger.log(`Wallet ${walletId} stored securely and added to pool`);
    } catch (error) {
      this.logger.error(`Failed to store wallet ${walletId}: ${error.message}`);
      throw new Error(`Failed to store wallet: ${error.message}`);
    }
  }

  /**
   * Retrieve a wallet by ID
   *
   * @param walletId - Identifier for the wallet
   * @param provider - Ethereum provider to use with the wallet
   * @returns Ethers wallet instance
   */
  getWallet(
    walletId: string,
    provider?: ethers.providers.Provider,
  ): ethers.Wallet {
    // Check if wallet is in cache
    if (this.walletCache.has(walletId)) {
      const wallet = this.walletCache.get(walletId);
      if (!wallet) {
        throw new Error(`Wallet ${walletId} not found in cache`);
      }
      // If provider is provided and different from current provider, connect to new provider
      if (provider && wallet.provider !== provider) {
        return wallet.connect(provider);
      }
      return wallet;
    }

    try {
      const filePath = path.join(this.storagePath, `${walletId}.enc`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Wallet ${walletId} not found`);
      }

      // Read and decrypt the private key
      const encryptedData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const privateKey = this.decrypt(encryptedData);

      // Create wallet instance
      const wallet = provider
        ? new ethers.Wallet(privateKey, provider)
        : new ethers.Wallet(privateKey);

      // Cache the wallet
      this.walletCache.set(walletId, wallet);

      this.logger.log(`Wallet ${walletId} retrieved successfully`);
      return wallet;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve wallet ${walletId}: ${error.message}`,
      );
      throw new Error(`Failed to retrieve wallet: ${error.message}`);
    }
  }

  /**
   * Check if a wallet exists
   *
   * @param walletId - Identifier for the wallet
   * @returns True if wallet exists, false otherwise
   */
  walletExists(walletId: string): boolean {
    const filePath = path.join(this.storagePath, `${walletId}.enc`);
    return fs.existsSync(filePath);
  }

  /**
   * Delete a wallet
   *
   * @param walletId - Identifier for the wallet
   */
  deleteWallet(walletId: string): void {
    try {
      const filePath = path.join(this.storagePath, `${walletId}.enc`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Wallet ${walletId} not found`);
      }

      // Remove from cache
      this.walletCache.delete(walletId);

      // Remove from pool
      this.removeFromPool(walletId);

      // Delete the file
      fs.unlinkSync(filePath);

      this.logger.log(`Wallet ${walletId} deleted successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to delete wallet ${walletId}: ${error.message}`,
      );
      throw new Error(`Failed to delete wallet: ${error.message}`);
    }
  }

  /**
   * Rotate a wallet key
   *
   * @param walletId - Identifier for the wallet
   * @returns New wallet address
   */
  async rotateWalletKey(walletId: string): Promise<string> {
    try {
      // Get the current wallet
      // const wallet = await this.getWallet(walletId);

      // Generate a new wallet
      const newWallet = ethers.Wallet.createRandom();

      // Store the new wallet
      await this.storeWallet(walletId, newWallet.privateKey);

      // Update cache
      this.walletCache.set(walletId, newWallet);

      this.logger.log(`Wallet ${walletId} key rotated successfully`);
      return newWallet.address;
    } catch (error) {
      this.logger.error(
        `Failed to rotate wallet ${walletId} key: ${error.message}`,
      );
      throw new Error(`Failed to rotate wallet key: ${error.message}`);
    }
  }

  /**
   * Encrypt data using the encryption key
   *
   * @param data - Data to encrypt
   * @returns Encrypted data with IV
   */
  private encrypt(data: string): { iv: string; encryptedData: string } {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(
      this.algorithm,
      crypto
        .createHash('sha256')
        .update(this.encryptionKey)
        .digest('base64')
        .substr(0, 32),
      iv,
    );

    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
    };
  }

  /**
   * Decrypt data using the encryption key
   *
   * @param encryptedData - Encrypted data with IV
   * @returns Decrypted data
   */
  private decrypt(encryptedData: {
    iv: string;
    encryptedData: string;
  }): string {
    // Convert IV from hex to Buffer
    const iv = Buffer.from(encryptedData.iv, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      crypto
        .createHash('sha256')
        .update(this.encryptionKey)
        .digest('base64')
        .substr(0, 32),
      iv,
    );

    // Decrypt the data
    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Get all wallet IDs in the pool
   *
   * @returns Array of wallet IDs
   */
  getWalletIds(): string[] {
    return [...this.walletPool];
  }

  /**
   * Get the wallet address for a given wallet ID
   *
   * @param walletId The wallet ID
   * @returns The wallet's Ethereum address
   */
  getWalletAddress(walletId: string): string {
    // Check if address is in cache
    if (this.walletAddressCache.has(walletId)) {
      return this.walletAddressCache.get(walletId) || '';
    }

    try {
      // Get wallet instance (without provider to avoid network calls)
      const wallet = this.getWallet(walletId);

      // Store address in cache
      this.walletAddressCache.set(walletId, wallet.address);

      return wallet.address;
    } catch (error) {
      this.logger.error(
        `Failed to get address for wallet ${walletId}: ${error.message}`,
      );
      return '';
    }
  }
}
