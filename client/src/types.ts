export interface DocumentData {
  documentType: string;
  extractedData: {
    surname?: string;
    givenName?: string;
    fullName?: string;
    dateOfBirth?: string;
    expiryDate?: string;
    issueDate?: string;
    passportNumber?: string;
    idNumber?: string;
    licenseNumber?: string;
    licenseType?: string;
    nationality?: string;
  };
  confidence: number;
  rawText?: string;
}

export interface FormData {
  surname: string;
  givenName: string;
  fullName: string;
  dateOfBirth: string;
  expiryDate: string;
  issueDate: string;
  documentNumber: string;
  nationality: string;
  additionalInfo: string;
}

export type DocumentType = 'passport' | 'nationalId' | 'license'; 