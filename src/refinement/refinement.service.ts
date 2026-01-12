import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RefinementConfig } from './config/refinement-config.type';

interface RefinementServiceResponse {
  add_refinement_tx_hash: string;
}

@Injectable()
export class RefinementService implements OnModuleInit {
  private readonly logger = new Logger(RefinementService.name);
  private serviceUrl: string;
  private refinerId: number;
  private relayUploadUrl: string;
  private pinataJwt: string | undefined;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const config = this.getRefinementConfig();

    this.serviceUrl = config.serviceUrl;
    this.refinerId = config.refinerId;
    this.relayUploadUrl = config.relayUploadUrl;
    this.pinataJwt = config.pinataJwt;

    if (!this.serviceUrl) {
      this.logger.warn(
        'REFINEMENT_SERVICE_URL not configured - refinement calls will fail',
      );
    }

    if (!this.relayUploadUrl) {
      this.logger.warn(
        'RELAY_UPLOAD_URL not configured - refinement TEE uploads will fail',
      );
    }

    this.logger.log(
      `Refinement service initialized - URL: ${this.serviceUrl}, Refiner ID: ${this.refinerId}, ` +
        `Relay Upload URL: ${this.relayUploadUrl}`,
    );
  }

  private getRefinementConfig(): RefinementConfig {
    const config = this.configService.get<RefinementConfig>('refinement', {
      infer: true,
    });
    if (!config) {
      throw new Error('Refinement configuration not found');
    }
    return config;
  }

  /**
   * Call the external refinement service to process data.
   * The backend provides the relay upload URL for the TEE to upload refined data.
   *
   * @param fileId - ID of the file in Data Registry
   * @param encryptionKey - Original encryption key
   * @returns Transaction hash from addRefinementWithPermission
   */
  async refineData(
    fileId: number,
    encryptionKey: string,
  ): Promise<RefinementServiceResponse> {
    if (!this.serviceUrl) {
      this.logger.error('Refinement service URL not configured');
      throw new HttpException(
        'Refinement service not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!this.relayUploadUrl) {
      this.logger.error('Relay upload URL not configured for refinement');
      throw new HttpException(
        'Refinement service not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Build env_vars for TEE
    // Include relay URL for new storage system
    // Keep PINATA_API_JWT for backward compatibility until template is updated
    const envVars: Record<string, string> = {
      RELAY_UPLOAD_URL: this.relayUploadUrl,
    };

    // Include legacy Pinata JWT if configured (for backward compatibility)
    if (this.pinataJwt) {
      envVars.PINATA_API_JWT = this.pinataJwt;
    }

    const requestBody = {
      file_id: fileId,
      encryption_key: encryptionKey,
      refiner_id: this.refinerId,
      env_vars: envVars,
    };

    try {
      this.logger.log(
        `Calling refinement service for file ID: ${fileId}, refiner ID: ${this.refinerId}`,
      );

      const response = await fetch(this.serviceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `Refinement service error: ${response.status} - ${errorText}`,
        );
        throw new Error(`Refinement service returned ${response.status}`);
      }

      const result: RefinementServiceResponse = await response.json();

      this.logger.log(
        `Refinement completed for file ID: ${fileId}, tx: ${result.add_refinement_tx_hash}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        'Refinement service call failed:',
        (error as Error)?.message || error,
      );
      throw new HttpException(
        'Failed to process data refinement. Please try again.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
