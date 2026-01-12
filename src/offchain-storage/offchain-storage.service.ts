import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OffchainStorageConfig,
  StorageProvider,
} from './config/offchain-storage-config.type';

/**
 * Response from social-truth-offchain-storage service (Azure)
 */
interface AzureUploadResponse {
  hash: string;
  url: string;
  size: number;
}

/**
 * Response from Pinata IPFS
 */
interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

@Injectable()
export class OffchainStorageService implements OnModuleInit {
  private readonly logger = new Logger(OffchainStorageService.name);

  // Provider selection
  private provider: StorageProvider;

  // Azure/new storage service config
  private storageServiceUrl: string;
  private storageServiceApiKey: string;

  // Pinata config
  private pinataJwt: string;
  private pinataApiUrl: string;
  private pinataGatewayUrl: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const config = this.getStorageConfig();

    this.provider = config.provider;

    // Azure config
    this.storageServiceUrl = config.storageServiceUrl;
    this.storageServiceApiKey = config.storageServiceApiKey;

    // Pinata config
    this.pinataJwt = config.pinataJwt;
    this.pinataApiUrl = config.pinataApiUrl;
    this.pinataGatewayUrl = config.pinataGatewayUrl;

    // Validate configuration based on provider
    if (this.provider === 'azure') {
      if (!this.storageServiceUrl || !this.storageServiceApiKey) {
        this.logger.warn(
          'Azure storage provider selected but OFFCHAIN_STORAGE_URL or OFFCHAIN_STORAGE_API_KEY not configured - uploads will fail',
        );
      } else {
        this.logger.log(
          `Offchain storage initialized with AZURE provider - URL: ${this.storageServiceUrl}`,
        );
      }
    } else if (this.provider === 'pinata') {
      if (!this.pinataJwt) {
        this.logger.warn(
          'Pinata provider selected but PINATA_JWT not configured - uploads will fail',
        );
      } else {
        this.logger.log(
          `Offchain storage initialized with PINATA provider - API: ${this.pinataApiUrl}, Gateway: ${this.pinataGatewayUrl}`,
        );
      }
    }
  }

  private getStorageConfig(): OffchainStorageConfig {
    const config = this.configService.get<OffchainStorageConfig>(
      'offchainStorage',
      { infer: true },
    );
    if (!config) {
      throw new Error('Offchain storage configuration not found');
    }
    return config;
  }

  /**
   * Upload a file to offchain storage.
   * Routes to either Azure storage service or Pinata based on OFFCHAIN_STORAGE_PROVIDER env var.
   *
   * @param file - The file to upload (from Multer)
   * @returns Object containing url, ipfsHash (content hash), and size
   */
  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; ipfsHash: string; size: number }> {
    if (!file || !file.buffer) {
      this.logger.error(
        `[uploadFile] No file or buffer provided - file exists: ${!!file}, buffer exists: ${!!file?.buffer}`,
      );
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    if (this.provider === 'azure') {
      return this.uploadToAzure(file);
    } else {
      return this.uploadToPinata(file);
    }
  }

  /**
   * Upload to Azure/new offchain storage service
   */
  private async uploadToAzure(
    file: Express.Multer.File,
  ): Promise<{ url: string; ipfsHash: string; size: number }> {
    if (!this.storageServiceUrl || !this.storageServiceApiKey) {
      this.logger.error(
        `[uploadToAzure] Storage service not configured - URL: ${this.storageServiceUrl}`,
      );
      throw new HttpException(
        'Offchain storage service not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const blobType = file.mimetype || 'application/octet-stream';
    const blobFilename = file.originalname || 'encrypted-data';

    try {
      const blob = new Blob([new Uint8Array(file.buffer)], { type: blobType });
      const formData = new FormData();
      formData.append('file', blob, blobFilename);

      const uploadUrl = `${this.storageServiceUrl}/blobs`;
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'X-API-Key': this.storageServiceApiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `[uploadToAzure] Storage service error - ` +
            `status: ${response.status}, statusText: ${response.statusText}, ` +
            `url: ${uploadUrl}, ` +
            `file: { name: ${blobFilename}, size: ${file.size}, type: ${blobType} }, ` +
            `response: ${errorText}`,
        );
        throw new Error(
          `Storage service returned ${response.status}: ${errorText}`,
        );
      }

      const responseText = await response.text();
      let result: AzureUploadResponse;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        this.logger.error(
          `[uploadToAzure] Failed to parse JSON response - ` +
            `parseError: ${(parseError as Error)?.message}, ` +
            `rawResponse: ${responseText.substring(0, 500)}`,
        );
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      this.logger.log(
        `[uploadToAzure] File uploaded successfully - ` +
          `hash: ${result.hash.substring(0, 16)}..., size: ${result.size}`,
      );

      return {
        url: result.url,
        ipfsHash: result.hash, // Map hash to ipfsHash for backward compatibility
        size: result.size,
      };
    } catch (error) {
      const errorMessage = (error as Error)?.message || String(error);
      const isAlreadyLogged =
        errorMessage.startsWith('Storage service returned') ||
        errorMessage.startsWith('Invalid JSON response');
      if (!isAlreadyLogged) {
        this.logger.error(
          `[uploadToAzure] Unexpected error - error: ${errorMessage}`,
        );
      }
      throw new HttpException(
        'Failed to upload encrypted data to off-chain storage. Please try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Upload to Pinata IPFS (legacy/rollback)
   */
  private async uploadToPinata(
    file: Express.Multer.File,
  ): Promise<{ url: string; ipfsHash: string; size: number }> {
    if (!this.pinataJwt) {
      this.logger.error(
        `[uploadToPinata] Pinata JWT not configured - apiUrl: ${this.pinataApiUrl}`,
      );
      throw new HttpException(
        'Offchain storage service not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const blobType = file.mimetype || 'application/octet-stream';
    const blobFilename = file.originalname || 'encrypted-data';

    try {
      const blob = new Blob([new Uint8Array(file.buffer)], { type: blobType });
      const formData = new FormData();
      formData.append('file', blob, blobFilename);

      const response = await fetch(this.pinataApiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.pinataJwt}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `[uploadToPinata] Pinata API error - ` +
            `status: ${response.status}, statusText: ${response.statusText}, ` +
            `apiUrl: ${this.pinataApiUrl}, ` +
            `file: { name: ${blobFilename}, size: ${file.size}, type: ${blobType} }, ` +
            `response: ${errorText}`,
        );
        throw new Error(
          `Pinata API returned ${response.status}: ${errorText}`,
        );
      }

      const responseText = await response.text();
      let result: PinataUploadResponse;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        this.logger.error(
          `[uploadToPinata] Failed to parse JSON response - ` +
            `parseError: ${(parseError as Error)?.message}, ` +
            `rawResponse: ${responseText.substring(0, 500)}`,
        );
        throw new Error(`Invalid JSON response from Pinata: ${responseText}`);
      }

      const fileUrl = `${this.pinataGatewayUrl}/${result.IpfsHash}`;

      this.logger.log(
        `[uploadToPinata] File uploaded successfully - ` +
          `hash: ${result.IpfsHash.substring(0, 16)}..., size: ${file.size}`,
      );

      return {
        url: fileUrl,
        ipfsHash: result.IpfsHash,
        size: file.size,
      };
    } catch (error) {
      const errorMessage = (error as Error)?.message || String(error);
      const isAlreadyLogged =
        errorMessage.startsWith('Pinata API returned') ||
        errorMessage.startsWith('Invalid JSON response');
      if (!isAlreadyLogged) {
        this.logger.error(
          `[uploadToPinata] Unexpected error - error: ${errorMessage}`,
        );
      }
      throw new HttpException(
        'Failed to upload encrypted data to off-chain storage. Please try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
