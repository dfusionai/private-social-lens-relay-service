import { Module } from '@nestjs/common';
import { DataRegistryModule } from './data-registry/data-registry.module';
import { TeePoolModule } from './tee-pool/tee-pool.module';
import { DlpModule } from './dlp/dlp.module';

@Module({
  imports: [DataRegistryModule, TeePoolModule, DlpModule],
})
export class RelayModule {}
