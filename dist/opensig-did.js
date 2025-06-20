import { convertOpenSigId } from './opensig-id';
/**
 * Returns a DID resolver for the `did:os` method, compatible with `did-resolver`.
 */
export function getOpenSigDidResolver() {
    return {
        os: async (did) => {
            try {
                const caip10 = convertOpenSigId(did, 'pkh:eip155').slice(8);
                return {
                    '@context': 'https://w3id.org/did-resolution/v1',
                    didResolutionMetadata: { contentType: 'application/did+json' },
                    didDocumentMetadata: {},
                    didDocument: {
                        '@context': 'https://www.w3.org/ns/did/v1',
                        id: did,
                        verificationMethod: [{
                                id: `${did}#controller`,
                                type: 'EcdsaSecp256k1RecoveryMethod2020',
                                controller: did,
                                blockchainAccountId: caip10
                            }],
                        authentication: [`${did}#controller`]
                    }
                };
            }
            catch (err) {
                return {
                    didResolutionMetadata: { error: 'invalidDid', message: err.message },
                    didDocument: null,
                    didDocumentMetadata: {}
                };
            }
        }
    };
}
