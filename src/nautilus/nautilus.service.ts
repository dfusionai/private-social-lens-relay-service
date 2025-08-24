import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { EncryptRequest, EncryptResponse } from './interfaces/nautilus.interface';
import { NautilusConfig } from './config/nautilus-config.type';

@Injectable()
export class NautilusService {
  private readonly logger = new Logger(NautilusService.name);
  private readonly config: NautilusConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.config = this.configService.get<NautilusConfig>('nautilus', {
      infer: true,
    })!;
  }

  /**
   * Encrypts data using the Nautilus enclave's AES-256-GCM encryption
   * @param data Stringified JSON data to encrypt
   * @returns Encryption response with nonce, ciphertext, and tag
   */
  async encryptData(data: string): Promise<EncryptResponse> {
    try {
      this.logger.debug(`Encrypting data (${data.length} characters)`);
      
      const request: EncryptRequest = { data };
      
      const response = await firstValueFrom(
        this.httpService.post<EncryptResponse>(
          `${this.config.url}/encrypt`,
          request,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      
      this.logger.debug(`Successfully encrypted data`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to encrypt data:', error);
      
      // Extract detailed error information
      const errorData = error?.response?.data || {};
      const errorMessage = errorData?.message || error.message;
      
      throw new Error(`Encryption failed: ${errorMessage}`);
    }
  }
}