export interface identifyRequest {
  email: string | null;
  phoneNumber: string | null;
}

export interface identifyResponse {
  primaryContactId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}
