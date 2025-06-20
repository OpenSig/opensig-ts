import { IBlockchainProvider } from './providers/IBlockchainProvider';
import { EncryptionKey } from './crypto';
import { Signature, SignatureData, SignatureReceipt } from './types';
export declare function setLogTrace(traceOn: boolean): void;
/**
 * OpenSig class
 *
 * The main entry point for the OpenSig library.  Use this class to create Document objects
 * from files or hashes.  The Document class is used to sign and verify documents.
 */
export declare class OpenSig {
    provider: IBlockchainProvider;
    constructor(provider: IBlockchainProvider);
    createDocument(fileOrHash: Blob | Uint8Array | string): Promise<Document>;
}
/**
 * Document class
 *
 * Represents an OpenSig document - an object formed from a hash that can be signed and verified.
 * To use this class directly you must first hash your data.  Use the File class instead to
 * construct a Document from a file.
 *
 * Before a Document can be signed it must first be verified.  Verification returns the list of
 * signatures for this Document found on the blockchain and establishes the next signature in
 * the sequence ready for signing.
 */
export declare class Document {
    provider: IBlockchainProvider;
    documentHash: Uint8Array;
    encryptionKey: EncryptionKey;
    hashIterator?: HashIterator;
    signingInProgress: boolean;
    /**
     * Construct an OpenSig Document (an object formed from a document hash that can be signed and
     * verified) from the given hash.
     *
     * @param {IBlockchainProvider} provider - the blockchain provider to use for signing and verifying
     * @param {Uint8Array} hash 32-byte hash of a file or document
     */
    constructor(provider: IBlockchainProvider, hash: Uint8Array);
    /**
     * Signs the document with the next available signature hash and the given data. The document
     * must have been verified using the `verify` function before signing.
     *
     * @param {Object} data (optional) containing
     *    type: 'string'|'binary'|'none'
     *    encrypted: boolean. If true, opensig will encrypt the data using the document hash as the encryption key
     *    content: string containing either the text or hex content
     * @returns {Object} containing
     *    txHash: blockchain transaction hash
     *    signatory: blockchain address of the signer
     *    signature: the signature hash published
     *    confirmationInformer: Promise to resolve with the receipt when the transaction has been confirmed
     * @throws BlockchainNotSupportedError
     */
    sign(data?: SignatureData): Promise<SignatureReceipt>;
    /**
     * Retrieves all signatures on the blockchain for this Document.
     *
     * @returns Array of signature events or empty array if none
     * @throws BlockchainNotSupportedError
     */
    verify(): Promise<Signature[]>;
    /**
     * Calculates the unique public id of the document.  This hash can be safely shared
     * with others without revealing the document hash or the encryption key used to encrypt
     * signature data.
     * @returns string - the public id of the document as a 32-byte hex string
     */
    getPublicIdentifier(): Promise<string>;
    /**
     * Returns a hex string representation of the document hash.
     * IMPORTANT! this hash must not be displayed or shared with others as it could be used to
     * sign without being in posession of the original document.
     * @returns string - the 32-byte document hash as a hex string prefixed with '0x'
     */
    getDocumentHash(): string;
}
/**
 * HashIterator class
 *
 * The core of OpenSig.  Generates the deterministic sequence of chain-specific signature hashes
 * from a document hash in accordance with OpenSig standard v0.1.  Use `next` to retrieve the next
 * `n` hashes.  The iterator will only generate hashes when the `next` function is called.
 */
export declare class HashIterator {
    documentHash: Uint8Array;
    chainSpecificHash?: Uint8Array;
    chainId: number;
    hashes: Uint8Array[];
    hashPtr: number;
    constructor(documentHash: Uint8Array, chainId: number);
    next(n?: number): Promise<Uint8Array[]>;
    current(): Uint8Array | undefined;
    currentIndex(): number;
    indexAt(i: number): Uint8Array | undefined;
    indexOf(hash: Uint8Array | string): number;
    reset(n?: number): void;
    size(): number;
}
