import Constants from 'expo-constants';

interface EnvironmentVariables {
  API_URL: string;
  ENVIRONMENT: string;
}

// Default values as fallbacks
const defaultEnvValues: EnvironmentVariables = {
  API_URL: 'http://localhost:3000',
  ENVIRONMENT: 'dev',
};

// Get the environment variables from expo-constants
const getEnvironmentVariables = (): EnvironmentVariables => {
  const expoConstants = Constants.expoConfig?.extra;
  
  return {
    API_URL: expoConstants?.API_URL || defaultEnvValues.API_URL,
    ENVIRONMENT: expoConstants?.ENVIRONMENT || defaultEnvValues.ENVIRONMENT,
  };
};

export const env = getEnvironmentVariables();

// Helper to check if we're in development environment
export const isDev = env.ENVIRONMENT === 'dev';

// Helper to check if we're in production environment
export const isProd = env.ENVIRONMENT === 'prod'; 