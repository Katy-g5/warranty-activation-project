import { Router } from 'express';
import { check } from 'express-validator';
import * as warrantyController from '../controllers/warranty.controller';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import upload from '../utils/upload';
import { WarrantyStatus } from '../models/Warranty';

const router = Router();

const createValidators = [
  check('customerName', 'Customer name is required').not().isEmpty(),
  check('customerPhone', 'Customer phone is required').not().isEmpty(),
  check('productName', 'Product name is required').not().isEmpty(),
  check('installationDate', 'Valid installation date is required').isISO8601().toDate(),
];

/**
 * @swagger
 * /warranties:
 *   post:
 *     summary: Create a new warranty
 *     tags: [Warranties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - customerPhone
 *               - productName
 *               - installationDate
 *               - invoice
 *             properties:
 *               customerName:
 *                 type: string
 *                 description: Name of the customer
 *               customerPhone:
 *                 type: string
 *                 description: Phone number of the customer
 *               productName:
 *                 type: string
 *                 description: Name of the product
 *               installationDate:
 *                 type: string
 *                 format: date
 *                 description: Installation date (YYYY-MM-DD)
 *               invoice:
 *                 type: string
 *                 format: binary
 *                 description: Invoice file (PDF, JPEG, JPG, PNG)
 *     responses:
 *       201:
 *         description: Warranty created successfully
 *       400:
 *         description: Validation error or invoice file missing
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authenticate,
  upload.single('invoice'),
  createValidators,
  warrantyController.createWarranty
);

/**
 * @swagger
 * /warranties:
 *   get:
 *     summary: Get all user's warranties (for normal users)
 *     tags: [Warranties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, manual_review]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of warranties
 *       401:
 *         description: Not authenticated
 */
router.get('/', authenticate, warrantyController.getWarranties);

/**
 * @swagger
 * /warranties/{id}:
 *   get:
 *     summary: Get a warranty by ID
 *     tags: [Warranties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Warranty ID
 *     responses:
 *       200:
 *         description: Warranty details
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Warranty not found
 */
router.get('/:id', authenticate, warrantyController.getWarrantyById);

/**
 * @swagger
 * /warranties/{id}:
 *   patch:
 *     summary: Update warranty status (admin only)
 *     tags: [Warranties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Warranty ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected, manual_review]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Warranty status updated
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 *       404:
 *         description: Warranty not found
 */
const validators = [
  check('status', 'Valid status is required').optional()
    .isIn(Object.values(WarrantyStatus)),
];

router.patch(
  '/:id',
  authenticate,
  authorizeAdmin,
  validators,
  warrantyController.updateWarrantyStatus
);

/**
 * @swagger
 * /warranties/{id}/invoice:
 *   get:
 *     summary: Get invoice file for a warranty
 *     tags: [Warranties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Warranty ID
 *     responses:
 *       200:
 *         description: Invoice file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this warranty
 *       404:
 *         description: Warranty or invoice file not found
 *       500:
 *         description: Server error
 */
router.get('/:id/invoice', authenticate, warrantyController.getInvoiceFile);

export default router; 