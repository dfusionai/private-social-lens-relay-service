import { Module } from '@nestjs/common';
import { SuiModule } from '../../blockchain/sui/sui.module';
import { SuiRelayController } from './sui.relay.controller';

@Module({
  imports: [SuiModule],
  controllers: [SuiRelayController],
})
export class SuiRelayModule {}
