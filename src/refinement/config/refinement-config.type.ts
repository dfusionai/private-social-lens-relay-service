export type RefinementConfig = {
  serviceUrl: string;
  refinerId: number;
  // URL for the TEE to upload refined data back through the relay
  relayUploadUrl: string;
  // Legacy Pinata JWT (kept for backward compatibility during migration)
  pinataJwt?: string;
};
