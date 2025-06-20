export declare function isHexString(str: string): boolean;
export declare function bytesToHex(arr: Uint8Array, prefix0x?: boolean): string;
export declare function hexToBytes(hex: string): Uint8Array;
export declare function concat(buffers: Uint8Array[]): Uint8Array;
export declare function unicodeStrToHex(str: string): string;
export declare function unicodeHexToStr(str: string): string;
/**
 * Checks if the given object implements the Blob interface.
 * @param obj The object to test.
 * @returns True if the object is a Blob, false otherwise.
 */
export declare function isBlob(obj: any): obj is Blob;
