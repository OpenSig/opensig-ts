import { ethers, Log } from 'ethers';
import { SignatureEvent, SignatureReceipt } from '../types';
import { IBlockchainProvider } from './IBlockchainProvider';
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
export declare abstract class AbstractEVMProvider implements IBlockchainProvider {
    chainId: number;
    registryContract: RegistryContract;
    rpcProvider: ethers.AbstractProvider;
    constructor(chainId: number, registryContract: RegistryContract, rpcProvider: ethers.AbstractProvider);
    querySignatures(hashes: string[]): Promise<SignatureEvent[]>;
    abstract publishSignature(hash: string, data: string): Promise<SignatureReceipt>;
    /**
     * Decodes a signature event from an EVM event log.
     *
     * @param log EVM event log containing the signature event data.
     * @returns Parsed OpenSig SignatureEvent object or null if the log format is invalid.
     */
    protected _decodeSignatureEvent(log: Log): SignatureEvent | null;
}
