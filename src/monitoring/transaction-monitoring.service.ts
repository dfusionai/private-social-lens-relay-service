import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TransactionsService } from '../transactions/transactions.service';
import { MailerService } from '../mailer/mailer.service';
import { AllConfigType } from '../config/config.type';
import { IPaginationOptions } from '../utils/types/pagination-options';
import path from 'path';
import { BlockchainModuleConfig } from '../blockchain/config/blockchain-config.type';

// Transaction anomaly types
enum AnomalyType {
  FAILED_TRANSACTION = 'failed_transaction',
  HIGH_GAS_USAGE = 'high_gas_usage',
  REPEATED_FAILURES = 'repeated_failures',
}

// Configuration for anomaly detection
interface AnomalyConfig {
  highGasThreshold: number; // In wei
  failureCountThreshold: number; // Number of failures to trigger alert
  checkPeriodHours: number; // Hours to look back for anomalies
}

@Injectable()
export class TransactionMonitoringService {
  private readonly logger = new Logger(TransactionMonitoringService.name);
  private readonly operationsEmail: string;
  private readonly anomalyConfig: AnomalyConfig;

  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly mailerService: MailerService,
  ) {
    // Load transaction monitoring configuration
    const blockchainConfig = this.configService.get<BlockchainModuleConfig>(
      'blockchain',
      { infer: true },
    );

    // Set monitoring values from config or use defaults
    if (
      blockchainConfig &&
      blockchainConfig.monitoring &&
      blockchainConfig.monitoring.transaction
    ) {
      const transactionConfig = blockchainConfig.monitoring.transaction;
      this.anomalyConfig = {
        highGasThreshold: transactionConfig.highGasThreshold,
        failureCountThreshold: transactionConfig.failureCountThreshold,
        checkPeriodHours: transactionConfig.checkPeriodHours,
      };
      this.operationsEmail = blockchainConfig.monitoring.wallet.operationsEmail;
      this.logger.log(
        'Loaded transaction monitoring configuration from blockchain config',
      );
    } else {
      // Fallback to direct config or defaults
      this.operationsEmail =
        this.configService.get('mail.defaultEmail', { infer: true }) ||
        'operations@example.com';
      this.anomalyConfig = {
        highGasThreshold: 500000000000, // 500 Gwei * 1 million gas (high gas usage)
        failureCountThreshold: 3, // Alert after 3 failures
        checkPeriodHours: 24, // Look back 24 hours
      };
      this.logger.log('Using default transaction monitoring configuration');
    }
  }

  /**
   * Run transaction anomaly checks every 15 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkForAnomalies(): Promise<void> {
    try {
      this.logger.log('Checking for transaction anomalies');

      // Get latest transactions
      const recentTransactions = await this.getRecentTransactions();

      if (!recentTransactions || recentTransactions.length === 0) {
        this.logger.log('No recent transactions found for analysis');
        return;
      }

      this.logger.log(`Analyzing ${recentTransactions.length} transactions`);

      // Check for failed transactions
      const failedTransactions = recentTransactions.filter(
        (tx) =>
          tx.transactionState === 'failed' ||
          tx.transactionState === 'reverted' ||
          tx.errorMessage,
      );

      if (failedTransactions.length > 0) {
        this.logger.warn(
          `Found ${failedTransactions.length} failed transactions`,
        );
        await this.processFailedTransactions(failedTransactions);
      }

      // Check for high gas usage
      await this.checkHighGasUsage(recentTransactions);

      // Check for repeated failures of the same method
      await this.checkRepeatedFailures(recentTransactions);

      this.logger.log('Transaction anomaly check completed');
    } catch (error) {
      this.logger.error(
        `Error checking transaction anomalies: ${error.message}`,
      );

      // Send alert for monitoring error
      await this.sendMonitoringErrorAlert(error.message);
    }
  }

  /**
   * Get recent transactions within the check period
   */
  private async getRecentTransactions(): Promise<any[]> {
    try {
      // Setting pagination to get a reasonable number of recent transactions
      const paginationOptions: IPaginationOptions = {
        page: 1,
        limit: 100,
      };

      const result = await this.transactionsService.findAllWithPagination({
        paginationOptions,
      });

      // Filter for transactions within our check period
      const checkPeriodMs =
        this.anomalyConfig.checkPeriodHours * 60 * 60 * 1000;
      const cutoffTime = new Date(Date.now() - checkPeriodMs);

      // Handle different response formats safely
      let transactions: any[] = [];
      if (result) {
        if (Array.isArray(result)) {
          transactions = result;
        } else if (result && typeof result === 'object') {
          // Try to get data property if it exists
          transactions = Array.isArray(result.data) ? result.data : [];
        }
      }

      this.logger.log(`Found ${transactions.length} transactions for analysis`);

      return transactions.filter(
        (tx) => tx && tx.createdAt && new Date(tx.createdAt) >= cutoffTime,
      );
    } catch (error) {
      this.logger.error(`Error fetching recent transactions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process failed transactions
   */
  private async processFailedTransactions(
    failedTransactions: any[],
  ): Promise<void> {
    // Group by error message for better reporting
    const errorGroups = new Map<string, any[]>();

    failedTransactions.forEach((tx) => {
      const errorKey = tx.errorMessage || 'Unknown Error';
      if (!errorGroups.has(errorKey)) {
        errorGroups.set(errorKey, []);
      }
      errorGroups.get(errorKey)?.push(tx);
    });

    // Send alert for each error group
    for (const [errorMessage, transactions] of errorGroups.entries()) {
      await this.sendTransactionAnomalyAlert(
        AnomalyType.FAILED_TRANSACTION,
        `${transactions.length} transactions failed with error: ${errorMessage}`,
        transactions,
      );
    }
  }

  /**
   * Check for high gas usage transactions
   */
  private async checkHighGasUsage(transactions: any[]): Promise<void> {
    const highGasTransactions = transactions.filter((tx) => {
      // Check if gas information is available in metadata
      if (tx.metadata && tx.metadata.gasUsed && tx.metadata.gasPrice) {
        const gasUsed = BigInt(tx.metadata.gasUsed);
        const gasPrice = BigInt(tx.metadata.gasPrice);
        const totalGas = gasUsed * gasPrice;

        return totalGas > BigInt(this.anomalyConfig.highGasThreshold);
      }
      return false;
    });

    if (highGasTransactions.length > 0) {
      this.logger.warn(
        `Found ${highGasTransactions.length} high gas usage transactions`,
      );

      await this.sendTransactionAnomalyAlert(
        AnomalyType.HIGH_GAS_USAGE,
        `${highGasTransactions.length} transactions with unusually high gas usage detected`,
        highGasTransactions,
      );
    }
  }

  /**
   * Check for repeated failures of the same method
   */
  private async checkRepeatedFailures(transactions: any[]): Promise<void> {
    // Group failed transactions by method
    const methodFailures = new Map<string, any[]>();

    transactions
      .filter(
        (tx) =>
          tx.transactionState === 'failed' ||
          tx.transactionState === 'reverted',
      )
      .forEach((tx) => {
        const methodName = tx.method || 'unknown-method';
        if (!methodFailures.has(methodName)) {
          methodFailures.set(methodName, []);
        }
        methodFailures.get(methodName)?.push(tx);
      });

    // Check if any method has failures above threshold
    for (const [method, failures] of methodFailures.entries()) {
      if (failures.length >= this.anomalyConfig.failureCountThreshold) {
        this.logger.warn(
          `Method ${method} has failed ${failures.length} times`,
        );

        await this.sendTransactionAnomalyAlert(
          AnomalyType.REPEATED_FAILURES,
          `Method ${method} has failed ${failures.length} times in the last ${this.anomalyConfig.checkPeriodHours} hours`,
          failures,
        );
      }
    }
  }

  /**
   * Send a transaction anomaly alert email
   */
  private async sendTransactionAnomalyAlert(
    anomalyType: AnomalyType,
    summary: string,
    transactions: any[],
  ): Promise<void> {
    try {
      // Prepare transaction data for email template
      const transactionDetails = transactions.map((tx) => ({
        id: tx.id,
        hash: tx.transactionHash,
        method: tx.method || 'Unknown',
        chainId: tx.chainId,
        error: tx.errorMessage || 'No error message',
        createdAt: tx.createdAt,
        state: tx.transactionState,
      }));

      await this.mailerService.sendMail({
        to: this.operationsEmail,
        subject: `[ALERT] Transaction Anomaly Detected - ${anomalyType}`,
        templatePath: path.join(
          __dirname,
          '../mail/templates/transaction-anomaly-alert.hbs',
        ),
        context: {
          anomalyType,
          summary,
          transactionCount: transactions.length,
          transactions: transactionDetails,
          timestamp: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Sent transaction anomaly alert email for ${anomalyType}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send transaction anomaly alert: ${error.message}`,
      );
    }
  }

  /**
   * Send a monitoring error alert email
   */
  private async sendMonitoringErrorAlert(errorMessage: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: this.operationsEmail,
        subject: '[ALERT] Transaction Monitoring Error',
        templatePath: path.join(
          __dirname,
          '../mail/templates/monitoring-error-alert.hbs',
        ),
        context: {
          errorMessage,
          timestamp: new Date().toISOString(),
          component: 'Transaction Anomaly Detection',
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
