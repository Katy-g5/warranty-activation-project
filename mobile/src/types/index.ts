export interface User {
  id: number;
  username: string;
  token: string;
}

export enum WarrantyStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MANUAL_REVIEW = 'manual_review'
}

// Define the invoice file format used throughout the application
export interface InvoiceFile {
  uri: string;
  name: string;
  type: string;
}

export interface Warranty {
  // must
  customerName: string;
  customerPhone: string;
  productName: string;
  installationDate: string;
  invoice: InvoiceFile;

  // optional
  id?: number;
  invoiceDate?: string;
  invoiceName?: string;
  invoiceType?: string;
  invoiceUrl?: string;
  status?: WarrantyStatus;
  createdAt?: Date;
  updatedAt?: Date;
  userId?: number;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface WarrantyState {
  warranties: Warranty[];
  isLoading: boolean;
  error: string | null;
}
