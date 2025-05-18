import { describe, expect, test } from '@jest/globals';
import { bytesToHex, concat, hexToBytes } from '../src/utils';
import { EncryptionKey, hash } from '../src/crypto';
import { aesgcmEncrypt, decodeUTF16BE, OPENSIG_SAMPLE_SIGNATURE, sha256 } from './common';


describe('Cryptographic functions', () => {

  describe('Hashing algorithm', () => {

    test('accepts Uint8Array and returns Uint8Array', async () => {
      const data = new Uint8Array([1, 2, 3]);
      expect(data).toBeInstanceOf(Uint8Array);
      const actualHash = await hash(data);
      expect(actualHash).toBeInstanceOf(Uint8Array);
    });

    test('throws error for unsupported data types', async () => {
      const data = "0x010203";
      await expect(hash(data)).rejects.toThrow("OpenSig hash function: expected Uint8Array");
    });

    test('uses SHA-256', async () => {
      // SHA-256 hash of "hello" calculated via https://www.browserling.com/tools/all-hashes
      const encoder = new TextEncoder();
      const data = encoder.encode("hello");
      const expectedHash = "0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";
      const actualHash = await hash(data);
      expect(bytesToHex(actualHash)).toEqual(expectedHash);
    });

    test('is compatible with opensig-js', async () => {
      // OpenSig uses SHA-256 for hashing and opensig-js uses subtleCrypto
      const data = new Uint8Array("hello")
      const expectedHash = await sha256(data);
      const actualHash = await hash(data);
      expect(bytesToHex(actualHash)).toEqual(bytesToHex(new Uint8Array(expectedHash)));
    });

    test('is compatible with a published OpenSig signature', async () => {
      const chainIdBytes = Uint8Array.from(''+OPENSIG_SAMPLE_SIGNATURE.chainId);
      const chainSpecificHash = await hash(concat([chainIdBytes, hexToBytes(OPENSIG_SAMPLE_SIGNATURE.documentHash)]));
      const sig1 = await hash(chainSpecificHash);
      const sig2 = await hash(concat([chainSpecificHash, sig1]));
      expect(bytesToHex(sig2)).toEqual(OPENSIG_SAMPLE_SIGNATURE.signature);
    });

  });


  describe('encrypt function', () => {

    const sampleKey = new Uint8Array(32).fill(1); // 32-byte buffer

    test('accepts Uint8Array and returns Uint8Array', async () => {
      const data = new Uint8Array([1, 2, 3]);
      expect(data).toBeInstanceOf(Uint8Array);
      const key = new EncryptionKey(sampleKey);
      const result = await key.encrypt(data);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    test('throws error for unsupported data types', async () => {
      const key = new EncryptionKey(sampleKey);
      await expect(key.encrypt(123)).rejects.toThrow("OpenSig encrypt function: expected Uint8Array");
      await expect(key.encrypt("0x010203")).rejects.toThrow("OpenSig encrypt function: expected Uint8Array");
    });

    test('is compatible with opensig-js', async () => {
      const encoder = new TextEncoder();
      const data = encoder.encode("hello");
      const key = new EncryptionKey(sampleKey);
      const encryptedData = await key.encrypt(data);
      const nonce = encryptedData.slice(0, 12);
      const expectedData = await aesgcmEncrypt(sampleKey, nonce, data);
      expect(bytesToHex(encryptedData)).toEqual(bytesToHex(expectedData));
    });
    
  });


  describe('decrypt function', () => {

    const sampleKey = new Uint8Array(32).fill(1); // 32-byte buffer

    test('accepts Uint8Array and returns Uint8Array', async () => {
      const data = new Uint8Array([1, 2, 3]);
      const nonce = crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await aesgcmEncrypt(sampleKey, nonce, data);
      expect(encryptedData).toBeInstanceOf(Uint8Array);
      const key = new EncryptionKey(sampleKey);
      const result = await key.decrypt(encryptedData);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    test('throws error for unsupported data types', async () => {
      const key = new EncryptionKey(sampleKey);
      await expect(key.decrypt(123)).rejects.toThrow("OpenSig decrypt function: expected Uint8Array");
      await expect(key.decrypt("0x010203")).rejects.toThrow("OpenSig decrypt function: expected Uint8Array");
    });

    test('is compatible with opensig-js', async () => {
      const nonce = crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const data = encoder.encode("hello");
      const encryptedData = await aesgcmEncrypt(sampleKey, nonce, data);
      const key = new EncryptionKey(sampleKey);
      const decryptedData = await key.decrypt(encryptedData);
      expect(bytesToHex(decryptedData)).toEqual(bytesToHex(data));
    });

    test('is compatible with a published OpenSig signature', async () => {
      const key = new EncryptionKey(hexToBytes(OPENSIG_SAMPLE_SIGNATURE.documentHash));
      const encryptedData = hexToBytes(OPENSIG_SAMPLE_SIGNATURE.data.encrypted).slice(2); // remove the opensig header
      const decryptedData = await key.decrypt(encryptedData);
      expect(decodeUTF16BE(decryptedData)).toEqual(OPENSIG_SAMPLE_SIGNATURE.data.unencrypted);
    });

  });

});