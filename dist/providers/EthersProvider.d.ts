import { ethers } from 'ethers';
import { SignatureReceipt } from '../types';
import { AbstractSigner } from 'ethers';
import { AbstractEVMProvider, RegistryContract } from './AbstractEVMProvider';
/**
 * OpenSig BlockchainProvider for EVM-compatible blockchains
 */
export declare class EthersProvider extends AbstractEVMProvider {
    signer: AbstractSigner;
    constructor(chainId: number, registryContract: RegistryContract, signer: AbstractSigner, rpcProvider: ethers.AbstractProvider);
    publishSignature(signature: string, data: string): Promise<SignatureReceipt>;
}
