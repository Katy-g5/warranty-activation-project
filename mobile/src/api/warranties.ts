import client from './client';
import { Warranty, InvoiceFile } from '../types';
import { createLogger } from '../utils/logger';

// Create logger for warranty API services
const logger = createLogger('WarrantyAPI');

// Interface for creating a warranty with file upload
export interface CreateWarrantyRequest {
  customerName: string;
  customerPhone: string;
  productName: string;
  installationDate: string;
  invoice: InvoiceFile;
}

export const getWarranties = async () => {
  logger.debug('Fetching all warranties');
  
  try {
    const response = await client.get('/warranties');
    
    // Transform the response to ensure invoice has the correct format
    const warranties = response.data.warranties.map((warranty: Warranty) => {
      // Add invoiceUrl to each warranty
      const warrantyWithUrl = {
        ...warranty,
        invoiceUrl: `/warranties/${warranty.id}/invoice`
      };
      
      if (warrantyWithUrl.invoice) {
        // Ensure invoice has uri, name, and type properties
        // This handles different formats that might come from the backend
        const invoice = warrantyWithUrl.invoice as any;
        
        // If invoice doesn't have the expected format, create it
        if (!invoice.uri || !invoice.name || !invoice.type) {
          logger.debug(`Transforming invoice format for warranty ${warrantyWithUrl.id}`);
          
          // Backend might send a path rather than a complete object
          const invoiceFile: InvoiceFile = {
            uri: typeof invoice === 'string' 
              ? invoice 
              : invoice.uri || invoice.path || `http://localhost:3000/uploads/${invoice.filename || 'unknown'}`,
            name: invoice.name || invoice.filename || 'document',
            type: invoice.type || invoice.mimetype || 'application/octet-stream'
          };
          
          return {
            ...warrantyWithUrl,
            invoice: invoiceFile
          };
        }
      }
      
      return warrantyWithUrl;
    });
    
    logger.debug(`Processed ${warranties.length} warranties`);
    return warranties;
  } catch (error) {
    logger.error('Error fetching warranties:', error);
    return [];
  }
};

export const getWarrantyById = async (id: string)=> {
  logger.debug(`Fetching warranty by ID: ${id}`);
  
  try {
    const response = await client.get<Warranty>(`/warranties/${id}`);
    logger.debug(`Warranty ${id} details retrieved successfully`);
    return response.data;
  } catch (error) {
    logger.error(`Error fetching warranty ${id}:`, error);
    throw error;
  }
};

export const createWarranty = async (warrantyData: CreateWarrantyRequest) => {
  logger.debug('Creating new warranty', { 
    customer: warrantyData.customerName,
    product: warrantyData.productName
  });
  
  // Create a FormData object for multipart/form-data
  const formData = new FormData();
  
  // Add all text fields
  formData.append('customerName', warrantyData.customerName);
  formData.append('customerPhone', warrantyData.customerPhone);
  formData.append('productName', warrantyData.productName);
  formData.append('installationDate', warrantyData.installationDate);
  
  // Add the invoice file with the expected structure for multer
  if (warrantyData.invoice && warrantyData.invoice.uri) {
    logger.debug('Appending invoice file', { 
      name: warrantyData.invoice.name,
      type: warrantyData.invoice.type
    });
    
    const invoiceFile = {
      uri: warrantyData.invoice.uri,
      type: warrantyData.invoice.type,
      name: warrantyData.invoice.name
    };
    
    // Use "as any" because React Native's FormData implementation 
    // has different types than standard FormData
    formData.append('invoice', invoiceFile as any);
  } else {
    logger.warn('No invoice file provided for warranty');
  }

  try {
    // Set the Content-Type header to multipart/form-data for file upload
    const response = await client.post<Warranty>('/warranties', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    logger.info('Warranty created successfully', { id: response.data.id });
    return response.data;
  } catch (error) {
    logger.error('Error creating warranty:', error);
    throw error;
  }
};

/**
 * Fetches the invoice file for a specific warranty
 * Returns a blob that can be handled appropriately
 */
export const getWarrantyInvoice = async (warrantyId: number | string) => {
  logger.debug(`Fetching invoice for warranty ID: ${warrantyId}`);
  
  try {
    // Use responseType 'blob' to get the file as binary data
    const response = await client.get(`/warranties/${warrantyId}/invoice`, {
      responseType: 'blob'
    });
    
    logger.debug('Invoice file fetched successfully');
    return response.data;
  } catch (error) {
    logger.error('Error fetching warranty invoice:', error);
    throw error;
  }
};