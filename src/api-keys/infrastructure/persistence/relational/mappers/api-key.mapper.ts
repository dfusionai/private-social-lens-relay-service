import { ApiKey } from '../../../../domain/api-key';

import { ApiKeyEntity } from '../entities/api-key.entity';

export class ApiKeyMapper {
  static toDomain(raw: ApiKeyEntity): ApiKey {
    const domainEntity = new ApiKey();
    domainEntity.isActive = raw.isActive;

    domainEntity.expiresAt = raw.expiresAt;

    domainEntity.description = raw.description;

    domainEntity.keyHint = raw.keyHint;

    domainEntity.keyHash = raw.keyHash;

    domainEntity.name = raw.name;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: ApiKey): ApiKeyEntity {
    const persistenceEntity = new ApiKeyEntity();
    persistenceEntity.isActive = domainEntity.isActive;

    persistenceEntity.expiresAt = domainEntity.expiresAt;

    persistenceEntity.description = domainEntity.description;

    persistenceEntity.keyHint = domainEntity.keyHint;

    persistenceEntity.keyHash = domainEntity.keyHash;

    persistenceEntity.name = domainEntity.name;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
