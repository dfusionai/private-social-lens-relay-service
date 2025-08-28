import { registerAs } from '@nestjs/config';
import validateConfig from '../../../utils/validate-config';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { SuiModuleConfig } from './sui-config.type';

enum SuiNetwork {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
  Devnet = 'devnet',
  Localnet = 'localnet',
}

class SuiEnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  SUI_PROVIDER_URL: string;

  @IsEnum(SuiNetwork)
  @IsOptional()
  SUI_NETWORK: SuiNetwork;

  @IsString()
  @IsOptional()
  SUI_WALLET_PRIVATE_KEY_ENV_VAR: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  SUI_GAS_BUDGET: number;

  @IsString()
  @IsOptional()
  SUI_PACKAGE_ID: string;

  @IsString()
  @IsOptional()
  SUI_WALRUS_RELAY_URL: string;
}

export default registerAs<SuiModuleConfig>('sui', () => {
  validateConfig(process.env, SuiEnvironmentVariablesValidator);

  return {
    client: {
      url:
        process.env.SUI_PROVIDER_URL || 'https://fullnode.testnet.sui.io:443',
      network: (process.env.SUI_NETWORK as SuiNetwork) || 'testnet',
    },
    wallet: {
      privateKeyEnvVar:
        process.env.SUI_WALLET_PRIVATE_KEY_ENV_VAR || 'SUI_WALLET_PRIVATE_KEY',
      gasBudget: Number(process.env.SUI_GAS_BUDGET) || 1_000_000_000,
    },
    packageId: process.env.SUI_PACKAGE_ID,
    walrus_relay_url: process.env.SUI_WALRUS_RELAY_URL,
  };
});
