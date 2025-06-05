import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { ApiKey } from '../../domain/api-key';

export abstract class ApiKeyRepository {
  abstract create(
    data: Omit<ApiKey, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ApiKey>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<ApiKey[]>;

  abstract findById(id: ApiKey['id']): Promise<NullableType<ApiKey>>;

  abstract findByIds(ids: ApiKey['id'][]): Promise<ApiKey[]>;

  abstract update(
    id: ApiKey['id'],
    payload: DeepPartial<ApiKey>,
  ): Promise<ApiKey | null>;

  abstract remove(id: ApiKey['id']): Promise<void>;

  abstract findByKeyHash(
    keyHash: string,
    isActive?: boolean,
  ): Promise<NullableType<ApiKey>>;
}
