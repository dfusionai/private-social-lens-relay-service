/**
 * Interface for the TEE Pool smart contract
 *
 * This contract handles Trusted Execution Environment (TEE) operations
 * and contribution proof requests
 */
export interface ITeePoolContract {
  /**
   * Requests a contribution proof from the TEE Pool
   *
   * @param fileId - ID of the file in the Data Registry
   * @param teeFee - Tee fee in wei
   * @returns Transaction hash
   */
  requestContributionProof(fileId: number, teeFee: string): Promise<string>;
}
