// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//

import { ethers, Log } from 'ethers';
import { SignatureEvent, SignatureReceipt } from '../types';
import { REGISTRY_ABI } from '../constants';
import { BlockchainConfig, IBlockchainProvider } from './IBlockchainProvider';

const SignatureEventDecoder = new ethers.Interface(REGISTRY_ABI);

/**
 * Abstract base class for EVM blockchain providers. Handles signature querying and decoding
 * using the ethers library.
 */
export abstract class AbstractEVMProvider implements IBlockchainProvider {

  public config: BlockchainConfig;
  public rpcProvider: ethers.AbstractProvider;

  constructor(config: BlockchainConfig, rpcProvider: ethers.AbstractProvider) {
    this.config = config;
    this.rpcProvider = rpcProvider;
  }

  async querySignatures(hashes: string[]): Promise<SignatureEvent[]> {
    const contract = new ethers.Contract(this.config.registryContract.address, REGISTRY_ABI, this.rpcProvider);
    const filter = contract.filters.Signature(null, null, hashes);
    const logs = await contract.queryFilter(filter, this.config.registryContract.creationBlock, 'latest');
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
