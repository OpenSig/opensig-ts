// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//
import { ethers } from 'ethers';
import { REGISTRY_ABI } from '../constants';
const SignatureEventDecoder = new ethers.Interface(REGISTRY_ABI);
/**
 * Abstract base class for EVM blockchain providers. Handles signature querying and decoding
 * using the ethers library.
 */
export class AbstractEVMProvider {
    constructor(chainId, registryContract, rpcProvider) {
        this.chainId = chainId;
        this.registryContract = registryContract;
        this.rpcProvider = rpcProvider;
    }
    async querySignatures(hashes) {
        const contract = new ethers.Contract(this.registryContract.address, REGISTRY_ABI, this.rpcProvider);
        const filter = contract.filters.Signature(null, null, hashes);
        const logs = await contract.queryFilter(filter, this.registryContract.creationBlock, 'latest');
        return logs.map(log => this._decodeSignatureEvent(log)).filter(sig => sig !== null);
    }
    /**
     * Decodes a signature event from an EVM event log.
     *
     * @param log EVM event log containing the signature event data.
     * @returns Parsed OpenSig SignatureEvent object or null if the log format is invalid.
     */
    _decodeSignatureEvent(log) {
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
