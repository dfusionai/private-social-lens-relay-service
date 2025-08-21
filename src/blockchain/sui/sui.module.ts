import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import suiConfig from './config/sui.config';
import { SuiTransactionService } from './sui.transaction.service';
import { SuiWalletService } from './sui.wallet.service';

@Module({
  imports: [ConfigModule.forFeature(suiConfig)],
  providers: [SuiWalletService, SuiTransactionService],
  exports: [SuiWalletService, SuiTransactionService],
})
export class SuiModule {}
