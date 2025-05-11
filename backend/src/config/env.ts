import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export default {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // Veryfi API credentials
  veryfi: {
    clientId: process.env.VERYFI_CLIENT_ID || '',
    clientSecret: process.env.VERYFI_CLIENT_SECRET || '',
    username: process.env.VERYFI_USERNAME || '',
    apiKey: process.env.VERYFI_API_KEY || '',
  },

  // Warranty date window (days)
  warrantyDateWindow: parseInt(process.env.WARRANTY_DATE_WINDOW || '21'),

  // Upload directory
  uploadDir: path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads'),

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'warranty_db'
  }
};