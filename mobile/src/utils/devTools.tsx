import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { createLogger, setLogStoreHandler } from './logger';
import { env, isDev } from '../config';

// Create logger for dev tools
const logger = createLogger('DevTools');

// Store for development logs
type LogEntry = {
  timestamp: Date;
  context: string;
  level: string;
  message: string;
};

// In-memory log storage for display in the UI
class LogStore {
  private static instance: LogStore;
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  private constructor() {
    // Initialize logStore
    logger.debug('LogStore initialized');
    
    // Register log handler with logger
    setLogStoreHandler(this.addLog.bind(this));
  }

  public static getInstance(): LogStore {
    if (!LogStore.instance) {
      LogStore.instance = new LogStore();
    }
    return LogStore.instance;
  }

  public addLog(context: string, level: string, message: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      context,
      level,
      message,
    };
    this.logs.unshift(logEntry); // Add to beginning of array for newest first
    
    // Keep only the most recent 100 logs to prevent memory issues
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(0, 100);
    }
    
    // Notify listeners
    this.listeners.forEach(listener => listener(this.logs));
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.listeners.forEach(listener => listener(this.logs));
  }

  public subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

// Global log store instance
export const logStore = LogStore.getInstance();

// Debug Overlay Component
export const DevTools: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  useEffect(() => {
    // Only run in development
    if (!isDev) return;
    
    // Subscribe to log updates
    const unsubscribe = logStore.subscribe(setLogs);
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Don't render anything in production
  if (!isDev) return null;
  
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  const clearLogs = () => {
    logStore.clearLogs();
  };
  
  // Log level colors
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'info': return '#4FC3F7';
      case 'warn': return '#FFD54F';
      case 'error': return '#FF5252';
      case 'debug': return '#B39DDB';
      default: return '#FFFFFF';
    }
  };

  return (
    <>
      {/* Dev Tool Trigger Button */}
      <TouchableOpacity
        style={styles.devButton}
        onPress={toggleVisibility}
      >
        <Text style={styles.devButtonText}>🛠️</Text>
      </TouchableOpacity>
      
      {/* Debug Overlay Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Developer Tools</Text>
            <Text style={styles.modalSubtitle}>
              {env.ENVIRONMENT.toUpperCase()} | API: {env.API_URL}
            </Text>
            
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.headerButton} onPress={clearLogs}>
                <Text style={styles.headerButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={toggleVisibility}>
                <Text style={styles.headerButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.logContainer}>
            {logs.map((log, index) => (
              <View key={index} style={styles.logEntry}>
                <Text style={styles.logTimestamp}>
                  {log.timestamp.toLocaleTimeString()}
                </Text>
                <Text style={[styles.logLevel, { color: getLevelColor(log.level) }]}>
                  {log.level.toUpperCase()}
                </Text>
                <Text style={styles.logContext}>{log.context}</Text>
                <Text style={styles.logMessage}>{log.message}</Text>
              </View>
            ))}
            
            {logs.length === 0 && (
              <Text style={styles.emptyLogs}>No logs to display</Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  devButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  devButtonText: {
    fontSize: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#333',
    marginLeft: 8,
  },
  headerButtonText: {
    color: '#FFF',
    fontSize: 14,
  },
  logContainer: {
    flex: 1,
  },
  logEntry: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  logLevel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  logContext: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
  },
  logMessage: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 4,
  },
  emptyLogs: {
    padding: 20,
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
  },
}); 