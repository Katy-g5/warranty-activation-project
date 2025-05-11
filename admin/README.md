# Warranty Admin Dashboard

A React Admin dashboard for managing users and warranties.

## Features

- Authentication (Login/Register/Logout)
- User Management
- Warranty Management with status updates
- Protected Routes

## API Endpoints

This admin dashboard connects to the following API endpoints:

- `GET /users` - List all users
- `GET /users/:id` - Get warranties for a specific user
- `PATCH /warranties/:id` - Update warranty status

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```
git clone <repository-url>
```

2. Install dependencies:
```
npm install
```

3. Configure the API URL:
Create a `.env` file in the root directory and add:
```
VITE_API_URL=http://localhost:3000/api
PORT=5173
```

### Running the app

Start the development server:
```
npm run dev
```

The application will be available at http://localhost:5173.

### Building for production

Build the project for production:
```
npm run build
```

The production-ready files will be generated in the `dist` directory.

## Authentication
The admin dashboard uses JWT authentication. During registration, the `isAdmin=true` parameter is sent to ensure the user has admin privileges.