import { AuthProvider } from 'react-admin';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface LoginParams {
    username: string;
    password: string;
}

interface RegisterParams {
    username: string;
    password: string;
}

interface AuthResponse {
    token: string;
    id: string;
    fullName: string;
    avatar?: string;
    isAdmin?: boolean;
}

const authProvider: AuthProvider = {
    login: async ({ username, password }: LoginParams) => {
        console.log('Attempting login with:', { username });

        const response = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        });

        if (!response.ok) {
            console.error('Login error:', response.statusText);
            throw new Error('Invalid username or password');
        }

        const auth: AuthResponse = await response.json();
        console.log('Login successful, storing auth token');
        localStorage.setItem('auth', JSON.stringify(auth));
        localStorage.setItem('token', auth.token);

        return auth;
    },

    register: async ({ username, password }: RegisterParams) => {
        console.log('Attempting registration for:', { username });

        const response = await fetch(`${apiUrl}/auth/register`, {
            method: 'POST',
            body: JSON.stringify({
                username,
                password,
                isAdmin: true,
            }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        });

        if (!response.ok) {
            console.error('Registration error:', response.statusText);
            throw new Error('Registration failed');
        }

        const auth: AuthResponse = await response.json();
        console.log('Registration successful, storing auth token');
        localStorage.setItem('auth', JSON.stringify(auth));
        localStorage.setItem('token', auth.token);

        return auth;
    },

    logout: async () => {
        console.log('Logging out, removing auth data');
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
        return Promise.resolve();
    },

    checkError: async (error) => {
        console.log('Checking error:', error);
        const status = error.status;
        if (status === 401 || status === 403) {
            console.error('Unauthorized or forbidden, logging out');
            localStorage.removeItem('auth');
            localStorage.removeItem('token');
            return Promise.reject();
        }
        return Promise.resolve();
    },

    checkAuth: async () => {
        console.log('Checking auth status');
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No auth token found');
            return Promise.reject();
        }

        try {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            if (decodedToken.exp && decodedToken.exp < now) {
                console.error('Token expired');
                localStorage.removeItem('auth');
                localStorage.removeItem('token');
                return Promise.reject();
            }

            console.log('Token is valid');
            return Promise.resolve();
        } catch (error) {
            console.error('Error decoding token:', error);
            return Promise.reject();
        }
    },

    getPermissions: async () => {
        console.log('Getting permissions');
        const token = localStorage.getItem('token');
        if (!token) return Promise.reject();

        try {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            if (!decodedToken.isAdmin) {
                console.error('User is not an admin');
                return Promise.reject('Not an admin');
            }

            console.log('Admin permissions verified');
            return Promise.resolve('admin');
        } catch (error) {
            console.error('Error checking permissions:', error);
            return Promise.reject();
        }
    },

    getIdentity: async () => {
        console.log('Getting user identity');
        const auth = localStorage.getItem('auth');
        if (!auth) return Promise.reject();

        try {
            const { id, fullName, avatar } = JSON.parse(auth);
            console.log('Identity retrieved:', { id, fullName });
            return Promise.resolve({ id, fullName, avatar });
        } catch (error) {
            console.error('Error parsing identity:', error);
            return Promise.reject();
        }
    }
};

export default authProvider;
