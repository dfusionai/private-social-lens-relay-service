import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { RelationalApiKeyPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalApiKeyPersistenceModule,
  ],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService, RelationalApiKeyPersistenceModule],
})
export class ApiKeysModule {}
