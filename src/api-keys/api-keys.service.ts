import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { ApiKeyRepository } from './infrastructure/persistence/api-key.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { ApiKey } from './domain/api-key';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class ApiKeysService {
  private readonly secretKey: string;

  constructor(
    // Dependencies here
    private readonly apiKeyRepository: ApiKeyRepository,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    // Get the secret key from config (required)
    this.secretKey = this.configService.getOrThrow('apiKey.secret', {
      infer: true,
    });
  }

  generateApiKey(): { fullKey: string; prefix: string; hash: string } {
    // Format: prefix_randomPart (e.g., abc12345_f7d8a9b3c...)
    const randomPart = crypto
      .randomBytes(32)
      .toString('base64')
      .replace(/[+/=]/g, '')
      .substring(0, 40);

    const prefix = crypto.randomBytes(4).toString('hex');

    const fullKey = `${prefix}_${randomPart}`;

    // Use HMAC-SHA256 for more secure hashing
    const hash = crypto
      .createHmac('sha256', this.secretKey)
      .update(fullKey)
      .digest('hex');

    return { fullKey, prefix, hash };
  }

  async create(createApiKeyDto: CreateApiKeyDto) {
    const { fullKey, prefix, hash } = this.generateApiKey();

    // Do not remove comment below.
    // <creating-property />

    const newApiKey = await this.apiKeyRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      isActive: createApiKeyDto.isActive ?? true,

      expiresAt: createApiKeyDto.expiresAt,

      description: createApiKeyDto.description,

      keyHint: prefix,

      keyHash: hash,

      name: createApiKeyDto.name,
    });

    return {
      ...newApiKey,
      apiKey: fullKey,
    };
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.apiKeyRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: ApiKey['id']) {
    return this.apiKeyRepository.findById(id);
  }

  findByIds(ids: ApiKey['id'][]) {
    return this.apiKeyRepository.findByIds(ids);
  }

  async update(
    id: ApiKey['id'],

    updateApiKeyDto: UpdateApiKeyDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.apiKeyRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      isActive: updateApiKeyDto.isActive,

      expiresAt: updateApiKeyDto.expiresAt,

      description: updateApiKeyDto.description,

      name: updateApiKeyDto.name,
    });
  }

  remove(id: ApiKey['id']) {
    return this.apiKeyRepository.remove(id);
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey) {
      return false;
    }

    const parts = apiKey.split('_');
    if (parts.length !== 2) {
      return false;
    }

    // Use HMAC-SHA256 for validation, same as in generation
    const hash = crypto
      .createHmac('sha256', this.secretKey)
      .update(apiKey)
      .digest('hex');

    // Query the database directly with the prefix and hash
    const apiKeyEntity = await this.apiKeyRepository.findByKeyHash(
      hash,
      true, // Only active keys
    );

    if (!apiKeyEntity) {
      return false;
    }

    // Check if the API key has expired
    if (apiKeyEntity.expiresAt && new Date() > apiKeyEntity.expiresAt) {
      return false;
    }

    return true;
  }
}
