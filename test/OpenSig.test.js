import { beforeAll, describe, expect, test } from '@jest/globals';
import { EthersProvider } from '../src/providers/EthersProvider';
import { ethers } from 'ethers';
import { Document, OpenSig } from '../src/opensig';
import fs from 'fs';
import { OPENSIG_SAMPLE_SIGNATURE } from './common';
import { bytesToHex } from '../src/utils';

const sampleConfig = {
  chainId: 1,
  name: "Ethereum",
  contract: "0x73eF7A3643aCbC3D616Bd5f7Ee5153Aa5f14DB30", 
  blockTime: 12000,
  creationBlock: 16764681,
}

describe('OpenSig class', () => {

  test('can be constructed with an EthersProvider', async () => {
    const signer = ethers.Wallet.createRandom();
    const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io");
    const ethereumProvider = new EthersProvider(sampleConfig, signer, provider);
    expect(() => new OpenSig(ethereumProvider)).not.toThrow();
  });

  test('throws error when constructed with invalid parameters', () => {
    expect(() => new OpenSig()).toThrow();
    expect(() => new OpenSig({})).toThrow();
    expect(() => new OpenSig(sampleConfig)).toThrow();
  });

  test('throws error when constructed with an ethers.provider', () => {
    expect(() => new OpenSig(new ethers.JsonRpcProvider("https://mainnet.infura.io"))).toThrow();
  });

  describe('createDocument', () => {

    let opensig;

    beforeAll(() => {
      const signer = ethers.Wallet.createRandom();
      const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io");
      const ethereumProvider = new EthersProvider(sampleConfig, signer, provider);
      opensig = new OpenSig(ethereumProvider);
    });

    test('createDocument throws when no document is provided', async () => {
      await expect(opensig.createDocument()).rejects.toThrow("TypeError");
    });

    test('createDocument throws when document is not a Blob or hash', async () => {
      await expect(opensig.createDocument(123456)).rejects.toThrow("TypeError");
      await expect(opensig.createDocument("123456")).rejects.toThrow("TypeError");
      await expect(opensig.createDocument({})).rejects.toThrow("TypeError");
      await expect(opensig.createDocument([])).rejects.toThrow("TypeError");
      await expect(opensig.createDocument(new Uint8Array(31))).rejects.toThrow("TypeError");
      await expect(opensig.createDocument(new Uint8Array(33))).rejects.toThrow("TypeError");
      await expect(opensig.createDocument("0x123456")).rejects.toThrow("TypeError");
      await expect(opensig.createDocument("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd")).rejects.toThrow("TypeError");
      await expect(opensig.createDocument("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde")).rejects.toThrow("TypeError");
      await expect(opensig.createDocument("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0")).rejects.toThrow("TypeError");
    });

    test('createDocument accepts a Blob and returns a Document object', async () => {
      const blob = new Blob(["Hello, world!"], { type: "text/plain" });
      const document = await opensig.createDocument(blob);
      expect(document).toBeInstanceOf(Document);
    });

    test('createDocument accepts a hex string hash and returns a Document object', async () => {
      const hash = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
      const document = await opensig.createDocument(hash);
      expect(document).toBeInstanceOf(Document);
    });

    test('createDocument accepts a Uint8Array hash and returns a Document object', async () => {
      const hash = new Uint8Array(32).fill(1);
      const document = await opensig.createDocument(new Blob());
      expect(document).toBeInstanceOf(Document);
    });

    test('createDocument generates the same document hash from a file as opensig-js', async () => {
      const fileBuffer = fs.readFileSync('./test/test-files/empty-file.txt');
      const file = new Blob([fileBuffer]);
      const document = await opensig.createDocument(file);
      expect(document).toBeInstanceOf(Document);
      expect(bytesToHex(document.documentHash)).toBe(OPENSIG_SAMPLE_SIGNATURE.documentHash);
    });

  });

});
