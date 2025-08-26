export interface SuiModuleConfig {
  client: {
    url: string;
    network: 'mainnet' | 'testnet' | 'devnet' | 'localnet';
  };
  wallet: {
    privateKeyEnvVar: string;
    gasBudget: number;
  };
  packageId?: string;
  walrus_relay_url?: string;
}
