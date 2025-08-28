import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { fromHex } from '@mysten/sui/utils';
import { SuiWalletService } from './sui.wallet.service';
import { SuiModuleConfig } from './config/sui-config.type';

interface SendMoveCallParams {
  packageObjectId: string;
  module: string;
  function: string;
  typeArguments?: string[];
  arguments?: any[];
}

interface IFileMetadata {
  [key: string]: any;
}

@Injectable()
export class SuiTransactionService {
  private readonly logger = new Logger(SuiTransactionService.name);
  private client: SuiClient;
  private readonly gasBudget: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly walletService: SuiWalletService,
  ) {
    const config = this.configService.get<SuiModuleConfig>('sui', {
      infer: true,
    });
    if (!config) throw new Error('Sui configuration not found');
    this.client = this.walletService.getClient();
    this.gasBudget = config.wallet.gasBudget;
  }

  async sendMoveCall(params: SendMoveCallParams): Promise<string> {
    const keypair = this.walletService.getKeypair();
    if (!keypair) throw new Error('Sui keypair is not configured');

    const sender = keypair.getPublicKey().toSuiAddress();
    const tx = new Transaction();
    tx.setSender(sender);

    tx.moveCall({
      target: `${params.packageObjectId}::${params.module}::${params.function}`,
      typeArguments: params.typeArguments || [],
      arguments: (params.arguments || []).map((arg) =>
        typeof arg === 'object' && 'kind' in arg ? arg : tx.pure(arg),
      ),
    });

    tx.setGasBudget(this.gasBudget);

    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: { showEffects: true },
      requestType: 'WaitForLocalExecution',
    } as any);

    const digest =
      (result as any).digest || (result as any).effects?.transactionDigest;
    if (!digest) {
      this.logger.error(`Sui tx failed: ${JSON.stringify(result)}`);
      throw new Error('Failed to get transaction digest');
    }
    this.logger.log(`Sui tx sent: ${digest}`);
    return digest;
  }

  private async getSuiBalanceMist(address: string): Promise<bigint> {
    const balance = await this.client.getBalance({ owner: address });
    return BigInt(balance.totalBalance || 0);
  }

  async createAccessPolicy(
    packageObjectId: string,
    dlpWalletAddress: string,
  ): Promise<{ digest: string; policyObjectId: string | null }> {
    const keypair = this.walletService.getKeypair();
    if (!keypair) throw new Error('Sui keypair is not configured');

    const sender = keypair.getPublicKey().toSuiAddress();
    const tx = new Transaction();
    tx.setSender(sender);

    tx.moveCall({
      target: `${packageObjectId}::seal_manager::create_access_policy`,
      arguments: [tx.pure.vector('address', [dlpWalletAddress])],
    });

    tx.setGasBudget(this.gasBudget);

    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: { showEffects: true },
      requestType: 'WaitForLocalExecution',
    } as any);

    const digest =
      (result as any).digest || (result as any).effects?.transactionDigest;
    const created = (result as any).effects?.created || [];
    const policyObjectId = created[0]?.reference?.objectId || null;
    if (!digest) throw new Error('Failed to get transaction digest');
    return { digest, policyObjectId };
  }

  async saveEncryptedFileOnchain(
    fileId: string,
    policyObjId: string,
    metadata: IFileMetadata,
  ): Promise<string> {
    const keypair = this.walletService.getKeypair();
    if (!keypair) {
      this.logger.warn('Sui keypair is not configured');
      return '';
    }

    try {
      this.logger.log('Saving encrypted file onchain');
      const sender = keypair.getPublicKey().toSuiAddress();
      const tx = new Transaction();
      tx.setSender(sender);

      const metadataBytes = new Uint8Array(
        new TextEncoder().encode(JSON.stringify(metadata)),
      );

      tx.moveCall({
        target: `${this.getSuiPackageId()}::seal_manager::save_encrypted_file`,
        arguments: [
          tx.pure.vector('u8', fromHex(fileId)),
          tx.object(policyObjId),
          tx.pure.vector('u8', metadataBytes),
        ],
      });

      tx.setGasBudget(this.gasBudget);

      const result = await this.client.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        requestType: 'WaitForLocalExecution',
        options: {
          showEffects: true,
        },
      } as any);

      const onChainFileObjId =
        (result as any).effects?.created?.[0]?.reference?.objectId || '';

      if (!onChainFileObjId) {
        throw new Error(
          'Failed to save encrypted file onchain. Please try again.',
        );
      }

      this.logger.log(`Encrypted file saved onchain: ${onChainFileObjId}`);
      return onChainFileObjId;
    } catch (err) {
      this.logger.error('Failed to save encrypted file onchain', err);
      throw new Error(
        'Failed to save encrypted file onchain. Please try again.',
      );
    }
  }

  private getSuiPackageId(): string {
    const config = this.configService.get<SuiModuleConfig>('sui', {
      infer: true,
    });
    if (!config?.packageId) {
      throw new Error('Sui package ID not configured');
    }
    return config.packageId;
  }
}
