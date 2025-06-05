import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { MailerModule } from '../mailer/mailer.module';
import { MonitoringService } from './monitoring.service';
import { WalletMonitoringService } from './wallet-monitoring.service';
import { TransactionMonitoringService } from './transaction-monitoring.service';

@Module({
  imports: [ScheduleModule.forRoot(), BlockchainModule, MailerModule],
  providers: [
    MonitoringService,
    WalletMonitoringService,
    TransactionMonitoringService,
  ],
  exports: [
    MonitoringService,
    WalletMonitoringService,
    TransactionMonitoringService,
  ],
})
export class MonitoringModule {}
