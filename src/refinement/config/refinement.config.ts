import { registerAs } from '@nestjs/config';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { RefinementConfig } from './refinement-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  REFINEMENT_SERVICE_URL: string;

  @IsNumber()
  @IsOptional()
  REFINER_ID: number;

  @IsString()
  PINATA_JWT: string;
}

export default registerAs<RefinementConfig>('refinement', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    serviceUrl: process.env.REFINEMENT_SERVICE_URL || '',
    refinerId: parseInt(process.env.REFINER_ID || '15', 10),
    pinataJwt: process.env.PINATA_JWT || '',
  };
});

