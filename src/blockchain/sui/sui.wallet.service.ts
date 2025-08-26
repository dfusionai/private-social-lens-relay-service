import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fromBase64 } from '@mysten/sui/utils';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { bech32 } from 'bech32';
import { SuiModuleConfig } from './config/sui-config.type';

@Injectable()
export class SuiWalletService {
  private readonly logger = new Logger(SuiWalletService.name);
  private keypair: Ed25519Keypair | null = null;
  private client: SuiClient;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<SuiModuleConfig>('sui', {
      infer: true,
    });
    if (!config) throw new Error('Sui configuration not found');

    // this.client = new SuiClient({ url: config.client.url });
    this.client = new SuiClient({ 
      url: getFullnodeUrl(config.client.network),
      network: config.client.network,
     });

    const pkEnvVar = config.wallet.privateKeyEnvVar;
    const pk = process.env[pkEnvVar];
    if (!pk) {
      this.logger.warn(`No Sui private key found in env var ${pkEnvVar}`);
      return;
    }

    // Try multiple formats robustly
    try {
      // 0) Prefer bech32 suiprivkey (schema-prefixed format)
      if (pk.startsWith('suiprivkey')) {
        const decoded = bech32.decode(pk);
        if (!decoded) throw new Error('Invalid bech32 private key');
        const words = bech32.fromWords(decoded.words);
        if (!words || words.length < 33) {
          throw new Error('Invalid suiprivkey length');
        }
        // First byte is the scheme flag; following 32 bytes are the secret
        const rawSecretKey = Buffer.from(words).slice(1, 33);
        this.keypair = Ed25519Keypair.fromSecretKey(rawSecretKey);
        return;
      }

      // Base64-encoded bytes
      const decoded = fromBase64(pk);
      let secret32: Uint8Array;
      if (decoded.length === 32) secret32 = decoded;
      else if (decoded.length === 33) secret32 = decoded.slice(1, 33);
      else if (decoded.length === 64) secret32 = decoded.slice(0, 32);
      else {
        this.logger.warn(
          `Unexpected base64 key length=${decoded.length}, attempting first 32 bytes`,
        );
        secret32 = decoded.slice(0, 32);
      }
      this.keypair = Ed25519Keypair.fromSecretKey(secret32);
    } catch {
      // Hex fallback
      const hex = pk.startsWith('0x') ? pk.slice(2) : pk;
      const bytes = Buffer.from(hex, 'hex');
      let secretHex: Uint8Array;
      switch (bytes.length) {
        case 32:
          secretHex = Uint8Array.from(bytes);
          break;
        case 33:
          secretHex = Uint8Array.from(bytes).slice(1, 33);
          break;
        case 64:
          secretHex = Uint8Array.from(bytes).slice(0, 32);
          break;
        default:
          secretHex = Uint8Array.from(bytes).slice(0, 32);
      }
      this.keypair = Ed25519Keypair.fromSecretKey(secretHex);
    }
  }

  getClient(): SuiClient {
    return this.client;
  }

  getAddress(): string | null {
    if (!this.keypair) return null;
    return this.keypair.getPublicKey().toSuiAddress();
  }

  getKeypair(): Ed25519Keypair | null {
    return this.keypair;
  }
}
