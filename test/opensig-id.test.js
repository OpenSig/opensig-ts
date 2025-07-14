import { 
  toOpenSigId,
  idToAddress,
  convertOpenSigId
} from '../src/opensig-id';

import { base58, base64url } from '@scure/base';

describe('OpenSig ID Utilities', () => {
  const address = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'; // valid checksummed address
  const chain = 137;
  const otherChain = 1;
  const addressNo0x = address.slice(2).toLowerCase();
  const encodedBase58 = base58.encode(Buffer.from(addressNo0x, 'hex'));
  const encodedBase64 = base64url.encode(Buffer.from(addressNo0x, 'hex'));

  const expectedIds = {
    address,
    default: `did:os:${encodedBase58}`,
    short: `did:os:${encodedBase64}`,
    raw: `did:os:${address}`,
    'pkh:eip155': `did:pkh:eip155:${chain}:${address}`,
    caip10: `eip155:${chain}:${address}`,
  };

  const expectedOtherIds = {
    default: `did:os:${otherChain}:${encodedBase58}`,
    short: `did:os:${otherChain}:${encodedBase64}`,
    raw: `did:os:${otherChain}:${address}`,
    'pkh:eip155': `did:pkh:eip155:${otherChain}:${address}`,
    caip10: `eip155:${otherChain}:${address}`,
  };

  describe('toOpenSigId', () => {
    it('converts address to all OpenSig ID types correctly', () => {
      for (const type of Object.keys(expectedIds)) {
        const id = toOpenSigId(address, type, chain);
        expect(id).toBe(expectedIds[type]);
      }
    });

    it('returns empty string for invalid address', () => {
      expect(toOpenSigId('invalid', 'default')).toBe('');
    });

    it('throws error on unsupported type', () => {
      expect(() =>
        toOpenSigId(address, 'unsupported')
      ).toThrow(/Unknown OpenSig ID type/);
    });

    it('returns the correct chain id', () => {
      for (const type of Object.keys(expectedOtherIds)) {
        const id = toOpenSigId(address, type, otherChain);
        expect(id).toBe(expectedOtherIds[type]);
      }
    });
  });

  describe('idToAddress', () => {
    it('parses base58 OpenSig ID correctly', () => {
      const result = idToAddress(expectedIds.default);
      expect(result.address.toLowerCase()).toBe(address.toLowerCase());
      expect(result.chain).toBe(chain);
    });

    it('parses base64url OpenSig ID correctly', () => {
      const result = idToAddress(expectedIds.short);
      expect(result.address.toLowerCase()).toBe(address.toLowerCase());
      expect(result.chain).toBe(chain);
    });

    it('parses raw hex OpenSig ID correctly', () => {
      const result = idToAddress(expectedIds.raw);
      expect(result.address.toLowerCase()).toBe(address.toLowerCase());
      expect(result.chain).toBe(chain);
    });

    it('parses PKH format correctly', () => {
      const result = idToAddress(expectedIds['pkh:eip155']);
      expect(result.address.toLowerCase()).toBe(address.toLowerCase());
      expect(result.chain).toBe(chain);
    });

    it('parses CAIP-10 format correctly', () => {
      const result = idToAddress(expectedIds.caip10);
      expect(result.address.toLowerCase()).toBe(address.toLowerCase());
      expect(result.chain).toBe(chain);
    });

    it('parses plain address format correctly', () => {
      const result = idToAddress(address);
      expect(result.address.toLowerCase()).toBe(address.toLowerCase());
      expect(result.chain).toBe(chain);
    });

    it('parses chain id correctly', () => {
      const result = idToAddress(address);
      expect(result.address.toLowerCase()).toBe(address.toLowerCase());
      expect(result.chain).toBe(chain);
    });

    it('parses chain id correctly', () => {
      for (const id in expectedOtherIds) {
        const result = idToAddress(expectedOtherIds[id]);
        expect(result.address.toLowerCase()).toBe(address.toLowerCase());
        expect(result.chain).toBe(otherChain);
      }
    });
  });

  describe('convertOpenSigId', () => {
    it('converts from base58 to raw format', () => {
      const raw = convertOpenSigId(expectedIds.default, 'raw');
      expect(raw).toBe(expectedIds.raw);
    });

    it('converts from PKH to CAIP-10', () => {
      const caip10 = convertOpenSigId(expectedIds['pkh:eip155'], 'caip10');
      expect(caip10).toBe(expectedIds.caip10);
    });

    it('throws on unknown format', () => {
      expect(() => convertOpenSigId('not-an-id', 'default')).toThrow();
    });

    it('throws on malformed PKH ID', () => {
      expect(() =>
        convertOpenSigId('did:pkh:eip155:xyz:notanaddress', 'default')
      ).toThrow(/Invalid PKH OpenSig ID format/);
    });

    it('throws on malformed CAIP-10 ID', () => {
      expect(() =>
        convertOpenSigId('eip155:notanumber:wrong', 'default')
      ).toThrow(/Invalid eip155 format/);
    });
  });
});
