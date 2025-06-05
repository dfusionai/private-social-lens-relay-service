import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionRepository } from './infrastructure/persistence/transaction.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Transaction } from './domain/transaction';

@Injectable()
export class TransactionsService {
  constructor(
    // Dependencies here
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    // Do not remove comment below.
    // <creating-property />

    return this.transactionRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      transactionState: createTransactionDto.transactionState,

      errorMessage: createTransactionDto.errorMessage,

      metadata: createTransactionDto.metadata,

      parameters: createTransactionDto.parameters,

      method: createTransactionDto.method,

      chainId: createTransactionDto.chainId,

      transactionHash: createTransactionDto.transactionHash,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.transactionRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: Transaction['id']) {
    return this.transactionRepository.findById(id);
  }

  findByIds(ids: Transaction['id'][]) {
    return this.transactionRepository.findByIds(ids);
  }

  async update(
    id: Transaction['id'],

    updateTransactionDto: UpdateTransactionDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.transactionRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      transactionState: updateTransactionDto.transactionState,

      errorMessage: updateTransactionDto.errorMessage,

      metadata: updateTransactionDto.metadata,

      parameters: updateTransactionDto.parameters,

      method: updateTransactionDto.method,

      chainId: updateTransactionDto.chainId,

      transactionHash: updateTransactionDto.transactionHash,
    });
  }

  remove(id: Transaction['id']) {
    return this.transactionRepository.remove(id);
  }
}
