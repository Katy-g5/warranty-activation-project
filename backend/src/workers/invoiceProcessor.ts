import fs from 'fs/promises';
import path from 'path';
import { extractInvoiceDate, determineWarrantyStatus } from '../services/ocr';
import Warranty, { WarrantyStatus } from '../models/Warranty';
import env from '../config/env';
import { createLogger, format, transports } from 'winston';

// Configure logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'invoice-processor' },
  transports: [
    // Write all logs with level 'info' and below to invoice-processor.log
    new transports.File({ filename: 'logs/invoice-processor-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/invoice-processor.log' }),
    // Also log to console
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf((info) => {
          const { timestamp, level, message, ...rest } = info;
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(rest).length ? JSON.stringify(rest, null, 2) : ''
          }`;
        })
      )
    })
  ]
});

async function processUnprocessedInvoices() {
  try {
    const pendingWarranties = await Warranty.findAll({
      where: { status: WarrantyStatus.PENDING }
    });
    
    logger.info(`Found ${pendingWarranties.length} pending warranties to process`);
    
    // Process each pending warranty
    for (const warranty of pendingWarranties) {
      logger.info(`Processing warranty ID: ${warranty.id}`, { 
        warrantyId: warranty.id,
        productName: warranty.productName
      });
      
      try {
        const invoicePath = warranty.invoice.uri;
        
        // Check if file exists
        try {
          await fs.access(invoicePath);
        } catch (error: any) {
          logger.error(`Invoice file not found for warranty ID: ${warranty.id}`, {
            warrantyId: warranty.id,
            path: invoicePath,
            error: error.message
          });
          continue; // Skip to the next warranty
        }
        
        // Extract invoice date using OCR
        logger.info(`Extracting date from invoice for warranty ID: ${warranty.id}`, {
          warrantyId: warranty.id,
          path: invoicePath
        });
        
        const invoiceDate = await extractInvoiceDate(invoicePath);
        logger.info(`Extracted date from invoice: ${invoiceDate}`, {
          warrantyId: warranty.id,
          invoiceDate
        });
        
        // Determine warranty status based on dates
        const newStatus = determineWarrantyStatus(warranty.installationDate.toISOString(), invoiceDate);
        logger.info(`Determined warranty status: ${newStatus}`, {
          warrantyId: warranty.id,
          status: newStatus,
          invoiceDate,
          installationDate: warranty.installationDate
        });
        
        // Update warranty with invoice date and status
        await Warranty.update(
          {
            invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
            status: newStatus
          },
          { where: { id: warranty.id } }
        );
        
        logger.info(`Successfully updated warranty ID: ${warranty.id} with status: ${newStatus}`, {
          warrantyId: warranty.id,
          status: newStatus
        });
      } catch (error: any) {
        logger.error(`Error processing warranty ID: ${warranty.id}`, {
          warrantyId: warranty.id,
          error: error.message,
          stack: error.stack
        });
        
        // Mark for manual review on error
        await Warranty.update(
          { status: WarrantyStatus.MANUAL_REVIEW },
          { where: { id: warranty.id } }
        );
        
        logger.info(`Set warranty ID: ${warranty.id} for manual review due to processing error`, {
          warrantyId: warranty.id
        });
      }
    }
  } catch (error: any) {
    logger.error('Failed to fetch or process warranties', {
      error: error.message,
      stack: error.stack
    });
  }
  
  logger.info('Completed processing unprocessed invoices');
}

async function scanUploadsFolder() {
  logger.info('Scanning uploads folder for unprocessed files');
  
  try {
    const uploadPath = env.uploadDir;
    const files = await fs.readdir(uploadPath);
    
    logger.info(`Found ${files.length} files in uploads folder`);
    
    // Get all processed invoice filenames
    const warranties = await Warranty.findAll();
    const processedFiles = new Set(
      warranties
        .filter(w => w.invoice && w.invoice.name)
        .map(w => w.invoice.name)
    );
    
    logger.info(`${processedFiles.size} files are already linked to warranties`);
    
    // Find unprocessed files
    const unprocessedFiles = files.filter(file => !processedFiles.has(file));
    
    logger.info(`Found ${unprocessedFiles.length} unprocessed files: ${unprocessedFiles.join(', ')}`);
    
    // Process unlinked files if needed (for debugging)
    for (const file of unprocessedFiles) {
      const filePath = path.join(uploadPath, file);
      
      try {
        logger.info(`Attempting OCR on unlinked file: ${file}`);
        const invoiceDate = await extractInvoiceDate(filePath);
        logger.info(`Successfully extracted date from unlinked file: ${file}`, { 
          fileName: file,
          invoiceDate
        });
      } catch (error: any) {
        logger.error(`Failed to process unlinked file: ${file}`, {
          fileName: file,
          error: error.message,
          stack: error.stack
        });
      }
    }
  } catch (error: any) {
    logger.error('Error scanning uploads directory', {
      error: error.message,
      stack: error.stack
    });
  }
}

// Main function to run the worker
async function run() {
  logger.info('Invoice processor worker started');
  
  try {
    // Create logs directory if it doesn't exist
    try {
      await fs.mkdir('logs');
      logger.info('Created logs directory');
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        logger.error('Failed to create logs directory', {
          error: error.message
        });
      }
    }
    
    // Process pending warranties
    await processUnprocessedInvoices();
    
    // Scan uploads folder for any files not linked to warranties
    await scanUploadsFolder();
    
    logger.info('Invoice processor worker completed successfully');
  } catch (error: any) {
    logger.error('Invoice processor worker encountered a fatal error', {
      error: error.message,
      stack: error.stack
    });
  }
}

// Run if this script is executed directly
if (require.main === module) {
  run()
    .then(() => {
      logger.info('Worker execution complete');
      process.exit(0);
    })
    .catch((error: any) => {
      logger.error('Worker execution failed', {
        error: error.message,
        stack: error.stack
      });
      process.exit(1);
    });
}

export { run, processUnprocessedInvoices, scanUploadsFolder }; 