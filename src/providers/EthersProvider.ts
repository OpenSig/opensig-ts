// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//

// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//

import { ethers, Log } from 'ethers';
import { SignatureEvent, SignatureReceipt } from '../types';
import { REGISTRY_ABI } from '../constants';
import { Signer } from 'ethers';
import { BlockchainConfig, IBlockchainProvider } from './IBlockchainProvider';

const SignatureEventDecoder = new ethers.Interface(REGISTRY_ABI);

export class EthersProvider implements IBlockchainProvider {

  public config: BlockchainConfig;
  public signer: Signer;
  public transactionProvider: ethers.AbstractProvider;
  public logProvider: ethers.Provider;

  constructor(config: BlockchainConfig, signer: Signer, provider: ethers.AbstractProvider, logProvider?: ethers.Provider) {
    this.config = config;
    this.signer = signer;
    this.transactionProvider = provider;
    this.logProvider = logProvider ?? provider;
  }

  async querySignatures(hashes: string[]): Promise<SignatureEvent[]> {
    const contract = new ethers.Contract(this.config.registryContract.address, REGISTRY_ABI, this.logProvider);
    const filter = contract.filters.Signature(null, null, hashes);
    const logs = await contract.queryFilter(filter, this.config.registryContract.creationBlock, 'latest');
    return logs.map(log => this._decodeSignatureEvent(log)).filter(sig => sig !== null);
  }

  async publishSignature(signature: string, data: string) : Promise<SignatureReceipt> {
    const contract = new ethers.Contract(this.config.registryContract.address, REGISTRY_ABI, this.signer);
    const signatory = await this.signer.getAddress();
    const tx = await contract.getFunction('registerSignature')(signature, data);
    return {
      txHash: tx.hash,
      signature,
      signatory,
      data,
      confirmed: tx.wait()
    };
  }

  _decodeSignatureEvent(log: Log): SignatureEvent | null {
    const parsedLog = SignatureEventDecoder.parseLog(log);
    if (!parsedLog) {
      console.warn("OpenSig: Invalid log format in received blockchain event", log);
      return null;
    }
    return {
      time: parsedLog.args[0].toNumber(),
      signatory: parsedLog.args[1],
      signature: parsedLog.args[2],
      data: parsedLog.args[3]
    };
  }

}
