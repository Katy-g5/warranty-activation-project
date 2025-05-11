# Warranty Activation System Backend

A Node.js Express backend server that handles product warranty registration, OCR processing, and administration.

## Features

- **User Authentication**: JWT-based authentication for installers and admins
- **Warranty Management**: Submit, track, and approve warranty requests
- **OCR Processing**: Automated invoice date extraction using Veryfi API
- **Admin Dashboard**: User management and warranty request processing
- **RESTful API**: Well-documented API with Swagger

## Requirements

- Node.js (14+)
- PostgreSQL
- Veryfi API Credentials

## Setup

1. Clone the repository

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=warranty_db
DB_USER=[postgres-user]
DB_PASSWORD=[postgres-password]

# Veryfi API
VERYFI_CLIENT_ID=[your_veryfi_client_id]
VERYFI_CLIENT_SECRET=[your_veryfi_client_secret]
VERYFI_USERNAME=[your_veryfi_username]
VERYFI_API_KEY=[your_veryfi_api_key]

# Warranty date window (days)
WARRANTY_DATE_WINDOW=21

# Upload directories
UPLOAD_DIR=uploads
```

4. Create the PostgreSQL database
```bash
psql -U postgres
CREATE DATABASE warranty_db;
\q
```

Note: change the following line in index.ts line 42:
await syncDatabase(true); <-- change to "false" to not force database sync every time the server loads.

5. Build and run the server
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

6. Access Swagger documentation at `http://localhost:3000/api-docs`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new installer
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/profile` - Get current user profile

### Warranties
- `POST /api/warranties` - Submit warranty request
- `GET /api/warranties` - List warranties (user: own, admin: for requested user)
- `GET /api/warranties/:id` - Get warranty details
- `PATCH /api/warranties/:id` - Update warranty status (admin only)
- `GET /api/warranties/:id/invoice` - Get the file for the warranty

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user with warranties (admin only)

## OCR Invoice Processing

The system uses Veryfi API to extract dates from invoice images. The process is:

1. User uploads invoice with warranty request
2. System saves request with status = "pending"
3. OCR processes invoice to extract date
4. Status is updated automatically:
   - "approved": Invoice date within ±21 days of installation (configurable via WARRANTY_DATE_WINDOW)
   - "rejected": Date out of range
   - "manual_review": OCR parsing failed

## Invoice Processing Worker

The system includes a dedicated worker script to process invoice uploads in the background:

```bash
npm run process-invoices
```

This script:
- Processes all pending warranties with uploaded invoices
- Extracts dates from invoices using OCR
- Updates warranty status automatically based on date validation
- Scans upload directory for any unprocessed files
- Logs all operations to the `logs` directory

You can run this script:
- Manually when needed
- As a scheduled task through cron (Linux/Mac) or Task Scheduler (Windows)
- As part of your CI/CD pipeline

## License

MIT 