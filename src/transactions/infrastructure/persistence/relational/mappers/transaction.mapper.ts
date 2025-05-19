import { Transaction } from '../../../../domain/transaction';

import { TransactionEntity } from '../entities/transaction.entity';

export class TransactionMapper {
  static toDomain(raw: TransactionEntity): Transaction {
    const domainEntity = new Transaction();
    domainEntity.transactionState = raw.transactionState;

    domainEntity.errorMessage = raw.errorMessage;

    domainEntity.metadata = raw.metadata;

    domainEntity.parameters = raw.parameters;

    domainEntity.method = raw.method;

    domainEntity.chainId = raw.chainId;

    domainEntity.transactionHash = raw.transactionHash;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: Transaction): TransactionEntity {
    const persistenceEntity = new TransactionEntity();
    persistenceEntity.transactionState = domainEntity.transactionState;

    persistenceEntity.errorMessage = domainEntity.errorMessage;

    persistenceEntity.metadata = domainEntity.metadata;

    persistenceEntity.parameters = domainEntity.parameters;

    persistenceEntity.method = domainEntity.method;

    persistenceEntity.chainId = domainEntity.chainId;

    persistenceEntity.transactionHash = domainEntity.transactionHash;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
