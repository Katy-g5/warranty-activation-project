# AC Warranty Mobile App

## Overview

The AC Warranty Mobile App is a React Native application that allows installers to register warranty activations for AC units. The app provides a simple and efficient way for installers to manage warranty registrations for their customers.

## Features

- **User Authentication**
  - Register with username and password
  - Login with existing credentials
  - Secure token-based authentication

- **Warranty Management**
  - Create new warranty activations
  - View list of submitted warranties
  - Track warranty status (Pending, Approved, Rejected, Manual Review)

- **Profile Management**
  - View personal profile information
  - See warranty submission statistics
  - Secure logout functionality

## Technology Stack

- **Frontend**: React Native, TypeScript
- **UI Components**: React Native Paper
- **Navigation**: React Navigation
- **State Management**: React Context API
- **API Communication**: Axios
- **Storage**: AsyncStorage for token persistence

## Installation

1. Clone the repository:
   ```bash
   git clone [repository]
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the API endpoint:
   - Open `src/api/client.ts` and set the `API_URL` to match your backend server
   - By default, it connects to `http://10.0.0.8:3000/api`

4. Start the application:
   ```bash
   npm start
   ```

## API Endpoints

The app communicates with the following backend endpoints:

- **Authentication**
  - `POST /api/auth/login` - User login
  - `POST /api/auth/register` - User registration
  - `GET /api/auth/profile` - Get current user profile

- **Warranties**
  - `GET /api/warranties` - Get all warranties
  - `GET /api/warranties/:id` - Get warranty by ID
  - `POST /api/warranties` - Create new warranty

## Project Structure

```
src/
├── api/                  # API service functions
│   ├── auth.ts           # Authentication API
│   ├── client.ts         # Axios client setup
│   └── warranties.ts     # Warranty API
├── context/              # React Context providers
│   ├── AuthContext.tsx   # Authentication state management
│   └── WarrantyContext.tsx # Warranty state management
├── screens/              # Application screens
│   ├── HomeScreen.tsx    # Main dashboard
│   ├── LoginScreen.tsx   # User login
│   ├── ProfileScreen.tsx # User profile
│   ├── RegisterScreen.tsx # User registration
│   ├── WarrantiesListScreen.tsx # List of warranties
│   └── WarrantyFormScreen.tsx # Warranty creation form
├── types/                # TypeScript type definitions
└── utils/                # Utility functions and constants
```

## Development

- The app uses a token-based authentication flow
- All API requests include the authentication token via Axios interceptors
- The app maintains state through React Context providers
- Form validation is performed client-side before API submissions

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
