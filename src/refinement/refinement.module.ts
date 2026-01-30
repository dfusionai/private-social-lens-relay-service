import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RefinementService } from './refinement.service';
import refinementConfig from './config/refinement.config';

@Module({
  imports: [ConfigModule.forFeature(refinementConfig)],
  controllers: [],
  providers: [RefinementService],
  exports: [RefinementService],
})
export class RefinementModule {}

