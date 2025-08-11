"use strict";
// 
// Copyright (c) OpenSig and contributors. All rights reserved.
// SPDX-License-Identifier: MIT. See LICENSE file in the project root for details.
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_SIGS_PER_DISCOVERY_ITERATION = exports.SIG_DATA_TYPE_OBJECT = exports.SIG_DATA_TYPE_BYTES = exports.SIG_DATA_TYPE_STRING = exports.SIG_DATA_ENCRYPTED_FLAG = exports.SIG_DATA_VERSION = exports.REGISTRY_ABI = void 0;
/**
 * OpenSig Standard v0.1
 */
exports.REGISTRY_ABI = [{ anonymous: false, inputs: [{ indexed: false, internalType: "uint256", name: "time", type: "uint256" }, { indexed: true, internalType: "address", name: "signer", type: "address" }, { indexed: true, internalType: "bytes32", name: "signature", type: "bytes32" }, { indexed: false, internalType: "bytes", name: "data", type: "bytes" }], name: "Signature", type: "event" }, { inputs: [{ internalType: "bytes32", name: "sig_", type: "bytes32" }], name: "isRegistered", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" }, { inputs: [{ internalType: "bytes32", name: "sig_", type: "bytes32" }, { internalType: "bytes", name: "data_", type: "bytes" }], name: "registerSignature", outputs: [], stateMutability: "nonpayable", type: "function" }];
exports.SIG_DATA_VERSION = '01';
exports.SIG_DATA_ENCRYPTED_FLAG = 128;
exports.SIG_DATA_TYPE_STRING = 0;
exports.SIG_DATA_TYPE_BYTES = 1;
exports.SIG_DATA_TYPE_OBJECT = 2;
/**
 * Maximum number of signatures to search for in each verification query
 */
exports.MAX_SIGS_PER_DISCOVERY_ITERATION = 10;
