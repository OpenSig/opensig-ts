// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//

import { createSHA256 } from 'hash-wasm';
import { randomBytes } from 'ethers';
import { gcm } from '@noble/ciphers/aes';
import { hexToBytes } from './utils';
import { assertUint8Array } from './errors';
import { sha256 } from '@noble/hashes/sha2';

  

/**
 * Reads a file in chunks as Uint8Arrays
 */
async function* readFileChunks(blob: Blob, chunkSize = 1024 * 1024): AsyncGenerator<Uint8Array> {
  let offset = 0;
  while (offset < blob.size) {
    const slice = blob.slice(offset, offset + chunkSize);
    const buffer = await slice.arrayBuffer();
    yield new Uint8Array(buffer);
    offset += chunkSize;
  }
}

/**
 * Hashes a File using streaming SHA-256 via hash-wasm
 */
export async function hashFile(file: Blob): Promise<Uint8Array> {
  const hasher = await createSHA256();
  hasher.init();
  for await (const chunk of readFileChunks(file)) {
    hasher.update(chunk);
  }
  return hexToBytes(hasher.digest('hex'));
}

/**
 * Hashes data using SHA-256 via hash-wasm
 */
export async function hash(data: Uint8Array): Promise<Uint8Array> {
  assertUint8Array(data, "hash");
  return sha256(data);
}

/**
 * AES-GCM based encryption using a key derived from a 32-byte seed
 */
export class EncryptionKey {

  constructor(private key: Uint8Array) {
    if (key.length !== 32) throw new Error('Encryption key seed must be 32 bytes');
    this.key = key;
  }

  /**
   * Encrypts hex data using AES-GCM with random IV.
   * Output is iv + ciphertext, hex-encoded.
   */
  async encrypt(data: Uint8Array): Promise<Uint8Array> {
    assertUint8Array(data, "encrypt");
    const iv = randomBytes(12); // 96-bit IV
    const aes = gcm(this.key, iv);
    const ciphertext = await aes.encrypt(data);
    return new Uint8Array([...iv, ...ciphertext]);
  }

  /**
   * Decrypts AES-GCM encrypted data (hex-encoded).
   */
  async decrypt(data: Uint8Array): Promise<Uint8Array> {
    assertUint8Array(data, "decrypt");
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const cipher = gcm(this.key, iv);
    const plaintext = await cipher.decrypt(ciphertext);
    return plaintext;
  }
}
