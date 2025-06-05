import { registerAs } from '@nestjs/config';

import { IsString, IsNotEmpty } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { ApiKeyConfig } from './api-key-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  @IsNotEmpty()
  API_KEY_SECRET: string;
}

export default registerAs<ApiKeyConfig>('apiKey', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    secret: process.env.API_KEY_SECRET!,
  };
});
