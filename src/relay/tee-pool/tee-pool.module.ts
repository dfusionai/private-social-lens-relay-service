import { Module } from '@nestjs/common';
import { BlockchainModule } from '../../blockchain/blockchain.module';
import { TeePoolController } from './tee-pool.controller';

@Module({
  imports: [BlockchainModule],
  controllers: [TeePoolController],
})
export class TeePoolModule {}
