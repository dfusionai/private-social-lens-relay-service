import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import { NautilusConfig } from './nautilus-config.type';
import validateConfig from '../../utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  NAUTILUS_URL: string;
}

export default registerAs<NautilusConfig>('nautilus', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    url: process.env.NAUTILUS_URL || 'http://localhost:3001',
  };
});
