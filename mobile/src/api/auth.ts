import client from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

export interface LoginResponse {
  id: number;
  token: string;
  username: string;
  isAdmin: boolean;
}

export interface RegisterResponse {
  id: number;
  username: string;
  isAdmin: boolean;
  token: string;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>('/auth/login', {
    username,
    password
  });
  
  // Store the JWT token
  await AsyncStorage.setItem('token', response.data.token);
  
  return response.data;
};

export const register = async (
  username: string, 
  password: string
): Promise<RegisterResponse> => {
  const response = await client.post<RegisterResponse>('/auth/register', {
    username,
    password,
    isAdmin: false
  });
  
  // Store the JWT token
  await AsyncStorage.setItem('token', response.data.token);
  
  return response.data;
};

export const getProfile = async (): Promise<User> => {
  const response = await client.get<User>('/auth/profile');
  return response.data;
};

export const logout = async (): Promise<void> => {
  await AsyncStorage.removeItem('token');
}; 