import { registerAs } from '@nestjs/config';
import validateConfig from '../../utils/validate-config';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  IsBoolean,
} from 'class-validator';
import { BlockchainModuleConfig } from './blockchain-config.type';

enum Network {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
  Local = 'local',
}

class BlockchainEnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  BLOCKCHAIN_PROVIDER: string;

  @IsEnum(Network)
  @IsOptional()
  BLOCKCHAIN_NETWORK: Network;

  @IsInt()
  @IsOptional()
  BLOCKCHAIN_CHAIN_ID: number;

  @IsString()
  @IsOptional()
  WALLET_PRIVATE_KEY_ENV_VAR: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  WALLET_GAS_LIMIT: number;

  @IsString()
  @IsOptional()
  WALLET_MAX_FEE_PER_GAS: string;

  @IsString()
  @IsOptional()
  WALLET_MAX_PRIORITY_FEE_PER_GAS: string;

  @IsBoolean()
  @IsOptional()
  WALLET_POOL_ENABLED: boolean;

  @IsInt()
  @IsPositive()
  @IsOptional()
  WALLET_POOL_SIZE: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  WALLET_POOL_MAX_WAIT_MS: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  WALLET_POOL_MAX_ACQUISITION_TIME_MS: number;

  @IsString()
  @IsOptional()
  WALLET_POOL_PRIVATE_KEYS_ENV_PREFIX: string;

  @IsString()
  @IsOptional()
  CONTRACT_DATA_REGISTRY_ADDRESS: string;

  @IsString()
  @IsOptional()
  CONTRACT_TEE_POOL_ADDRESS: string;

  @IsString()
  @IsOptional()
  CONTRACT_DLP_ADDRESS: string;

  @IsString()
  @IsOptional()
  GAS_MAX_GAS_PRICE: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  GAS_LIMIT_MULTIPLIER: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  GAS_RETRY_COUNT: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  GAS_RETRY_DELAY_MS: number;
}

export default registerAs<BlockchainModuleConfig>('blockchain', () => {
  validateConfig(process.env, BlockchainEnvironmentVariablesValidator);

  return {
    blockchain: {
      provider: process.env.BLOCKCHAIN_PROVIDER || 'http://localhost:8545',
      network: process.env.BLOCKCHAIN_NETWORK || 'local',
      chainId: process.env.BLOCKCHAIN_CHAIN_ID
        ? parseInt(process.env.BLOCKCHAIN_CHAIN_ID, 10)
        : 1337,
    },
    wallet: {
      privateKeyEnvVar:
        process.env.WALLET_PRIVATE_KEY_ENV_VAR || 'WALLET_PRIVATE_KEY',
      gasLimit: process.env.WALLET_GAS_LIMIT
        ? parseInt(process.env.WALLET_GAS_LIMIT, 10)
        : 3000000,
      maxFeePerGas: process.env.WALLET_MAX_FEE_PER_GAS || '50000000000', // 50 gwei
      maxPriorityFeePerGas:
        process.env.WALLET_MAX_PRIORITY_FEE_PER_GAS || '1500000000', // 1.5 gwei
      pool: {
        enabled: process.env.WALLET_POOL_ENABLED === 'true' || false,
        size: process.env.WALLET_POOL_SIZE
          ? parseInt(process.env.WALLET_POOL_SIZE, 10)
          : 5,
        maxWaitMs: process.env.WALLET_POOL_MAX_WAIT_MS
          ? parseInt(process.env.WALLET_POOL_MAX_WAIT_MS, 10)
          : 5000,
        maxAcquisitionTimeMs: process.env.WALLET_POOL_MAX_ACQUISITION_TIME_MS
          ? parseInt(process.env.WALLET_POOL_MAX_ACQUISITION_TIME_MS, 10)
          : 60000,
        privateKeysEnvPrefix:
          process.env.WALLET_POOL_PRIVATE_KEYS_ENV_PREFIX ||
          'WALLET_PRIVATE_KEY_',
      },
    },
    contracts: {
      dataRegistry: {
        address: process.env.CONTRACT_DATA_REGISTRY_ADDRESS || '',
      },
      teePool: {
        address: process.env.CONTRACT_TEE_POOL_ADDRESS || '',
      },
      dlp: {
        address: process.env.CONTRACT_DLP_ADDRESS || '',
      },
    },
    gas: {
      maxGasPrice: process.env.GAS_MAX_GAS_PRICE || '100000000000', // 100 gwei
      gasLimitMultiplier: process.env.GAS_LIMIT_MULTIPLIER
        ? parseFloat(process.env.GAS_LIMIT_MULTIPLIER)
        : 1.2,
      retryCount: process.env.GAS_RETRY_COUNT
        ? parseInt(process.env.GAS_RETRY_COUNT, 10)
        : 3,
      retryDelayMs: process.env.GAS_RETRY_DELAY_MS
        ? parseInt(process.env.GAS_RETRY_DELAY_MS, 10)
        : 1000,
    },
  };
});
