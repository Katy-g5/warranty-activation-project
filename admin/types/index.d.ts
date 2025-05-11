// User interface
interface User {
  id: string | number;
  username: string;
  isAdmin: boolean;
}

// Invoice interface
interface Invoice {
  uri: string;
  name: string;
  type: string;
}

type WarrantyStatus = 'pending' | 'approved' | 'rejected' | 'manual_review';
// Warranty interface
interface Warranty {
  id: number;
  userId: number;
  customerName: string;
  customerPhone: string;
  installationDate: Date;
  invoiceDate?: Date;
  productName: string;
  status: WarrantyStatus;
  documentUrl?: string;
  invoiceUrl?: string;
  invoice?: Invoice;
  createdAt: string;
  updatedAt?: string;
}

// Auth params
interface LoginParams {
  username: string;
  password: string;
}

interface RegisterParams {
  username: string;
  password: string;
  isAdmin: boolean;
}

// Declare modules for which we don't have types
declare module 'react-admin';
declare module '@mui/material';
declare module '@mui/icons-material/*';
declare module 'recharts'; 