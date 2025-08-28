export interface EncryptRequest {
  data: string; // Stringified JSON to encrypt
}

export interface EncryptResponse {
  nonce: string;
  ciphertext: string;
  tag: string;
}
