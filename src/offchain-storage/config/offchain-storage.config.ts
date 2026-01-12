import { registerAs } from '@nestjs/config';
import { IsString, IsOptional, IsIn } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { OffchainStorageConfig, StorageProvider } from './offchain-storage-config.type';

class EnvironmentVariablesValidator {
  // Storage provider selector: 'pinata' or 'azure' (default: 'azure')
  @IsString()
  @IsOptional()
  @IsIn(['pinata', 'azure'])
  OFFCHAIN_STORAGE_PROVIDER?: string;

  // New offchain storage service (required if provider is 'azure')
  @IsString()
  @IsOptional()
  OFFCHAIN_STORAGE_URL?: string;

  @IsString()
  @IsOptional()
  OFFCHAIN_STORAGE_API_KEY?: string;

  // Pinata config (required if provider is 'pinata')
  @IsString()
  @IsOptional()
  PINATA_JWT?: string;

  @IsString()
  @IsOptional()
  PINATA_API_URL?: string;

  @IsString()
  @IsOptional()
  PINATA_GATEWAY_URL?: string;
}

export default registerAs<OffchainStorageConfig>('offchainStorage', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const provider = (process.env.OFFCHAIN_STORAGE_PROVIDER || 'azure') as StorageProvider;

  return {
    provider,

    // New offchain storage service
    storageServiceUrl: process.env.OFFCHAIN_STORAGE_URL || '',
    storageServiceApiKey: process.env.OFFCHAIN_STORAGE_API_KEY || '',

    // Pinata config (for rollback)
    pinataJwt: process.env.PINATA_JWT || '',
    pinataApiUrl:
      process.env.PINATA_API_URL ||
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
    pinataGatewayUrl:
      process.env.PINATA_GATEWAY_URL ||
      'https://dfusion-social-lens.mypinata.cloud/ipfs',
  };
});
