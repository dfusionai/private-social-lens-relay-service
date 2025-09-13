import { SuiClient } from '@mysten/sui/client';
import {
  RetryableWalrusClientError,
  WalrusClient,
  WalrusFile,
} from '@mysten/walrus';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalrusUploadRequestDto } from '../../relay/walrus/dto/upload.dto';
import { SuiModuleConfig } from './config/sui-config.type';
import { SuiWalletService } from './sui.wallet.service';

@Injectable()
export class WalrusService {
  private readonly logger = new Logger(WalrusService.name);
  private suiClient: SuiClient;
  private walrusClient: WalrusClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly suiWalletService: SuiWalletService,
  ) {
    const config = this.configService.get<SuiModuleConfig>('sui', {
      infer: true,
    });

    if (!config) throw new Error('Sui configuration not found');

    this.suiClient = this.suiWalletService.getClient();
    // https://docs.wal.app/operator-guide/upload-relay.html
    // https://sdk.mystenlabs.com/walrus#writing-blobs-with-an-upload-relay
    this.walrusClient = new WalrusClient({
      network: config.client.network,
      suiClient: this.suiClient,
      uploadRelay: {
        host: config.walrus_relay_url,
        sendTip: {
          max: 6_000_000, // in MIST (1 SUI equals 1 billion MIST)
        },
      },
    });
  }

  // async uploadFileViaRelayWriteBlob(file, uploadDto: WalrusUploadRequestDto) {
  //   try {
  //     const signer = this.suiWalletService.getKeypair();
  //     if (!signer) {
  //       throw new Error('No Sui signer/keypair is initialized');
  //     }

  //     this.logger.log('Uploading file to Walrus via relay...');
  //     const { blobId, blobObject } = await this.walrusClient.writeBlob({
  //       blob: file,
  //       deletable: true,
  //       epochs: Number(uploadDto.epochs),
  //       signer,
  //     });

  //     return { blobId, blobObject };
  //   } catch (err) {
  //     this.logger.error('Failed to upload file to Walrus via relay.', err);
  //     throw new Error(
  //       'Failed to upload file to Walrus via relay. Please try again.',
  //     );
  //   }
  // }

  // ref: https://github.com/MystenLabs/walrus-sdk-example-app
  async uploadFileViaRelayWalrusWriteFilesFlowApi(
    file: Express.Multer.File,
    uploadDto: WalrusUploadRequestDto,
  ) {
    try {
      this.logger.log('Starting file upload process');
      const signer = this.suiWalletService.getKeypair();
      if (!signer) {
        throw new Error('No Sui signer/keypair is initialized');
      }

      const senderAddress = signer.toSuiAddress();

      // Step 1: Encode file and create WriteFilesFlow
      this.logger.log('Encoding file');
      const walrusFile = WalrusFile.from({
        contents: new Uint8Array(file.buffer),
        identifier: file.filename,
        tags: { contentType: file.mimetype },
      });
      const flow = this.walrusClient.writeFilesFlow({ files: [walrusFile] });
      await flow.encode();
      this.logger.log('File encoded successfully');

      // Step 2: Register blob and send relay tip on-chain
      this.logger.log('Registering blob');
      const registerTx = flow.register({
        epochs: Number(uploadDto.epochs),
        deletable: true,
        owner: senderAddress,
      });

      // Set the sender for the transaction
      registerTx.setSender(senderAddress);

      // Add a small delay to avoid potential race conditions
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { digest: registerDigest } = await signer.signAndExecuteTransaction(
        {
          transaction: registerTx,
          client: this.suiClient,
        },
      );
      this.logger.log(`Blob registered with digest: ${registerDigest}`);

      // Wait for the transaction to be confirmed before proceeding
      await this.suiClient.waitForTransaction({
        digest: registerDigest,
        options: { showEffects: true },
      });

      // Additional delay to ensure state is fully synchronized
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 3: Upload file data to the relay
      this.logger.log('Uploading file data to relay');
      await flow.upload({ digest: registerDigest });
      this.logger.log('File data uploaded successfully');

      // Step 4: Certify blob on-chain
      this.logger.log('Certifying blob');
      const certifyTx = flow.certify();

      // Set the sender for the certification transaction
      certifyTx.setSender(senderAddress);

      // Add a small delay before certification
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { digest: certifyDigest } = await signer.signAndExecuteTransaction({
        transaction: certifyTx,
        client: this.suiClient,
      });
      this.logger.log(`Blob certified with digest: ${certifyDigest}`);

      // Wait for the certification transaction to be confirmed
      await this.suiClient.waitForTransaction({
        digest: certifyDigest,
        options: { showEffects: true },
      });

      // Get uploaded file info
      this.logger.log('Retrieving file information');
      const results = await flow.listFiles();
      this.logger.log('File upload completed successfully', results);

      return results;
    } catch (error) {
      if (error instanceof RetryableWalrusClientError) {
        this.logger.error(
          'Failed to upload file to Walrus via relay. Resetting walrus client.',
          error,
        );
        this.walrusClient.reset();
      }
      this.logger.error('Failed to upload file to Walrus via relay.', error);
      throw new Error(
        `Failed to upload file to Walrus via relay: ${error.message}`,
      );
    }
  }

}
