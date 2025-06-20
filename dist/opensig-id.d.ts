export type OpenSigIdType = 'address' | 'default' | 'short' | 'raw' | 'pkh:eip155' | 'caip10';
/**
 * Constructs an OpenSig ID from an Ethereum address.
 * @param address the Ethereum address to convert
 * @param type the type of OpenSig ID to return = 'address' | 'default' | 'short' | 'raw' | 'pkh:eip155' | 'caip10'
 * @param chain the chain ID (default is 137 for Polygon)
 * @returns the OpenSig DID string
 * @throws Error if the address is invalid or the type is unknown
 */
export declare function getOpenSigId(address: string, type?: OpenSigIdType, chain?: number): string;
/**
 * Converts an OpenSig ID - in any valid format - to an Ethereum address.
 * @param osId the OpenSig ID to convert
 * @returns the Ethereum address
 * @throws Error if the OpenSig ID format is invalid
 */
export declare function idToAddress(osId: string): string;
/**
 * Converts one form of OpenSig ID to another.
 * @param osId the OpenSig ID to convert
 * @param to the type to convert to = 'address' | 'default' | 'short' | 'raw' | 'pkh:eip155'
 * @returns the converted OpenSig ID
 * @throws Error if the OpenSig ID format is invalid
 */
export declare function convertOpenSigId(osId: string, to: OpenSigIdType): string;
