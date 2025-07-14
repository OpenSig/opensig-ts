"use strict";
// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertIBlockchainProvider = assertIBlockchainProvider;
/**
 * Asserts that the provided object is a valid IBlockchainProvider.
 * @param obj The object to check.
 */
function assertIBlockchainProvider(obj) {
    if (!obj || typeof obj.querySignatures !== 'function' || typeof obj.publishSignature !== 'function') {
        throw new TypeError('provider is not a valid IBlockchainProvider');
    }
}
