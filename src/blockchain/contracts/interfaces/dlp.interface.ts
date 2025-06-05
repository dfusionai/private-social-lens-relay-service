/**
 * Interface for the DLP (Data Labeling Protocol) smart contract
 *
 * This contract handles reward distribution for data labeling contributions
 */
export interface IDlpContract {
  /**
   * Requests a reward for a data labeling contribution
   *
   * @param fileId - ID of the file in the Data Registry
   * @param proofIndex - Index of the proof in the contract
   * @returns Transaction hash
   */
  requestReward(fileId: number, proofIndex: number): Promise<string>;
}
