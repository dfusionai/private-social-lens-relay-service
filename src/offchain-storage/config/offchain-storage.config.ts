import { registerAs } from '@nestjs/config';
import { IsString, IsOptional } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { OffchainStorageConfig } from './offchain-storage-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  PINATA_JWT: string;

  @IsString()
  @IsOptional()
  PINATA_API_URL: string;

  @IsString()
  @IsOptional()
  PINATA_GATEWAY_URL: string;
}

export default registerAs<OffchainStorageConfig>('offchainStorage', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    pinataJwt: process.env.PINATA_JWT || '',
    pinataApiUrl:
      process.env.PINATA_API_URL ||
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
    pinataGatewayUrl:
      process.env.PINATA_GATEWAY_URL ||
      'https://dfusion-social-lens.mypinata.cloud/ipfs',
  };
});

