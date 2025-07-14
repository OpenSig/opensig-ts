"use strict";
// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthersProvider = void 0;
const ethers_1 = require("ethers");
const constants_1 = require("../constants");
const AbstractEVMProvider_1 = require("./AbstractEVMProvider");
/**
 * OpenSig BlockchainProvider for EVM-compatible blockchains
 */
class EthersProvider extends AbstractEVMProvider_1.AbstractEVMProvider {
    constructor(chainId, registryContract, signer, rpcProvider) {
        super(chainId, registryContract, rpcProvider);
        this.signer = signer;
    }
    async publishSignature(signature, data) {
        const contract = new ethers_1.ethers.Contract(this.registryContract.address, constants_1.REGISTRY_ABI, this.signer);
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
exports.EthersProvider = EthersProvider;
