import { Module } from '@nestjs/common';
import { DataRegistryModule } from './data-registry/data-registry.module';
import { TeePoolModule } from './tee-pool/tee-pool.module';
import { DlpModule } from './dlp/dlp.module';
import { SuiRelayModule } from './sui/sui.module';

@Module({
  imports: [DataRegistryModule, TeePoolModule, DlpModule, SuiRelayModule],
})
export class RelayModule {}
