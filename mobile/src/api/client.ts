import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '../utils/logger';

// Create logger for API
const logger = createLogger('API');

const client = axios.create({
  baseURL: 'http://10.0.0.8:3000/api'
});

// Add a request interceptor to attach auth token
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Log request
      logger.debug(`${config.method?.toUpperCase()} ${config.url}`, 
        config.params ? { params: config.params } : '',
        config.data ? { data: config.data } : ''
      );
      
    } catch (error: unknown) {
      logger.error('Error setting auth token:', error);
    }
    return config;
  },
  (error: unknown) => {
    logger.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to log responses
client.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful response
    logger.api(
      response.config.method || 'unknown',
      `${response.config.url || ''}`,
      response.config.data,
      { status: response.status, data: response.data }
    );
    return response;
  },
  (error: AxiosError) => {
    // Log error response
    logger.error(
      `API Error: ${error.message}`,
      {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data
      }
    );
    return Promise.reject(error);
  }
);

export default client; 