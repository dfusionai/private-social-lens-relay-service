import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { Request } from 'express';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private apiKeysService: ApiKeysService) {
    super();
  }

  async validate(request: Request): Promise<boolean> {
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    // Use a constant-time validation to prevent timing attacks
    const isValid = await this.apiKeysService.validateApiKey(apiKey);

    if (!isValid) {
      // Use a consistent error message to prevent information leakage
      throw new UnauthorizedException('Invalid authentication credentials');
    }

    return true;
  }

  private extractApiKey(request: Request): string | undefined {
    // Check both header and query parameter for the API key
    const headerKey = request.headers['x-api-key'];
    const queryKey = request.query['api_key'];

    if (Array.isArray(headerKey)) {
      return headerKey[0];
    }

    return (headerKey as string) || (queryKey as string);
  }
}
