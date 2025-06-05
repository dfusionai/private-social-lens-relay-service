import { Module } from '@nestjs/common';
import { BlockchainModule } from '../../blockchain/blockchain.module';
import { DataRegistryController } from './data-registry.controller';

@Module({
  imports: [BlockchainModule],
  controllers: [DataRegistryController],
})
export class DataRegistryModule {}
