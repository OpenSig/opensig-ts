/**
 * Hashes a File using streaming SHA-256 via hash-wasm
 */
export declare function hashFile(file: Blob, progressCallback?: (progress: number) => void): Promise<Uint8Array>;
/**
 * Hashes data using SHA-256 via hash-wasm
 */
export declare function hash(data: Uint8Array): Promise<Uint8Array>;
/**
 * AES-GCM based encryption using a key derived from a 32-byte seed
 */
export declare class EncryptionKey {
    private key;
    constructor(key: Uint8Array);
    /**
     * Encrypts hex data using AES-GCM with random IV.
     * Output is iv + ciphertext, hex-encoded.
     */
    encrypt(data: Uint8Array): Promise<Uint8Array>;
    /**
     * Decrypts AES-GCM encrypted data (hex-encoded).
     */
    decrypt(data: Uint8Array): Promise<Uint8Array>;
}
