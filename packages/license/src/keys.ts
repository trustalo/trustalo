// Trusted Trustalo Enterprise License public keys.
//
// THESE ARE PUBLIC KEYS ONLY. The corresponding PRIVATE keys are held
// offline by Trustalo and are used to sign customer license tokens.
// NEVER commit a private key to this repository.
//
// Format: each entry is a public-only Ed25519 JWK plus a label.
//
// Production keypair generation and license issuance both happen in
// Trustalo's private admin tooling, not in this repository. To register
// a new production public key here, paste the JWK printed by that
// tooling into the PRODUCTION_PUBLIC_KEYS array below.
//
// Key rotation: add the new public key to the array; do NOT remove old
// keys until every license token signed by them has expired (use the
// optional notAfter field to scope an old key to its window).

import type { TrustedPublicKey } from "./validator.js";

/**
 * PRODUCTION public keys. Customer-issued license tokens must be signed
 * by the private key corresponding to one of these.
 *
 * EMPTY by default — Trustalo MUST populate this before publishing any
 * compiled artifact intended for customer production use. The validator
 * fails closed (`no_trusted_keys`) when this array is empty, so an
 * accidentally-shipped build with no keys cannot grant access.
 */
export const PRODUCTION_PUBLIC_KEYS: TrustedPublicKey[] = [];

/** True if no real production key is configured yet. */
export function noProductionKeysConfigured(): boolean {
  return PRODUCTION_PUBLIC_KEYS.length === 0;
}
