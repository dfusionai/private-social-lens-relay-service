import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OffchainStorageController } from './offchain-storage.controller';
import { OffchainStorageService } from './offchain-storage.service';
import offchainStorageConfig from './config/offchain-storage.config';

@Module({
  imports: [ConfigModule.forFeature(offchainStorageConfig)],
  controllers: [OffchainStorageController],
  providers: [OffchainStorageService],
  exports: [OffchainStorageService],
})
export class OffchainStorageModule {}

