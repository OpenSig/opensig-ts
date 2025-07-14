// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//

/**
 * OpenSig ID utilities for converting between Ethereum addresses and OpenSig IDs.
 * 
 * Forms of OpenSig ID. If chain-id is not specified, defaults to 137 (Polygon):
 *   - `did:os:[chain-id:]<base58-encoded-address>`    - default id on Polygon (chain 137)
 *   - `did:os:[chain-id:]<base64url-encoded-address>` - short id
 *   - `did:os:[chain-id:]0x<address>`                 - raw id (hex address)
 *   - `did:pkh:eip155:[chain-id]:<address>`           - EIP-155 PKH id
 */

import { base58, base64url } from '@scure/base';
import { ethers } from 'ethers';

export type OpenSigIdType = 'address' | 'default' | 'short' | 'raw' | 'pkh:eip155' | 'caip10';

/**
 * Constructs an OpenSig ID from an Ethereum address.
 * 
 * @param address the Ethereum address to convert
 * @param type the type of OpenSig ID to return = 'address' | 'default' | 'short' | 'raw' | 'pkh:eip155' | 'caip10'
 * @param chain the chain ID (default is 137 for Polygon)
 * @returns the OpenSig DID string or the empty string if the address is invalid
 * @throws Error if the type is not supported
 */
export function toOpenSigId(address: string, type: OpenSigIdType = 'default', chain: number = 137): string {
  if (!_isAddress(address)) return '';

  address = ethers.getAddress(address.toLowerCase()); // Normalize address to checksum format

  const method = chain === 137 ? 'os' : `os:${chain}`;

  switch (type) {
    case 'address':
      return address;
    case 'default':
      return `did:${method}:${_encodeAddressToBase58(address)}`;
    case 'short':
      return `did:${method}:${_encodeAddressToBase64Url(address)}`;
    case 'raw':
      return `did:${method}:${address}`;
    case 'pkh:eip155':
      return `did:pkh:eip155:${chain}:${address}`;
    case 'caip10':
      return `eip155:${chain}:${address}`;
    default:
      throw new Error(`Unknown OpenSig ID type: ${type}`);
  }
}


/**
 * Converts an OpenSig ID - in any valid format - to an Ethereum address.
 * @param osId the OpenSig ID to convert
 * @returns the Ethereum address and chain id
 * @throws Error if the OpenSig ID format is invalid
 */
export function idToAddress(osId: string): {address: string, chain: number} {
  return _resolveOpenSigId(osId, 'address');
}

/**
 * Converts one form of OpenSig ID to another.
 * @param osId the OpenSig ID to convert
 * @param to the type to convert to = 'address' | 'default' | 'short' | 'raw' | 'pkh:eip155'
 * @returns the converted OpenSig ID
 * @throws Error if the OpenSig ID format is invalid
 */
export function convertOpenSigId(osId: string, to: OpenSigIdType): string {
  const {address, chain} = _resolveOpenSigId(osId, to);
  return toOpenSigId(address, to, chain);
}

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

function _resolveOpenSigId(osId: string, to: OpenSigIdType): {address: string, chain: number} {
  let chain = 137;
  let address: string;

  if (_isAddress(osId)) {
    address = osId;
  } 
  else if (osId.startsWith('eip155:')) {
    const parts = osId.split(':');
    if (parts.length !== 3 || isNaN(Number(parts[1])) || !_isAddress(parts[2])) {
      throw new Error("Invalid eip155 format");
    }
    chain = Number(parts[1]);
    address = parts[2];
  } 
  else if (osId.startsWith('did:pkh:eip155:')) {
    const parts = osId.split(':');
    if (parts.length !== 5 || isNaN(Number(parts[3])) || !_isAddress(parts[4])) {
      throw new Error("Invalid PKH OpenSig ID format");
    }
    chain = Number(parts[3]);
    address = parts[4];
  } 
  else if (osId.startsWith('did:os:')) {
    const parts = osId.split(':');
    if (parts.length < 3 || parts.length > 4) {
      throw new Error("Invalid OpenSig ID format");
    }

    const chainPart = parts.length === 3 ? 137 : Number(parts[2]);
    const encoded = parts.length === 3 ? parts[2] : parts[3];

    if (!chainPart || isNaN(Number(chainPart))) {
      throw new Error("Invalid chain ID in OpenSig ID");
    }

    chain = Number(chainPart);
    address = _decodeEncodedAddress(encoded);
  } 
  else {
    throw new Error("Unknown OpenSig ID format");
  }

  return {address, chain};
}

function _isAddress(address: string): boolean {
  return addressRegex.test(address);
}

function _encodeAddressToBase58(address: string): string {
  return base58.encode(Buffer.from(address.slice(2), 'hex'));
}

function _encodeAddressToBase64Url(address: string): string {
  return base64url.encode(Buffer.from(address.slice(2), 'hex'));
}

function _decodeEncodedAddress(encoded: string): string {
  if (addressRegex.test(encoded)) return encoded;
  const attempts = [base58, base64url];
  for (const encoder of attempts) {
    try {
      const bytes = encoder.decode(encoded);
      if (bytes.length === 20) {
        return `0x${Buffer.from(bytes).toString('hex')}`;
      }
    } catch (_) {
      // try next
    }
  }
  throw new Error("Invalid encoded address");
}

