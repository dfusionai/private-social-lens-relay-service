export type StorageProvider = 'pinata' | 'azure';

export type OffchainStorageConfig = {
  // Which storage provider to use: 'pinata' or 'azure'
  provider: StorageProvider;

  // Azure/New offchain storage service config
  storageServiceUrl: string;
  storageServiceApiKey: string;

  // Pinata config (legacy, for rollback)
  pinataJwt: string;
  pinataApiUrl: string;
  pinataGatewayUrl: string;
};
