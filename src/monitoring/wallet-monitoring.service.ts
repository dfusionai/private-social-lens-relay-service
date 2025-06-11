import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ethers } from 'ethers';
import { WalletService } from '../blockchain/wallet/wallet.service';
import { MailerService } from '../mailer/mailer.service';
import { AllConfigType } from '../config/config.type';
import path from 'path';
import { BlockchainModuleConfig } from '../blockchain/config/blockchain-config.type';

interface WalletBalanceThreshold {
  threshold: string; // VANA value in string (e.g., "0.1")
  alertEmail: string;
}

@Injectable()
export class WalletMonitoringService {
  private readonly logger = new Logger(WalletMonitoringService.name);
  private readonly balanceThresholds: Record<string, WalletBalanceThreshold> =
    {};
  private readonly operationsEmail: string;
  private readonly defaultThreshold: string;
  private provider: ethers.providers.Provider;

  constructor(
    private readonly walletService: WalletService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly mailerService: MailerService,
  ) {
    // Load wallet monitoring configuration
    const blockchainConfig = this.configService.get<BlockchainModuleConfig>(
      'blockchain',
      { infer: true },
    );

    // Set provider
    if (blockchainConfig && blockchainConfig.blockchain) {
      const provider = blockchainConfig.blockchain.provider;
      if (provider) {
        this.provider = new ethers.providers.JsonRpcProvider(provider);
        this.logger.log(`Initialized provider from configuration: ${provider}`);
      }
    }

    // Set monitoring values from config or use defaults
    if (
      blockchainConfig &&
      blockchainConfig.monitoring &&
      blockchainConfig.monitoring.wallet
    ) {
      this.defaultThreshold =
        blockchainConfig.monitoring.wallet.defaultThreshold;
      this.operationsEmail = blockchainConfig.monitoring.wallet.operationsEmail;
      this.logger.log(
        'Loaded wallet monitoring configuration from blockchain config',
      );
    } else {
      // Fallback to direct config or defaults
      this.operationsEmail =
        this.configService.get('mail.defaultEmail', { infer: true }) ||
        'operations@example.com';
      this.defaultThreshold = '0.1'; // Default 0.1 VANA
      this.logger.log('Using default wallet monitoring configuration');
    }
  }

  /**
   * Set a balance threshold for a specific wallet
   *
   * @param walletId The wallet ID
   * @param threshold The threshold in VANA
   * @param alertEmail Email to notify
   */
  setBalanceThreshold(
    walletId: string,
    threshold: string,
    alertEmail?: string,
  ): void {
    this.balanceThresholds[walletId] = {
      threshold,
      alertEmail: alertEmail || this.operationsEmail,
    };
    this.logger.log(
      `Set balance threshold for wallet ${walletId} to ${threshold} VANA`,
    );
  }

  /**
   * Run balance check for all wallets every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkAllWalletBalances(): Promise<void> {
    try {
      this.logger.log('Checking all wallet balances');

      // Get wallet pool stats to determine available wallets
      const poolStats = this.walletService.getPoolStats();
      this.logger.log(`Wallet pool stats: ${JSON.stringify(poolStats)}`);

      // For each wallet in the pool, check its balance
      for (const walletId of this.walletService.getWalletIds()) {
        await this.checkWalletBalance(walletId);
      }
    } catch (error) {
      this.logger.error(`Error checking wallet balances: ${error.message}`);

      // Send alert for monitoring error
      await this.sendMonitoringErrorAlert(error.message);
    }
  }

  /**
   * Check balance for a specific wallet
   *
   * @param walletId The wallet ID to check
   */
  async checkWalletBalance(walletId: string): Promise<void> {
    try {
      // Ensure we have a provider
      if (!this.provider) {
        throw new Error('No provider available for balance check');
      }

      // Get wallet and its balance
      const wallet = this.walletService.getWallet(walletId, this.provider);
      const balance = await wallet.getBalance();
      const balanceInEth = ethers.utils.formatEther(balance);

      this.logger.log(`Wallet ${walletId} balance: ${balanceInEth} VANA`);

      // Get threshold for this wallet, or use default
      const walletThreshold = this.balanceThresholds[walletId] || {
        threshold: this.defaultThreshold,
        alertEmail: this.operationsEmail,
      };

      // Check if balance is below threshold
      if (parseFloat(balanceInEth) < parseFloat(walletThreshold.threshold)) {
        this.logger.warn(
          `Wallet ${walletId} balance (${balanceInEth} VANA) is below threshold (${walletThreshold.threshold} VANA)`,
        );

        // Send alert email
        await this.sendLowBalanceAlert(
          walletId,
          balanceInEth,
          walletThreshold.threshold,
          walletThreshold.alertEmail,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error checking wallet ${walletId} balance: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Send a low balance alert email
   */
  private async sendLowBalanceAlert(
    walletId: string,
    currentBalance: string,
    threshold: string,
    email: string,
  ): Promise<void> {
    try {
      const walletAddress = this.walletService.getWalletAddress(walletId);

      await this.mailerService.sendMail({
        to: email,
        subject: `[ALERT] Low Wallet Balance - ${walletId}`,
        templatePath: path.join(
          __dirname,
          '../mail/templates/low-balance-alert.hbs',
        ),
        context: {
          walletId,
          walletAddress,
          currentBalance,
          threshold,
          timestamp: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Sent low balance alert email for wallet ${walletId} to ${email}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send low balance alert: ${error.message}`);
    }
  }

  /**
   * Send a monitoring error alert email
   */
  private async sendMonitoringErrorAlert(errorMessage: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: this.operationsEmail,
        subject: '[ALERT] Wallet Monitoring Error',
        templatePath: path.join(
          __dirname,
          '../mail/templates/monitoring-error-alert.hbs',
        ),
        context: {
          errorMessage,
          timestamp: new Date().toISOString(),
          component: 'Wallet Balance Monitoring',
        },
      });

      this.logger.log(
        `Sent monitoring error alert email to ${this.operationsEmail}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send monitoring error alert: ${error.message}`,
      );
    }
  }
}
