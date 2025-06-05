import { Module } from '@nestjs/common';
import { BlockchainModule } from '../../blockchain/blockchain.module';
import { DlpController } from './dlp.controller';

@Module({
  imports: [BlockchainModule],
  controllers: [DlpController],
})
export class DlpModule {}
