/**
 * Returns a DID resolver for the `did:os` method, compatible with the `did-resolver` library.
 */
export declare function getOpenSigDidResolver(): {
    os: (did: string) => Promise<{
        '@context': string;
        didResolutionMetadata: {
            contentType: string;
            error?: undefined;
            message?: undefined;
        };
        didDocumentMetadata: {};
        didDocument: {
            '@context': string;
            id: string;
            verificationMethod: {
                id: string;
                type: string;
                controller: string;
                blockchainAccountId: string;
            }[];
            authentication: string[];
        };
    } | {
        didResolutionMetadata: {
            error: string;
            message: string;
            contentType?: undefined;
        };
        didDocument: null;
        didDocumentMetadata: {};
        '@context'?: undefined;
    }>;
};
