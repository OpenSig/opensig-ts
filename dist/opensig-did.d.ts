import type { DIDResolver } from 'did-resolver';
/**
 * Returns a DID resolver for the `did:os` method, compatible with `did-resolver`.
 */
export declare function getOpenSigDidResolver(): Record<string, DIDResolver>;
