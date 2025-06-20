import { SignatureEvent, SignatureReceipt } from '../types';
/**
 * Interface for blockchain providers that handle signature publishing and querying.
 */
export interface IBlockchainProvider {
    chainId: number;
    /**
     * Queries the blockchain for signature events matching the provided hashes.
     * @param hashes Array of signature hashes to query.
     */
    querySignatures(hashes: string[]): Promise<SignatureEvent[]>;
    /**
     * Publishes a single signature to the blockchain and returns a signature receipt.
     * @param hash The signature to publish.
     * @param data The data to be published alongside the signatute. '0x' if none.
     */
    publishSignature(hash: string, data: string): Promise<SignatureReceipt>;
}
/**
 * Asserts that the provided object is a valid IBlockchainProvider.
 * @param obj The object to check.
 */
export declare function assertIBlockchainProvider(obj: any): asserts obj is IBlockchainProvider;
