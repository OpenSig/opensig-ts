// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//

import { ethers, Log } from 'ethers';
import { SignatureEvent, SignatureReceipt } from '../types';
import { REGISTRY_ABI } from '../constants';
import { IBlockchainProvider } from './IBlockchainProvider';

const SignatureEventDecoder = new ethers.Interface(REGISTRY_ABI);

/**
 * Configuration for a blockchain network used by the provider.
 * * @property {string} address - Address of the signature registry contract.
 * * @property {number} creationBlock - Block number when the registry contract was deployed. Reduces the search space for events.
 */
export interface RegistryContract { 
  address: string; 
  creationBlock: number; 
}

/**
 * Abstract base class for EVM blockchain providers. Handles signature querying and decoding
 * using the ethers library.
 */
export abstract class AbstractEVMProvider implements IBlockchainProvider {

  public chainId: number;
  public registryContract: RegistryContract;
  public rpcProvider: ethers.AbstractProvider;

  constructor( chainId: number, registryContract: RegistryContract, rpcProvider: ethers.AbstractProvider ) {
    this.chainId = chainId;
    this.registryContract = registryContract;
    this.rpcProvider = rpcProvider;
  }

  async querySignatures(hashes: string[]): Promise<SignatureEvent[]> {
    const contract = new ethers.Contract(this.registryContract.address, REGISTRY_ABI, this.rpcProvider);
    const filter = contract.filters.Signature(null, null, hashes);
    const logs = await contract.queryFilter(filter, this.registryContract.creationBlock, 'latest');
    return logs.map(log => this._decodeSignatureEvent(log)).filter(sig => sig !== null);
  }

  abstract publishSignature(hash: string, data: string): Promise<SignatureReceipt>;

  /**
   * Decodes a signature event from an EVM event log.
   * 
   * @param log EVM event log containing the signature event data.
   * @returns Parsed OpenSig SignatureEvent object or null if the log format is invalid.
   */
  protected _decodeSignatureEvent(log: Log): SignatureEvent | null {
    const parsedLog = SignatureEventDecoder.parseLog(log);
    if (!parsedLog) {
      console.warn("OpenSig: Invalid log format in received blockchain event", log);
      return null;
    }
    console.debug("OpenSig: Decoded signature event", parsedLog);
    return {
      time: Number(parsedLog.args[0]),
      signatory: parsedLog.args[1],
      signature: parsedLog.args[2],
      data: parsedLog.args[3],
      txHash: log.transactionHash
    };
  }

}
