import multer from 'multer';
import { Request } from 'express';
import path from 'path';
import env from '../config/env';

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, env.uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate a unique filename: timestamp + original name
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const newFilename = uniqueSuffix + ext;
    
    // Add file information to request for later use with the invoice object
    file.filename = newFilename;
    
    cb(null, newFilename);
  }
});

// File filter to allow only images and PDFs
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only JPEG, JPG, PNG and PDF files are allowed. Received: ${file.mimetype}`));
  }
};

// Configure upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  }
});

export default upload; 