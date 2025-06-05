import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';
import { WalletMonitoringService } from './wallet-monitoring.service';
import { TransactionMonitoringService } from './transaction-monitoring.service';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly walletMonitoringService: WalletMonitoringService,
    private readonly transactionMonitoringService: TransactionMonitoringService,
  ) {}

  /**
   * Checks the system health by running all monitors
   */
  async checkSystemHealth(): Promise<void> {
    try {
      this.logger.log('Running system health check');

      // Run wallet balance checks
      await this.walletMonitoringService.checkAllWalletBalances();

      // Run transaction anomaly detection
      await this.transactionMonitoringService.checkForAnomalies();

      this.logger.log('System health check completed');
    } catch (error) {
      this.logger.error(`System health check failed: ${error.message}`);
    }
  }
}
