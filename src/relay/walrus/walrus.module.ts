import { Module } from '@nestjs/common';
import { SuiModule } from '../../blockchain/sui/sui.module';
import { WalrusRelayController } from './walrus.relay.controller';

@Module({
  imports: [SuiModule],
  controllers: [WalrusRelayController],
})
export class WalrusRelayModule {}
