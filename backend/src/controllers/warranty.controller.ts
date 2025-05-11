import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Warranty, { WarrantyStatus } from '../models/Warranty';
import { extractInvoiceDate, determineWarrantyStatus } from '../services/ocr';
import path from 'path';

/**
 * Submit a new warranty request
 * @route POST /warranties
 * @access Private
 */
export const createWarranty = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'Invoice file is required.' });
      return;
    }

    const {
      customerName,
      customerPhone,
      productName,
      installationDate,
    } = req.body;

    // Save the warranty with initial status as pending
    const warranty = await Warranty.create({
      customerName,
      customerPhone,
      productName,
      installationDate: new Date(installationDate),
      invoice: {
        uri: req.file.path,
        name: req.file.filename,
        type: req.file.mimetype,
      },
      invoiceUrl: req.file.path,
      status: WarrantyStatus.PENDING,
      userId: req.user.id,
    });

    // Process the invoice using OCR in the background
    processInvoice(warranty.id, req.file.path, installationDate);

    res.status(201).json(warranty);
  } catch (error) {
    console.error("Error creating warranty:", error);
    res.status(500).json({ message: 'Server error creating warranty.' });
  }
};

/**
 * Process invoice file with OCR and update warranty status
 */
const processInvoice = async (warrantyId: number, invoicePath: string, installationDate: string) => {
  try {
    // Extract date from invoice using OCR
    const invoiceDate = await extractInvoiceDate(invoicePath);
    
    // Determine warranty status based on dates
    const status = determineWarrantyStatus(installationDate, invoiceDate);
    
    // Update warranty with invoice date and status
    await Warranty.update(
      {
        invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
        status
      },
      { where: { id: warrantyId } }
    );
    
    console.log(`Warranty #${warrantyId} processed. Status: ${status}`);
  } catch (error) {
    console.error(`Error processing warranty #${warrantyId}:`, error);
    
    await Warranty.update(
      { status: WarrantyStatus.MANUAL_REVIEW },
      { where: { id: warrantyId } }
    );
  }
};

/**
 * Get all warranties (admin: all warranties, user: only their warranties)
 * @route GET /warranties
 * @access Private
 */
export const getWarranties = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    
    // Filter options
    const filter: any = {};
    
    if (!req.user.isAdmin) {
      // For regular users, only show their warranties
      filter.userId = req.user.id;
    } else {
      // there will be userId in params
      filter.userId = req.query.userId;
    }
    
    // Filter by status if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const { count, rows } = await Warranty.findAndCountAll({
      where: filter,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    // Add invoiceUrl to each warranty
    const warranties = rows.map(warranty => ({
      ...warranty.toJSON(),
      invoiceUrl: `/warranties/${warranty.id}/invoice`
    }));

    res.json({
      warranties,
      page,
      totalPages: Math.ceil(count / limit),
      totalItems: count
    });
  } catch (error) {
    console.error('Error fetching warranties:', error);
    res.status(500).json({ message: 'Server error fetching warranties.' });
  }
};

/**
 * Get a single warranty by ID
 * @route GET /warranties/:id
 * @access Private
 */
export const getWarrantyById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    const warranty = await Warranty.findByPk(req.params.id);

    if (!warranty) {
      res.status(404).json({ message: 'Warranty not found.' });
      return;
    }

    // Check if user is authorized to view this warranty
    if (!req.user.isAdmin && warranty.userId !== req.user.id) {
      res.status(403).json({ message: 'Not authorized to view this warranty.' });
      return;
    }

    const warrantyData = {
      ...warranty.toJSON(),
      invoiceUrl: `/warranties/${warranty.id}/invoice`
    };
    
    res.json(warrantyData);
  } catch (error) {
    console.error('Error fetching warranty:', error);
    res.status(500).json({ message: 'Server error fetching warranty.' });
  }
};

/**
 * Update warranty status (admin only)
 * @route PATCH /warranties/:id
 * @access Private/Admin
 */
export const updateWarrantyStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Not authorized to update warranty status.' });
      return;
    }

    const { status } = req.body;

    const warranty = await Warranty.findByPk(req.params.id);

    if (!warranty) {
      res.status(404).json({ message: 'Warranty not found.' });
      return;
    }

    // Update status and notes
    warranty.status = status || warranty.status;
    await warranty.save();

    res.json({
      id: warranty.id,
      status: warranty.status,
      message: 'Warranty status updated successfully.'
    });
  } catch (error) {
    console.error('Error updating warranty status:', error);
    res.status(500).json({ message: 'Server error updating warranty status.' });
  }
};

/**
 * Get invoice file for a warranty
 * @route GET /warranties/:id/invoice
 * @access Private
 */
export const getInvoiceFile = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Serving invoice file-----------------------------------------------")

    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    const warranty = await Warranty.findByPk(req.params.id);

    if (!warranty) {
      res.status(404).json({ message: 'Warranty not found.' });
      return;
    }

    // Check if user is authorized to view this warranty
    if (!req.user.isAdmin && warranty.userId !== req.user.id) {
      res.status(403).json({ message: 'Not authorized to view this warranty.' });
      return;
    }

    if (!warranty.invoice || !warranty.invoice.uri) {
      res.status(404).json({ message: 'Invoice file not found.' });
      return;
    }

    console.log("Serving invoice file-----------------------------------------------", warranty.invoice.uri);
    const filePath = path.resolve(warranty.invoice.uri || warranty.invoiceUrl); // absolute path
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        // Only send error response if headers haven't been sent yet
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error sending invoice file.' });
        }
      }
    });
  } catch (error) {
    console.error('Error retrieving invoice file:', error);
    res.status(500).json({ message: 'Server error retrieving invoice file.' });
  }
}; 