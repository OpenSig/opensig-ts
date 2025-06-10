// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//

import { ethers } from 'ethers';
import { SignatureReceipt } from '../types';
import { REGISTRY_ABI } from '../constants';
import { AbstractSigner } from 'ethers';
import { AbstractEVMProvider, RegistryContract } from './AbstractEVMProvider';

/**
 * OpenSig BlockchainProvider for EVM-compatible blockchains
 */
export class EthersProvider extends AbstractEVMProvider {

  public signer: AbstractSigner;

  constructor(
    chainId: number, 
    registryContract: RegistryContract, 
    signer: AbstractSigner, 
    rpcProvider: ethers.AbstractProvider
  ) {
    super(chainId, registryContract, rpcProvider);
    this.signer = signer;
  }

  async publishSignature(signature: string, data: string) : Promise<SignatureReceipt> {
    const contract = new ethers.Contract(this.registryContract.address, REGISTRY_ABI, this.signer);
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

}
