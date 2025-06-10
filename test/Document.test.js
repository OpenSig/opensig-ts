
import { beforeAll, describe, expect, jest, test } from '@jest/globals';
import { bytesToHex, hexToBytes } from '../src/utils';
import { aesgcmEncrypt, encodeUTF16BE, sha256 } from './common';

// ------ Test Configuration ------

const OPENSIG_PROTOCOL_CONSTANTS = {
  SIGNATURE_DATA_VERSION: "00",
  SIGNATURE_DATA_UNENCRYPTED_STRING: "00",
  SIGNATURE_DATA_UNENCRYPTED_BINARY: "01",
  SIGNATURE_DATA_ENCRYPTED_STRING: "80",
  SIGNATURE_DATA_ENCRYPTED_BINARY: "81",
}


// ------ Mocks ------

const mockNetwork = {
  config: { chainId: 1 },
  publishSignature: jest.fn(() => Promise.resolve({
    txHash: '0x123',
    signatory: '0xabc',
    signature: '0xsig',
    confirmationInformer: Promise.resolve('confirmed'),
  })),
  querySignatures: jest.fn(() => Promise.resolve([])),
};


let opensig;
let ethers;

beforeAll(async () => {
  // Isolate module loading after mocks
  await jest.isolateModulesAsync(async () => {
    opensig = await import('../src/opensig');
    // opensig.setLogTrace(true);
    ethers = await import('ethers');
  });
});


