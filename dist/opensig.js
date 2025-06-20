// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//
import { assertIBlockchainProvider } from './providers/IBlockchainProvider';
import { EncryptionKey, hash, hashFile } from './crypto';
import * as DataEncoder from './data-encoder';
import { MAX_SIGS_PER_DISCOVERY_ITERATION } from './constants';
import { bytesToHex, concat, hexToBytes, isBlob, isHexString } from './utils';
/**
 * opensig.js
 *
 * Core opensig browser library for signing and verifying documents and files on supported
 * blockchains.
 *
 * Requires blockchains.js
 */
/**
 * Set the log trace level for debugging.  Call setLogTrace() to enable or disable logging.
 */
let logTrace = function () { };
setLogTrace(false);
export function setLogTrace(traceOn) {
    logTrace = traceOn ? Function.prototype.bind.call(console.info, console, "[opensig]") : function () { };
}
/**
 * OpenSig class
 *
 * The main entry point for the OpenSig library.  Use this class to create Document objects
 * from files or hashes.  The Document class is used to sign and verify documents.
 */
export class OpenSig {
    constructor(provider) {
        this.provider = provider;
        assertIBlockchainProvider(provider);
    }
    async createDocument(fileOrHash) {
        let hash = new Uint8Array();
        if (fileOrHash instanceof Uint8Array) {
            hash = fileOrHash;
        }
        else if (isBlob(fileOrHash)) {
            hash = await hashFile(fileOrHash);
        }
        else if (isHexString(fileOrHash)) {
            hash = hexToBytes(fileOrHash);
        }
        if (hash.length != 32) {
            throw new TypeError("TypeError: expecting Blob or document hash (as 32-byte Uint8Array or hex string)");
        }
        return new Document(this.provider, hash);
    }
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
export class Document {
    /**
     * Construct an OpenSig Document (an object formed from a document hash that can be signed and
     * verified) from the given hash.
     *
     * @param {IBlockchainProvider} provider - the blockchain provider to use for signing and verifying
     * @param {Uint8Array} hash 32-byte hash of a file or document
     */
    constructor(provider, hash) {
        this.signingInProgress = false;
        this.provider = provider;
        this.sign = this.sign.bind(this);
        this.verify = this.verify.bind(this);
        this.documentHash = hash;
        this.encryptionKey = new EncryptionKey(hash);
    }
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
    async sign(data) {
        if (this.signingInProgress)
            throw new Error("Signing already in progress");
        if (!this.hashIterator)
            throw new Error("Document must be verified before signing");
        this.signingInProgress = true;
        return this.hashIterator.next()
            .then(signature => {
            return _publishSignature(this.provider, signature[0], this.encryptionKey, data);
        })
            .catch(error => {
            var _a;
            (_a = this.hashIterator) === null || _a === void 0 ? void 0 : _a.reset(this.hashIterator.currentIndex() - 1);
            throw error;
        })
            .finally(() => {
            this.signingInProgress = false;
        });
    }
    /**
     * Retrieves all signatures on the blockchain for this Document.
     *
     * @returns Array of signature events or empty array if none
     * @throws BlockchainNotSupportedError
     */
    async verify() {
        logTrace("verifying hash", bytesToHex(this.documentHash));
        return _discoverSignatures(this.provider, this.documentHash, this.encryptionKey)
            .then(result => {
            this.hashIterator = result.hashes;
            return result.signatures;
        });
    }
    /**
     * Calculates the unique public id of the document.  This hash can be safely shared
     * with others without revealing the document hash or the encryption key used to encrypt
     * signature data.
     * @returns string - the public id of the document as a 32-byte hex string
     */
    async getPublicIdentifier() {
        return bytesToHex(await hash(this.documentHash));
    }
    /**
     * Returns a hex string representation of the document hash.
     * IMPORTANT! this hash must not be displayed or shared with others as it could be used to
     * sign without being in posession of the original document.
     * @returns string - the 32-byte document hash as a hex string prefixed with '0x'
     */
    getDocumentHash() {
        return bytesToHex(this.documentHash);
    }
}
//
// Signing functions
//
/**
 * Constructs a transaction to publish the given signature transaction to the blockchain's registry contract.
 * Returns an object containing the transaction hash, signatory, signature, and a Promise to resolve when confirmed.
 */
async function _publishSignature(provider, signature, encryptionKey, data) {
    const signatureHex = bytesToHex(signature);
    return DataEncoder.encodeData(encryptionKey, data)
        .then(encodedData => {
        logTrace("publishing signature:", signature, "with data", encodedData);
        return provider.publishSignature(signatureHex, encodedData);
    });
}
//
// Verifying functions
//
/**
 * Queries the blockchain for signature events generated by the registry contract for the given document hash.
 *
 * In the OpenSig Standard, signatures are a deterministic chain of hashes derived from the document hash and
 * chain id.  This function queries the blockchain for signatures in the order of those in the chain of hashes,
 * stopping when a signature in the sequence is not not found.  To minimise latency while handling signature
 * chains of any length, this function queries for signatures a batch at a time.
 */
async function _discoverSignatures(provider, documentHash, encryptionKey) {
    const signatureEvents = [];
    const hashes = new HashIterator(documentHash, provider.chainId);
    async function _decodeSignatureEvent(encryptionKey, event) {
        const decodedData = await DataEncoder.decodeData(encryptionKey, event.data);
        return { ...event, data: decodedData };
    }
    async function _discoverNext(n) {
        const eSigs = await hashes.next(n);
        const strEsigs = eSigs.map(s => { return bytesToHex(s); });
        // query the blockchain for the next batch of signatures and decode them
        logTrace("querying the blockchain for signatures: ", strEsigs);
        const events = await provider.querySignatures(strEsigs);
        logTrace("signature events:", events);
        const decodedEvents = await Promise.all(events.map(e => _decodeSignatureEvent(encryptionKey, e)));
        signatureEvents.push(...decodedEvents);
        // discover more signatures if necessary
        if (events.length === MAX_SIGS_PER_DISCOVERY_ITERATION)
            return _discoverNext(MAX_SIGS_PER_DISCOVERY_ITERATION);
        // Now all signatures have been discovered, sort them by most recent first and reset the
        // iterator to the last published signature.
        signatureEvents.sort((a, b) => b.time - a.time);
        hashes.reset(signatureEvents.length > 0 ? hashes.indexOf(signatureEvents[0].signature) : -1);
        return { hashes: hashes, signatures: signatureEvents };
    }
    return _discoverNext(MAX_SIGS_PER_DISCOVERY_ITERATION);
}
/**
 * HashIterator class
 *
 * The core of OpenSig.  Generates the deterministic sequence of chain-specific signature hashes
 * from a document hash in accordance with OpenSig standard v0.1.  Use `next` to retrieve the next
 * `n` hashes.  The iterator will only generate hashes when the `next` function is called.
 */
export class HashIterator {
    constructor(documentHash, chainId) {
        this.hashes = [];
        this.hashPtr = -1;
        this.documentHash = documentHash;
        this.chainId = chainId;
    }
    async next(n = 1) {
        if (!this.chainSpecificHash)
            this.chainSpecificHash = await hash(concat([Uint8Array.from('' + this.chainId), this.documentHash]));
        if (this.hashes.length === 0)
            this.hashes.push(await hash(this.chainSpecificHash));
        for (let i = this.hashes.length; i <= this.hashPtr + n; i++) {
            this.hashes.push(await hash(concat([this.chainSpecificHash, this.hashes[i - 1]])));
        }
        return this.hashes.slice(this.hashPtr + 1, (this.hashPtr += n) + 1);
    }
    current() { return this.hashPtr >= 0 ? this.hashes[this.hashPtr] : undefined; }
    currentIndex() { return this.hashPtr; }
    indexAt(i) { return i < this.hashes.length ? this.hashes[i] : undefined; }
    indexOf(hash) {
        const hashHex = typeof hash === 'string' ? hash : bytesToHex(hash);
        return this.hashes.findIndex(h => bytesToHex(h) === hashHex);
    }
    reset(n = 0) { this.hashPtr = n; }
    size() { return this.hashPtr + 1; }
}
