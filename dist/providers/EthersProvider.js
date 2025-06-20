// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//
import { ethers } from 'ethers';
import { REGISTRY_ABI } from '../constants';
import { AbstractEVMProvider } from './AbstractEVMProvider';
/**
 * OpenSig BlockchainProvider for EVM-compatible blockchains
 */
export class EthersProvider extends AbstractEVMProvider {
    constructor(chainId, registryContract, signer, rpcProvider) {
        super(chainId, registryContract, rpcProvider);
        this.signer = signer;
    }
    async publishSignature(signature, data) {
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
