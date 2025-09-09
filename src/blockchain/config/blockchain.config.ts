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
      provider: process.env.BLOCKCHAIN_PROVIDER || '',
      network: process.env.BLOCKCHAIN_NETWORK || 'testnet',
      chainId: Number(process.env.BLOCKCHAIN_CHAIN_ID) || 11155111,
    },
    wallet: {
      privateKeyEnvVar:
        process.env.WALLET_PRIVATE_KEY_ENV_VAR || 'WALLET_PRIVATE_KEY',
      gasLimit: Number(process.env.WALLET_GAS_LIMIT) || 1000000,
      maxFeePerGas: process.env.WALLET_MAX_FEE_PER_GAS || '4000000',
      maxPriorityFeePerGas:
        process.env.WALLET_MAX_PRIORITY_FEE_PER_GAS || '4000000',
      pool: {
        enabled: process.env.WALLET_POOL_ENABLED === 'true',
        size: Number(process.env.WALLET_POOL_SIZE) || 5,
        maxWaitMs: Number(process.env.WALLET_POOL_MAX_WAIT_MS) || 5000,
        maxAcquisitionTimeMs:
          Number(process.env.WALLET_POOL_MAX_ACQUISITION_TIME_MS) || 60000,
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
      maxGasPrice: process.env.GAS_MAX_GAS_PRICE || '100000000000',
      gasLimitMultiplier: Number(process.env.GAS_LIMIT_MULTIPLIER) || 1.2,
      retryCount: Number(process.env.GAS_RETRY_COUNT) || 3,
      retryDelayMs: Number(process.env.GAS_RETRY_DELAY_MS) || 1000,
    },
    monitoring: {
      wallet: {
        defaultThreshold:
          process.env.MONITORING_WALLET_DEFAULT_THRESHOLD || '0.1',
        operationsEmail:
          process.env.MONITORING_OPERATIONS_EMAIL || 'operations@example.com',
      },
      transaction: {
        highGasThreshold:
          Number(process.env.MONITORING_HIGH_GAS_THRESHOLD) || 500000000000,
        failureCountThreshold:
          Number(process.env.MONITORING_FAILURE_COUNT_THRESHOLD) || 3,
        checkPeriodHours:
          Number(process.env.MONITORING_CHECK_PERIOD_HOURS) || 24,
      },
    },
  };
});
