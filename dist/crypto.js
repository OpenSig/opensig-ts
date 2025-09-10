"use strict";
// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionKey = void 0;
exports.hashFile = hashFile;
exports.hash = hash;
const hash_wasm_1 = require("hash-wasm");
const ethers_1 = require("ethers");
const aes_1 = require("@noble/ciphers/aes");
const utils_1 = require("./utils");
const errors_1 = require("./errors");
/**
 * Reads a file in chunks as Uint8Arrays
 */
async function* readFileChunks(blob, chunkSize = 1024 * 1024) {
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
async function hashFile(file) {
    const hasher = await (0, hash_wasm_1.createSHA256)();
    hasher.init();
    for await (const chunk of readFileChunks(file)) {
        hasher.update(chunk);
    }
    return (0, utils_1.hexToBytes)(hasher.digest('hex'));
}
/**
 * Hashes data using SHA-256 via hash-wasm
 */
async function hash(data) {
    (0, errors_1.assertUint8Array)(data, "hash");
    const hasher = await (0, hash_wasm_1.createSHA256)();
    hasher.init();
    hasher.update(data);
    return (0, utils_1.hexToBytes)(hasher.digest('hex'));
}
/**
 * AES-GCM based encryption using a key derived from a 32-byte seed
 */
class EncryptionKey {
    constructor(key) {
        this.key = key;
        if (key.length !== 32)
            throw new Error('Encryption key seed must be 32 bytes');
        this.key = key;
    }
    /**
     * Encrypts hex data using AES-GCM with random IV.
     * Output is iv + ciphertext, hex-encoded.
     */
    async encrypt(data) {
        (0, errors_1.assertUint8Array)(data, "encrypt");
        const iv = (0, ethers_1.randomBytes)(12); // 96-bit IV
        const aes = (0, aes_1.gcm)(this.key, iv);
        const ciphertext = aes.encrypt(data);
        return new Uint8Array([...iv, ...ciphertext]);
    }
    /**
     * Decrypts AES-GCM encrypted data (hex-encoded).
     */
    async decrypt(data) {
        (0, errors_1.assertUint8Array)(data, "decrypt");
        const iv = data.slice(0, 12);
        const ciphertext = data.slice(12);
        const cipher = (0, aes_1.gcm)(this.key, iv);
        const plaintext = cipher.decrypt(ciphertext);
        return plaintext;
    }
}
exports.EncryptionKey = EncryptionKey;
