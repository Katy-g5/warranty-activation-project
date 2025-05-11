import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { WarrantyProvider } from './src/context/WarrantyContext';
import { theme } from './src/utils/theme';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { env, isDev } from './src/config';
import { createLogger } from './src/utils/logger';
import { DevTools } from './src/utils/devTools';

// Create logger for app component
const logger = createLogger('App');

export default function App() {
  useEffect(() => {
    // Log environment variables on app startup
    logger.info('App initialized with environment', env);
    logger.debug('Is development?', isDev.toString());
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <WarrantyProvider>
            <AppNavigator />
            {isDev && (
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 4, backgroundColor: 'rgba(255,0,0,0.1)' }}>
                <Text style={{ color: 'red', fontSize: 10, textAlign: 'center' }}>
                  DEV MODE - {env.API_URL}
                </Text>
              </View>
            )}
            <DevTools />
          </WarrantyProvider>
        </AuthProvider>
      </PaperProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
