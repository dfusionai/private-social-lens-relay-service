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
      this.logger.error(
        `[uploadFile] No file or buffer provided - file exists: ${!!file}, buffer exists: ${!!file?.buffer}`,
      );
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
    }

    if (!this.pinataJwt) {
      this.logger.error(
        `[uploadFile] Pinata JWT not configured - apiUrl: ${this.pinataApiUrl}, gatewayUrl: ${this.pinataGatewayUrl}`,
      );
      throw new HttpException(
        'Offchain storage service not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const blobType = file.mimetype || 'application/octet-stream';
    const blobFilename = file.originalname || 'encrypted-data';

    try {
      const blob = new Blob([new Uint8Array(file.buffer)], {
        type: blobType,
      });
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
          `[uploadFile] Pinata API error - ` +
            `status: ${response.status}, statusText: ${response.statusText}, ` +
            `apiUrl: ${this.pinataApiUrl}, ` +
            `file: { name: ${blobFilename}, size: ${file.size}, type: ${blobType} }, ` +
            `response: ${errorText}`,
        );
        throw new Error(
          `Storage API returned ${response.status}: ${errorText}`,
        );
      }

      const responseText = await response.text();
      let result: PinataUploadResponse;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        this.logger.error(
          `[uploadFile] Failed to parse Pinata JSON response - ` +
            `parseError: ${parseError?.message}, ` +
            `file: { name: ${blobFilename}, size: ${file.size}, type: ${blobType} }, ` +
            `rawResponse: ${responseText.substring(0, 500)}`,
        );
        throw new Error(`Invalid JSON response from Pinata: ${responseText}`);
      }

      const fileUrl = `${this.pinataGatewayUrl}/${result.IpfsHash}`;

      return {
        url: fileUrl,
        ipfsHash: result.IpfsHash,
        size: file.size,
      };
    } catch (error) {
      // Only log if not already logged above (check if it's our thrown error)
      const isAlreadyLogged =
        error?.message?.startsWith('Storage API returned') ||
        error?.message?.startsWith('Invalid JSON response');
      if (!isAlreadyLogged) {
        this.logger.error(
          `[uploadFile] Unexpected error - ` +
            `error: ${error?.message || error}, ` +
            `apiUrl: ${this.pinataApiUrl}, ` +
            `file: { name: ${blobFilename}, size: ${file.size}, type: ${blobType} }, ` +
            `stack: ${error?.stack || 'no stack'}`,
        );
      }
      throw new HttpException(
        'Failed to upload encrypted data to off-chain storage. Please try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
