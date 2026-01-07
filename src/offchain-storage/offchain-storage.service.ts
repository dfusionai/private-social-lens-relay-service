import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OffchainStorageConfig } from './config/offchain-storage-config.type';

interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

@Injectable()
export class OffchainStorageService implements OnModuleInit {
  private readonly logger = new Logger(OffchainStorageService.name);
  private pinataJwt: string;
  private pinataApiUrl: string;
  private pinataGatewayUrl: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const config = this.getStorageConfig();

    this.pinataJwt = config.pinataJwt;
    this.pinataApiUrl = config.pinataApiUrl;
    this.pinataGatewayUrl = config.pinataGatewayUrl;

    if (!this.pinataJwt) {
      this.logger.warn(
        'PINATA_JWT not configured - offchain storage uploads will fail',
      );
      return;
    }

    this.logger.log(
      `Offchain storage service initialized - API: ${this.pinataApiUrl}, Gateway: ${this.pinataGatewayUrl}`,
    );
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
   * Upload a file to offchain storage via HTTP REST API.
   * Uses direct HTTP request (like the refiner) for easy migration to other services.
   *
   * @param file - The file to upload (from Multer)
   * @returns Object containing url, ipfsHash, and size
   */
  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; ipfsHash: string; size: number }> {
    if (!file || !file.buffer) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    if (!this.pinataJwt) {
      this.logger.error('Pinata JWT not configured');
      throw new HttpException(
        'Offchain storage service not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // Create FormData with Blob (works with native fetch in Node.js 18+)
      // Convert Buffer to Uint8Array for TypeScript compatibility
      const blob = new Blob([new Uint8Array(file.buffer)], {
        type: file.mimetype || 'application/octet-stream',
      });
      const formData = new FormData();
      formData.append('file', blob, file.originalname || 'encrypted-data');

      // Make HTTP request to storage API
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
          `Storage API error: ${response.status} - ${errorText}`,
        );
        throw new Error(`Storage API returned ${response.status}`);
      }

      const result: PinataUploadResponse = await response.json();

      // Construct gateway URL (same pattern as refiner and frontend)
      const fileUrl = `${this.pinataGatewayUrl}/${result.IpfsHash}`;

      this.logger.log(
        `File uploaded to offchain storage: hash=${result.IpfsHash}, size=${file.size}`,
      );

      return {
        url: fileUrl,
        ipfsHash: result.IpfsHash,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(
        'Offchain storage upload failed:',
        error?.message || error,
      );
      throw new HttpException(
        'Failed to upload encrypted data to off-chain storage. Please try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
