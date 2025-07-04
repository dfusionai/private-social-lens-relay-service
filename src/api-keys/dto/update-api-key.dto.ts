// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { PartialType } from '@nestjs/swagger';
import { CreateApiKeyDto } from './create-api-key.dto';

export class UpdateApiKeyDto extends PartialType(CreateApiKeyDto) {}
