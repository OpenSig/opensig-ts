/**
 * OpenSig Standard v0.1
 */
export declare const REGISTRY_ABI: ({
    anonymous: boolean;
    inputs: {
        indexed: boolean;
        internalType: string;
        name: string;
        type: string;
    }[];
    name: string;
    type: string;
    outputs?: undefined;
    stateMutability?: undefined;
} | {
    inputs: {
        internalType: string;
        name: string;
        type: string;
    }[];
    name: string;
    outputs: {
        internalType: string;
        name: string;
        type: string;
    }[];
    stateMutability: string;
    type: string;
    anonymous?: undefined;
})[];
export declare const SIG_DATA_VERSION = "00";
export declare const SIG_DATA_ENCRYPTED_FLAG = 128;
export declare const SIG_DATA_TYPE_STRING = 0;
export declare const SIG_DATA_TYPE_BYTES = 1;
/**
 * Maximum number of signatures to search for in each verification query
 */
export declare const MAX_SIGS_PER_DISCOVERY_ITERATION = 10;
