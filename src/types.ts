// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//

/**
 * Optional metadata to include when constructing Document objects.
 */
export interface Metadata {
  name?: string;
  mimetype?: string;
  size?: number;
  [key: string]: any;
}

/**
 * A signature event retrieved from the blockchain.
 * Contains the time of signing (UNIX time in seconds), signer's address, signature hash, 
 * and encoded annotation data.
 */
export interface SignatureEvent {
  time: number;
  signatory: string;
  signature: string;
  data: string;
}

/**
 * Data to be signed
 */
export interface SignatureData {
  type: 'none' | 'string' | 'binary' | 'invalid';
  content?: string;
  encrypted?: boolean;
  error?: string;
}

/**
 * An OpenSig signature derived from a `SignatureEvent`.
 * Contains the time of signing (UNIX time in seconds), signer's address, signature hash, 
 * and annotation. 
 */
export interface Signature {
  time: number;
  signatory: string;
  signature: string;
  data: SignatureData;
}

/**
 * Options for signing a document.
 */
export interface SignOptions {
  annotation?: string;
  encrypt?: boolean;
}

/**
 * Receipt returned after successfully publish a signature to the blockchain. 
 * Contains the transaction hash, published signature, signer address.
 * Also includes a promise to allow the UI to wait for blockchain confirmation.
 */
export interface SignatureReceipt {
  txHash: string;
  signature: string;
  signatory: string;
  data: string;
  confirmed: Promise<any>;
}

/**
 * Represents a document that can be signed. It can be a string, File, Blob,
 * Uint8Array, ArrayBuffer, or an object with a pre-calculated document hash.
 */
export type SignableInput =
  | string
  | File
  | Blob
  | Uint8Array
  | ArrayBuffer
  | { hash: Uint8Array | string };
