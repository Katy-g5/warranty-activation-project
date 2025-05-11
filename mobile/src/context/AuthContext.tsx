import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState } from '../types';
import * as authApi from '../api/auth';
import { createLogger } from '../utils/logger';

// Create logger for authentication context
const logger = createLogger('Auth');

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Default context value
const defaultContextValue: AuthContextType = {
  user: null,
  isLoading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
};

// Create the context
const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true, // Start as true until initial check is done
    error: null,
  });

  // Check if user is already logged in
  useEffect(() => {
    logger.info('Initializing authentication state');
    
    const loadUserFromStorage = async () => {
      let user: User | null = null;
      let token: string | null = null;
      
      try {
        // Check for token and stored user data
        token = await AsyncStorage.getItem('token');
        const userJSON = await AsyncStorage.getItem('user');
        if (userJSON) {
          user = JSON.parse(userJSON);
        }
        
        logger.debug('Loaded auth data from storage', { hasToken: !!token, hasUser: !!user });
        
        if (token && user) {
          // Optimistically set user state
          setState(prev => ({ ...prev, user, isLoading: false }));
          logger.info('User session restored', { userId: user.id, username: user.username });
          
          // Verify token and update user data in background
          try {
            logger.debug('Verifying token with API...');
            const freshUser = await authApi.getProfile();
            await AsyncStorage.setItem('user', JSON.stringify(freshUser));
            setState(prev => ({ ...prev, user: freshUser, isLoading: false }));
            logger.info('User profile refreshed from API', { userId: freshUser.id });
          } catch (profileError) {
            // Token invalid or expired
            logger.warn('Token verification failed, logging out:', profileError);
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setState({
              user: null,
              isLoading: false,
              error: 'Session expired. Please login again.'
            });
          }
        } else {
          // No token or user data found
          logger.info('No active session found');
          setState(prev => ({ ...prev, user: null, isLoading: false }));
        }
      } catch (storageError) {
        logger.error('Failed to load data from storage:', storageError);
        setState(prev => ({ 
          ...prev, 
          user: null, 
          error: 'Failed to load session data.', 
          isLoading: false 
        }));
      }
    };

    loadUserFromStorage();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    logger.info('Login attempt', { username });
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authApi.login(username, password);
      
      const userRes = {
        id: response.id,
        username: response.username,
        token: response.token,
      }
      
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(userRes));

      logger.info('Login successful', { userId: userRes.id, username: userRes.username });
      setState(prev => ({ ...prev, user: userRes, isLoading: false }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      logger.error('Login failed', { username, error: errorMessage });
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }));
    }
  };

  // Register function
  const register = async (username: string, password: string) => {
    logger.info('Registration attempt', { username });
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authApi.register(username, password);
      
      const userRes = {
        id: response.id,
        username: response.username,
        token: response.token,
      }
      
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(userRes));
      
      logger.info('Registration successful', { userId: userRes.id, username: userRes.username });
      setState(prev => ({ ...prev, user: userRes, isLoading: false }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      logger.error('Registration failed', { username, error: errorMessage });
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }));
    }
  };

  // Logout function
  const logout = async () => {
    logger.info('Logout initiated', { userId: state.user?.id });
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authApi.logout(); // This just removes token from AsyncStorage
      await AsyncStorage.removeItem('user'); // Also remove user data
      logger.info('Logout successful');
      setState({ user: null, isLoading: false, error: null });
    } catch (error) {
      logger.error('Logout failed:', error);
      // Clear local state even if API call fails
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setState({ user: null, isLoading: false, error: 'Logout failed' });
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 