// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//

import { SignatureEvent, SignatureReceipt } from '../types';


export interface BlockchainConfig {
  chainId: number;
  name: string;
  registryContract: {
    address: string;
    creationBlock: number;
  };
  blockTime: number;
  networkLatency: number;
}

export interface IBlockchainProvider {
  config: BlockchainConfig;
  querySignatures(hashes: string[]): Promise<SignatureEvent[]>;
  publishSignature(hash: string, data: string): Promise<SignatureReceipt>;
}

export function assertIBlockchainProvider(obj: any): asserts obj is IBlockchainProvider {
  if (!obj || typeof obj.querySignatures !== 'function' || typeof obj.publishSignature !== 'function') {
    throw new TypeError('provider is not a valid IBlockchainProvider');
  }
}