"""Optional VQX envelopes. Encoding is not encryption."""

from __future__ import annotations

import hashlib
import hmac
import os


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def hmac_sha256(key: bytes, data: bytes) -> bytes:
    return hmac.new(key, data, hashlib.sha256).digest()


def encrypt_aes256_gcm(key: bytes, plaintext: bytes, aad: bytes = b""):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    if len(key) != 32:
        raise ValueError("AES-256-GCM key must be 32 bytes")
    iv = os.urandom(12)
    aes = AESGCM(key)
    packed = aes.encrypt(iv, plaintext, aad if aad else None)
    return {"iv": iv, "ciphertext": packed[:-16], "tag": packed[-16:]}


def decrypt_aes256_gcm(key: bytes, iv: bytes, ciphertext: bytes, tag: bytes, aad: bytes = b""):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    aes = AESGCM(key)
    return aes.decrypt(iv, ciphertext + tag, aad if aad else None)


def generate_ed25519():
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

    private = Ed25519PrivateKey.generate()
    return private, private.public_key()


def sign_ed25519(private_key, data: bytes) -> bytes:
    return private_key.sign(data)


def verify_ed25519(public_key, data: bytes, signature: bytes) -> bool:
    from cryptography.exceptions import InvalidSignature

    try:
        public_key.verify(signature, data)
        return True
    except InvalidSignature:
        return False
