/**
 * Interface for the Data Registry smart contract
 *
 * This contract handles file registration and permission management
 */

export interface Permission {
  account: string;
  key: string;
}

export interface IDataRegistryContract {
  /**
   * Adds a file to the registry with specified permissions
   *
   * @param url - URL of the file
   * @param ownerAddress - Address of the file owner
   * @param permissions - Array of permission objects with account and key
   * @returns Transaction hash and file ID
   */
  addFileWithPermissions(
    url: string,
    ownerAddress: string,
    permissions: Permission[],
  ): Promise<string>;
}