describe('OpenSig Document class', () => {

  const sampleHash = hexToBytes("abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getPublicIdentifier() does not return the document hash but the derivative H(Hd)', async () => {
    const doc = new opensig.Document(mockNetwork, sampleHash);
    const publicIdentifier = await doc.getPublicIdentifier();
    expect(publicIdentifier).not.toEqual(bytesToHex(sampleHash));
    expect(publicIdentifier).toEqual(bytesToHex(await sha256(sampleHash)));
  });

  describe('Verifying', () => {

    let hashChain = [];

    async function testEventDecoding(eventData, expectedAnnotation) {
      const doc = new opensig.Document(mockNetwork, sampleHash);
      const signer1 = ethers.Wallet.createRandom().address;
      const events = [
        {time: 1234567890, signatory: signer1, signature: hashChain[0], data: eventData}
      ];
      mockNetwork.querySignatures.mockResolvedValueOnce(events);
      const signatures = await doc.verify();
      expect(signatures.length).toBe(1);
      expect(signatures[0].time).toBe(1234567890);
      expect(signatures[0].signatory).toBe(signer1);
      expect(signatures[0].signature).toBe(hashChain[0]);
      expect(signatures[0].data).toMatchObject(expectedAnnotation);
    }

    beforeAll(async () => {
      const iterator = new opensig.HashIterator(sampleHash, mockNetwork.config.chainId);
      const hashes = await iterator.next(100);
      hashChain = hashes.map(h => bytesToHex(h));
    });

    test('Queries the blockchain in batches of 10', async () => {
      const doc = new opensig.Document(mockNetwork, sampleHash);
      await doc.verify();
      expect(mockNetwork.querySignatures).toHaveBeenCalled();
      expect(mockNetwork.querySignatures.mock.calls[0][0].length).toBe(10);
      for (let i = 0; i < 10; i++) {
        expect(mockNetwork.querySignatures.mock.calls[0][0][i]).toEqual(bytesToHex(doc.hashIterator.indexAt(i)));
        expect(mockNetwork.querySignatures.mock.calls[0][0][i].length).toEqual(66);
      }
    });

    describe('Signature event decoding', () => {

      test('Event with no data is decoded correctly', async () => {
        return testEventDecoding(
          '0x',
          { type: 'none' }
        );
      });

      test('Event without annotation is decoded correctly', async () => {
        return testEventDecoding(
          '0x0000',
          { type: 'string', content: '', encrypted: false }
        );
      });

      test('Event with string annotation is decoded correctly', async () => {
        return testEventDecoding(
          '0x0000' + bytesToHex(encodeUTF16BE("hello")).slice(2),
          {type: 'string', content: 'hello', encrypted: false}
        );
      });

      test('Event with binary annotation is decoded correctly', async () => {
        const binaryData = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
        return testEventDecoding(
          '0x0001' + bytesToHex(binaryData, false),
          {type: 'binary', content: bytesToHex(binaryData), encrypted: false}
        );
      });

      test('Event with encrypted string annotation is decoded correctly', async () => {
        const nonce = crypto.getRandomValues(new Uint8Array(12));
        const encryptedData = await aesgcmEncrypt(sampleHash, nonce, encodeUTF16BE("hello"));
        return testEventDecoding(
          '0x0080' + bytesToHex(encryptedData, false),
          {type: 'string', content: 'hello', encrypted: true}
        );
      });

      test('Event with encrypted binary annotation is decoded correctly', async () => {
        const nonce = crypto.getRandomValues(new Uint8Array(12));
        const binaryData = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
        const encryptedData = await aesgcmEncrypt(sampleHash, nonce, binaryData);
        return testEventDecoding(
          '0x0081' + bytesToHex(encryptedData, false),
          {type: 'binary', content: bytesToHex(binaryData), encrypted: true}
        );
      });

      test('Multiple events are decoded correctly', async () => {
        const doc = new opensig.Document(mockNetwork, sampleHash);
        const signer1 = ethers.Wallet.createRandom().address;
        const signer2 = ethers.Wallet.createRandom().address;
        const signer3 = ethers.Wallet.createRandom().address;
        const annotations = ["Alice", "Bob", "Charlie"];
        const events = [
          {time: 123, signatory: signer1, signature: hashChain[0], data: '0x0000' + bytesToHex(encodeUTF16BE(annotations[0])).slice(2)},
          {time: 456, signatory: signer2, signature: hashChain[1], data: '0x0000' + bytesToHex(encodeUTF16BE(annotations[1])).slice(2)},
          {time: 789, signatory: signer3, signature: hashChain[2], data: '0x0000' + bytesToHex(encodeUTF16BE(annotations[2])).slice(2)}
        ];
        mockNetwork.querySignatures.mockResolvedValueOnce(events);
        const signatures = await doc.verify();
        expect(signatures.length).toBe(3);
        for (let i = 0; i < 3; i++) {
          expect(signatures[i].time).toBe(events[2-i].time);
          expect(signatures[i].signatory).toBe(events[2-i].signatory);
          expect(signatures[i].signature).toBe(events[2-i].signature);
          expect(signatures[i].data).toMatchObject({type: 'string', content: annotations[2-i], encrypted: false});
        }
      });

      describe('Events with invalid data do not throw but are marked with "invalid" data type', () => {

        test('incorrect version', async () => {
          return testEventDecoding(
            '0x0100' + bytesToHex(encodeUTF16BE("hello")).slice(2),
            {type: 'invalid', content: 'unsupported data version: 01'}
          );
        }); 

        test('incorrect data type', async () => {
          return testEventDecoding(
            '0x0002' + bytesToHex(encodeUTF16BE("hello")).slice(2),
            {type: 'invalid', content: 'unsupported data type: 2 (version=00)'}
          );
        });

        test('0xffff version and data type fields', async () => {
          return testEventDecoding(
            '0xffff' + bytesToHex(encodeUTF16BE("hello")).slice(2),
            {type: 'invalid', content: 'unsupported data version: ff'}
          );
        });

        test('Corrupt 0x', async () => {
          return testEventDecoding(
            '0y0000' + bytesToHex(encodeUTF16BE("hello")).slice(2),
            {type: 'invalid', content: 'corrupt hex data'}
          );
        });

        test('Empty data', async () => {
          return testEventDecoding(
            '0x0000',
            {type: 'string', content: '', encrypted: false}
          );
        });

        test('Empty encrypted data', async () => {
          return testEventDecoding(
            '0x0080',
            {type: 'string', content: '', encrypted: true}
          );
        });

        test('Invalid encrypted data', async () => {
          return testEventDecoding(
            '0x0080' + bytesToHex(encodeUTF16BE("hello")).slice(2),
            {type: 'invalid', content: 'failed to decrypt data'}
          );
        });

      }); // End of invalid data tests


      describe('Batch verify boundary tests', () => {

        // Signatures are verified in batches of 10. Each batch is a separate call to the network, 
        // requesting eth logs for the hashes in the batch. Batches continue to be requested until
        // less than a full batch is returned.

        function createMockEvents(numEvents) {
          const signer1 = ethers.Wallet.createRandom().address;
          const events = [];
          for (let i = 0; i < numEvents; i++) {
            events.push({time: 1234567890+i, signatory: signer1, signature: hashChain[i], data: '0x0000'});
          }
          return events;
        };

        async function testBatchVerify(numEvents) { 
          const doc = new opensig.Document(mockNetwork, sampleHash);
          const events = createMockEvents(numEvents);
          const expectedBatches = Math.ceil((numEvents+1) / 10);
          for (let i = 0; i < expectedBatches; i++) {
            const start = i * 10;
            const end = Math.min(start + 10, numEvents);
            const batch = events.slice(start, end);
            mockNetwork.querySignatures.mockResolvedValueOnce(batch);
          }
          const signatures = await doc.verify();
          expect(mockNetwork.querySignatures).toHaveBeenCalled();
          expect(mockNetwork.querySignatures.mock.calls.length).toBe(expectedBatches);
          expect(signatures.length).toBe(numEvents);
          expect(doc.hashIterator.currentIndex()).toBe(numEvents - 1);
        }

        beforeAll(async () => {
          // Perform sanity check on hashChain
          const doc = new opensig.Document(mockNetwork, sampleHash);
          const dummySignatures = await doc.verify();
          expect(dummySignatures.length).toBe(0);
          expect(bytesToHex(doc.hashIterator.documentHash)).toEqual(bytesToHex(sampleHash));
          expect(bytesToHex(doc.hashIterator.indexAt(0))).toEqual(hashChain[0]);
          expect(bytesToHex(doc.hashIterator.indexAt(9))).toEqual(hashChain[9]);
        });

        test('Batch verify with 0 signatures', async () => await testBatchVerify(0));
        test('Batch verify with 1 signatures', async () => await testBatchVerify(1));
        test('Batch verify with 9 signatures', async () => await testBatchVerify(9));
        test('Batch verify with 10 signatures', async () => await testBatchVerify(10));
        test('Batch verify with 11 signatures', async () => await testBatchVerify(11));
        test('Batch verify with 19 signatures', async () => await testBatchVerify(19));
        test('Batch verify with 20 signatures', async () => await testBatchVerify(20));
        test('Batch verify with 21 signatures', async () => await testBatchVerify(21));
        test('Batch verify with 99 signatures', async () => await testBatchVerify(99));

      });

    });  // End of Signature event decoding

  });  // End of Verifying


  describe('Signing', () => {

    describe('Invalid parameters', () => {

      test('Invalid data type throws error', async () => {
        const doc = new opensig.Document(mockNetwork, sampleHash);
        await doc.verify();
        await expect(doc.sign({ type: 'invalid-type', content: 'hello', encrypted: true }))
          .rejects.toThrow("invalid data type 'invalid-type'");
      });

      test('Invalid string content throws error', async () => {
        const doc = new opensig.Document(mockNetwork, sampleHash);
        await doc.verify();
        await expect(doc.sign({ type: 'string', content: 123, encrypted: true }))
          .rejects.toThrow("invalid data content");
      });

      test('Missing string content throws error', async () => {
        const doc = new opensig.Document(mockNetwork, sampleHash);
        await doc.verify();
        await expect(doc.sign({ type: 'string', encrypted: true }))
          .rejects.toThrow("invalid data content");
      });

      test('Invalid binary content throws error', async () => {
        const doc = new opensig.Document(mockNetwork, sampleHash);
        await doc.verify();
        await expect(doc.sign({ type: 'binary', content: 123, encrypted: true }))
          .rejects.toThrow("invalid data content");
      });

      test('Missing binary content throws error', async () => {
        const doc = new opensig.Document(mockNetwork, sampleHash);
        await doc.verify();
        await expect(doc.sign({ type: 'binary', encrypted: true }))
          .rejects.toThrow("invalid data content");
      });

      test('Invalid hex string throws error', async () => {
        const doc = new opensig.Document(mockNetwork, sampleHash);
        await doc.verify();
        await expect(doc.sign({ type: 'binary', content: '0xabcdef0g', encrypted: true }))
          .rejects.toThrow("invalid data content");
      });

      test('Invalid data encrypted flag throws error', async () => {
        const doc = new opensig.Document(mockNetwork, sampleHash);
        await doc.verify();
        await expect(doc.sign({ type: 'string', content: 'hello', encrypted: "invalid" }))
          .rejects.toThrow("invalid data encrypted flag");
      });

    });

    test('Document throws if signed without verification', async () => {
      const doc = new opensig.Document(mockNetwork, sampleHash);
      await expect(doc.sign()).rejects.toThrow("Document must be verified before signing");
    });

    test('Document encryption key is the document hash', async () => {
      const doc = new opensig.Document(mockNetwork, sampleHash);
      await doc.verify();
      expect(doc.encryptionKey.key).toEqual(sampleHash);
    });

    test('Document can sign after verification', async () => {
      const doc = new opensig.Document(mockNetwork, sampleHash);
      await doc.verify();
      const result = await doc.sign({ type: 'string', content: 'hello', encrypted: true });
      expect(result.txHash).toBe('0x123');
      expect(mockNetwork.publishSignature).toHaveBeenCalled();
    });

    test('Unsigned document signs with first signature', async () => {
      const doc = new opensig.Document(mockNetwork, sampleHash);
      await doc.verify();
      expect(doc.hashIterator.currentIndex()).toBe(-1);
      expect(mockNetwork.querySignatures.mock.calls[0][0].length).toBe(10);
      const result = await doc.sign({ type: 'string', content: 'hello', encrypted: true });
      expect(result.txHash).toBe('0x123');
      expect(mockNetwork.publishSignature).toHaveBeenCalled();
      expect(doc.hashIterator.currentIndex()).toBe(0);
      expect(bytesToHex(doc.hashIterator.indexAt(0)).length).toBe(66);
      expect(mockNetwork.publishSignature.mock.calls[0][0]).toEqual(bytesToHex(doc.hashIterator.indexAt(0)));
    });

    test('Signed document signs with next available signature', async () => {
      const doc = new opensig.Document(mockNetwork, sampleHash);
      await doc.verify();
      const result1 = await doc.sign({ type: 'string', content: 'hello', encrypted: true });
      expect(result1.txHash).toBe('0x123');
      expect(doc.hashIterator.currentIndex()).toBe(0);
      expect(bytesToHex(doc.hashIterator.indexAt(0)).length).toBe(66);
      const result2 = await doc.sign({ type: 'string', content: 'world', encrypted: true });
      expect(result2.txHash).toBe('0x123');
      expect(mockNetwork.publishSignature).toHaveBeenCalled();
      expect(mockNetwork.publishSignature.mock.calls.length).toBe(2);
      expect(mockNetwork.publishSignature.mock.calls[0][0]).toEqual(bytesToHex(doc.hashIterator.indexAt(0)));
      expect(mockNetwork.publishSignature.mock.calls[1][0]).toEqual(bytesToHex(doc.hashIterator.indexAt(1)));
      expect(bytesToHex(doc.hashIterator.indexAt(0))).not.toEqual(bytesToHex(doc.hashIterator.indexAt(1)));
      expect(doc.hashIterator.currentIndex()).toBe(1);
    });

    test('Passing no data signs with empty hex', async () => {
      const doc = new opensig.Document(mockNetwork, sampleHash);
      await doc.verify();
      const result = await doc.sign();
      expect(result.txHash).toBe('0x123');
      expect(mockNetwork.publishSignature).toHaveBeenCalled();
      expect(mockNetwork.publishSignature.mock.calls[0][1]).toEqual("0x");
    });

    test('Passing data type "none" signs with empty hex', async () => {
      const doc = new opensig.Document(mockNetwork, sampleHash);
      await doc.verify();
      const result = await doc.sign({type: 'none', content: 'hello world', encrypted: false});
      expect(result.txHash).toBe('0x123');
      expect(mockNetwork.publishSignature).toHaveBeenCalled();
      expect(mockNetwork.publishSignature.mock.calls[0][1]).toEqual("0x");
    });

    test('Passing empty content signs with empty hex', async () => {
      const doc = new opensig.Document(mockNetwork, sampleHash);
      await doc.verify();
      const result = await doc.sign({type: 'string', content: '', encrypted: false});
      expect(result.txHash).toBe('0x123');
      expect(mockNetwork.publishSignature).toHaveBeenCalled();
      expect(mockNetwork.publishSignature.mock.calls[0][1]).toEqual("0x");
    });

    test('Document cannot be signed while signing is in progress', async () => {
      const doc = new opensig.Document(mockNetwork, sampleHash);
      await doc.verify();
      mockNetwork.publishSignature.mockImplementationOnce(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              txHash: '0x123',
              signatory: '0xabc',
              signature: '0xsig',
              confirmationInformer: Promise.resolve('confirmed'),
            });
          }, 100);
        });
      });
      const promise1 = doc.sign({ type: 'string', content: 'hello', encrypted: true });
      expect(doc.sign({ type: 'string', content: 'world', encrypted: true }))
        .rejects.toThrow("Signing already in progress");
      const result1 = await promise1;
      expect(result1.txHash).toBe('0x123');
      expect(mockNetwork.publishSignature).toHaveBeenCalled();
      expect(mockNetwork.publishSignature.mock.calls.length).toBe(1);
      expect(mockNetwork.publishSignature.mock.calls[0][0]).toEqual(bytesToHex(doc.hashIterator.indexAt(0)));
      expect(doc.hashIterator.currentIndex()).toBe(0);
    });

    test('Failed signature publish throws error and can be tried again', async () => {
      const doc = new opensig.Document(mockNetwork, sampleHash);
      await doc.verify();
      mockNetwork.publishSignature.mockImplementationOnce(() => {
        return Promise.reject(new Error("Failed to publish signature"));
      });
      await expect(doc.sign({ type: 'string', content: 'hello', encrypted: true }))
        .rejects.toThrow("Failed to publish signature");
      expect(mockNetwork.publishSignature).toHaveBeenCalled();
      expect(mockNetwork.publishSignature.mock.calls.length).toBe(1);
      expect(mockNetwork.publishSignature.mock.calls[0][0]).toEqual(bytesToHex(doc.hashIterator.indexAt(0)));
      expect(doc.hashIterator.currentIndex()).toBe(-1);
      const result = await doc.sign({ type: 'string', content: 'hello', encrypted: true });
      expect(result.txHash).toBe('0x123');
      expect(mockNetwork.publishSignature).toHaveBeenCalled();
      expect(mockNetwork.publishSignature.mock.calls.length).toBe(2);
      expect(mockNetwork.publishSignature.mock.calls[1][0]).toEqual(bytesToHex(doc.hashIterator.indexAt(0)));
      expect(doc.hashIterator.currentIndex()).toBe(0);
    });


    describe('Annotations', () => {

      test('Data is published as hex string', async () => {
        const doc = new opensig.Document(mockNetwork, sampleHash);
        await doc.verify();
        await doc.sign({ type: 'string', content: 'hello', encrypted: true });
        expect(mockNetwork.publishSignature).toHaveBeenCalled();
        expect(mockNetwork.publishSignature.mock.calls[0][1]).toMatch(/0x[a-fA-F0-9]+/);
        expect(mockNetwork.publishSignature.mock.calls[0][1].length % 2).toBe(0); // even number of hex digits
      });

      test('Data version is 0x00', async () => {
        const doc = new opensig.Document(mockNetwork, sampleHash);
        await doc.verify();
        await doc.sign({ type: 'string', content: 'hello', encrypted: true });
        expect(mockNetwork.publishSignature).toHaveBeenCalled();
        const data = mockNetwork.publishSignature.mock.calls[0][1];
        expect(data.slice(0, 2)).toEqual("0x");
        expect(data.slice(2, 4)).toEqual(OPENSIG_PROTOCOL_CONSTANTS.SIGNATURE_DATA_VERSION);
      });

      test('Unencrypted annotation is published plaintext unicode', async () => {
        const doc = new opensig.Document(mockNetwork, sampleHash);
        await doc.verify();
        await doc.sign({ type: 'string', content: 'hello', encrypted: false });
        expect(mockNetwork.publishSignature).toHaveBeenCalled();
        const data = mockNetwork.publishSignature.mock.calls[0][1];
        expect(data.slice(0, 2)).toEqual("0x");
        expect(data.slice(2, 4)).toEqual(OPENSIG_PROTOCOL_CONSTANTS.SIGNATURE_DATA_VERSION);
        expect(data.slice(4, 6)).toEqual(OPENSIG_PROTOCOL_CONSTANTS.SIGNATURE_DATA_UNENCRYPTED_STRING);
        const annotation = data.slice(6);
        const expectedAnnotation = bytesToHex(encodeUTF16BE("hello")).slice(2);
        expect(annotation).toEqual(expectedAnnotation);
      });

      test('Unencrypted binary annotation is published without encryption', async () => {
        const doc = new opensig.Document(mockNetwork, sampleHash);
        await doc.verify();
        const binaryData = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
        await doc.sign({ type: 'binary', content: bytesToHex(binaryData), encrypted: false });
        expect(mockNetwork.publishSignature).toHaveBeenCalled();
        const data = mockNetwork.publishSignature.mock.calls[0][1];
        expect(data.slice(0, 2)).toEqual("0x");
        expect(data.slice(2, 4)).toEqual(OPENSIG_PROTOCOL_CONSTANTS.SIGNATURE_DATA_VERSION);
        expect(data.slice(4, 6)).toEqual(OPENSIG_PROTOCOL_CONSTANTS.SIGNATURE_DATA_UNENCRYPTED_BINARY);
        const annotation = data.slice(6);
        const expectedAnnotation = bytesToHex(binaryData, false);
        expect(annotation).toEqual(expectedAnnotation);
      });

      test('Encrypted annotation string is encrypted with the document hash', async () => {
        const doc = new opensig.Document(mockNetwork, sampleHash);
        await doc.verify();
        await doc.sign({ type: 'string', content: 'hello', encrypted: true });
        expect(mockNetwork.publishSignature).toHaveBeenCalled();
        const data = mockNetwork.publishSignature.mock.calls[0][1];
        expect(data.slice(0, 2)).toEqual("0x");
        expect(data.slice(2, 4)).toEqual(OPENSIG_PROTOCOL_CONSTANTS.SIGNATURE_DATA_VERSION);
        expect(data.slice(4, 6)).toEqual(OPENSIG_PROTOCOL_CONSTANTS.SIGNATURE_DATA_ENCRYPTED_STRING);
        const annotation = data.slice(6);
        // Encrypted data field is concat(nonce, encrypted-data) where nonce is 12 random bytes
        const nonce = hexToBytes(annotation).slice(0,12);
        const expectedAnnotation = await aesgcmEncrypt(sampleHash, nonce, encodeUTF16BE("hello"));
        expect(annotation).toEqual(bytesToHex(expectedAnnotation, false));
      });
``
      test('Encrypted annotation binary is encrypted with the document hash', async () => {
        const doc = new opensig.Document(mockNetwork, sampleHash);
        await doc.verify();
        const binaryData = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
        await doc.sign({ type: 'binary', content: bytesToHex(binaryData), encrypted: true });
        expect(mockNetwork.publishSignature).toHaveBeenCalled();
        const data = mockNetwork.publishSignature.mock.calls[0][1];
        expect(data.slice(0, 2)).toEqual("0x");
        expect(data.slice(2, 4)).toEqual(OPENSIG_PROTOCOL_CONSTANTS.SIGNATURE_DATA_VERSION);
        expect(data.slice(4, 6)).toEqual(OPENSIG_PROTOCOL_CONSTANTS.SIGNATURE_DATA_ENCRYPTED_BINARY);
        const annotation = data.slice(6);
        // Encrypted data field is concat(nonce, encrypted-data) where nonce is 12 random bytes
        const nonce = hexToBytes(annotation).slice(0,12);
        const encryptedData = await aesgcmEncrypt(sampleHash, nonce, binaryData);
        expect(annotation).toEqual(bytesToHex(encryptedData, false));
      });

    });  // End of Annotations

  });  // End of Signing

});

