import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import suiConfig from './config/sui.config';
import { SuiTransactionService } from './sui.transaction.service';
import { SuiWalletService } from './sui.wallet.service';
import { WalrusService } from './walrus.relay.service';

@Module({
  imports: [ConfigModule.forFeature(suiConfig)],
  providers: [SuiWalletService, SuiTransactionService, WalrusService],
  exports: [SuiWalletService, SuiTransactionService, WalrusService],
})
export class SuiModule {}
