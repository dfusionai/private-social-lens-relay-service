/**
 * Interface for standardized transaction responses
 */
export interface TransactionResponse {
  /**
   * Transaction hash from the blockchain
   */
  transactionHash: string | null;

  /**
   * Status of the transaction
   */
  status: 'success' | 'pending' | 'failed';

  /**
   * Timestamp of when the transaction was processed
   */
  timestamp: string;

  /**
   * Additional metadata about the transaction
   */
  metadata?: Record<string, any>;
}
