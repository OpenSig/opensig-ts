// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//

import { SignatureEvent, SignatureReceipt } from '../types';


/**
 * Configuration for a blockchain network used by the provider.
 * * @property {number} chainId - Unique identifier for the blockchain network.
 * * @property {string} name - Human-readable name of the blockchain network. Not used in the provider.
 * * @property {Object} registryContract - Configuration for the signature registry contract.
 * * @property {string} registryContract.address - Address of the signature registry contract.
 * * @property {number} registryContract.creationBlock - Block number when the registry contract was deployed. Reduces the search space for events.
 * * @property {number} blockTime - Average time between blocks in seconds. Used by some providers to adjust timeouts.
 * * @property {number} networkLatency - Estimated network latency in seconds. Used by some providers to adjust query intervals.
 */
export interface BlockchainConfig {
  chainId: number;
  name?: string;
  registryContract: {
    address: string;
    creationBlock: number;
  };
  blockTime: number;
  networkLatency: number;
}

/**
 * Interface for blockchain providers that handle signature publishing and querying.
 */
export interface IBlockchainProvider {

  /// Configuration for the blockchain provider
  config: BlockchainConfig;

  /**
   * Queries the blockchain for signature events matching the provided hashes.
   * @param hashes Array of signature hashes to query.
   */
  querySignatures(hashes: string[]): Promise<SignatureEvent[]>;

  /**
   * Publishes a single signature to the blockchain and returns a signature receipt.
   * @param hash The signature to publish.
   * @param data The data to be published alongside the signatute. '0x' if none.
   */
  publishSignature(hash: string, data: string): Promise<SignatureReceipt>;
}


/**
 * Asserts that the provided object is a valid IBlockchainProvider.
 * @param obj The object to check.
 */
export function assertIBlockchainProvider(obj: any): asserts obj is IBlockchainProvider {
  if (!obj || typeof obj.querySignatures !== 'function' || typeof obj.publishSignature !== 'function') {
    throw new TypeError('provider is not a valid IBlockchainProvider');
  }
}