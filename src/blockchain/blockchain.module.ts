import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import blockchainConfig from './config/blockchain.config';
import {
  DataRegistryContractService,
  TeePoolContractService,
  DlpContractService,
} from './contracts/services';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [ConfigModule.forFeature(blockchainConfig), WalletModule],
  providers: [
    DataRegistryContractService,
    TeePoolContractService,
    DlpContractService,
  ],
  exports: [
    DataRegistryContractService,
    TeePoolContractService,
    DlpContractService,
  ],
})
export class BlockchainModule {}
