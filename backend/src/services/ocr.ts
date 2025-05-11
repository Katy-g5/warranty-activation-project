import fs from 'fs';
import { addDays, subDays, isWithinInterval, parseISO } from 'date-fns';
import env from '../config/env';
import { WarrantyStatus } from '../models/Warranty';
import Veryfi from '@veryfi/veryfi-sdk';

const veryfiClient = new Veryfi(
  env.veryfi.clientId,
  env.veryfi.clientSecret,
  env.veryfi.username,
  env.veryfi.apiKey
);

/**
 * Extract invoice date from invoice image using OCR
 * @param filePath Path to the invoice image file
 * @returns Extracted date in ISO format or null if extraction failed
 */
export const extractInvoiceDate = async (filePath: string): Promise<string | null> => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return null;
    }

    const response = await veryfiClient.process_document(filePath);

    // Try to extract the invoice date
    let dateStr = response.date;
    if (typeof dateStr !== 'string' || !dateStr) return null;
    
    let parsedDate;
    try {
      parsedDate = parseISO(dateStr);
      if (isNaN(parsedDate.getTime())) return null;
      // Return in YYYY-MM-DD format
      return parsedDate.toISOString().slice(0, 10);
    } catch (e) {
      return null;
    }
  } catch (error) {
    console.error('Error in OCR processing:', error);
    return null;
  }
};

/**
 * Determine warranty status based on installation date and invoice date
 * @param installationDate Installation date (string in ISO format)
 * @param invoiceDate Invoice date (string in ISO format)
 * @returns Warranty status (approved, rejected, or manual_review)
 */
export const determineWarrantyStatus = (
  installationDate: string | Date,
  invoiceDate: string | null
): WarrantyStatus => {
  if (!invoiceDate) {
    return WarrantyStatus.MANUAL_REVIEW;
  }

  console.log('installationDate', installationDate); // 2025-05-08T11:44:36.075Z
  console.log('invoiceDate', invoiceDate); // 2025-04-28
  // error:
  // Error in date validation: TypeError: dateString.split is not a function
  try {
    const installDate = parseISO(
      typeof installationDate === 'string' ? installationDate : installationDate.toISOString()
    );
    
    const invDate = parseISO(invoiceDate);

    console.log('installDate (parseISO)', installDate);
    console.log('invDate (parseISO)', invDate);
    
    const validRange = {
      start: subDays(installDate, env.warrantyDateWindow),
      end: addDays(installDate, env.warrantyDateWindow),
    };
    
    if (isWithinInterval(invDate, validRange)) {
      return WarrantyStatus.APPROVED;
    } else {
      return WarrantyStatus.REJECTED;
    }
  } catch (error) {
    console.error('Error in date validation:', error);
    return WarrantyStatus.MANUAL_REVIEW;
  }
}; 