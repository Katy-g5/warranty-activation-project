import { isDev } from '../config';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Color codes for different log levels
const LOG_COLORS = {
  info: '\x1b[36m%s\x1b[0m', // Cyan
  warn: '\x1b[33m%s\x1b[0m', // Yellow
  error: '\x1b[31m%s\x1b[0m', // Red
  debug: '\x1b[35m%s\x1b[0m', // Magenta
};

// Simple in-memory log storage for use in DevTools
// This will be replaced by the actual implementation in devTools.tsx
// We're using this approach to avoid circular dependencies
let _logStoreHandler: ((context: string, level: string, message: string) => void) | null = null;

export const setLogStoreHandler = (
  handler: (context: string, level: string, message: string) => void
) => {
  _logStoreHandler = handler;
};

/**
 * Development logger that only logs in development environment
 */
class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Log information messages
   */
  info(...args: any[]): void {
    this.log('info', ...args);
  }

  /**
   * Log warning messages
   */
  warn(...args: any[]): void {
    this.log('warn', ...args);
  }

  /**
   * Log error messages
   */
  error(...args: any[]): void {
    this.log('error', ...args);
  }

  /**
   * Log debug messages
   */
  debug(...args: any[]): void {
    this.log('debug', ...args);
  }

  /**
   * Log API request/response
   */
  api(method: string, url: string, data?: any, response?: any): void {
    if (!isDev) return;

    console.group(`🔌 API ${method.toUpperCase()}: ${url}`);
    if (data) {
      console.log('Request:', data);
    }
    if (response) {
      if (response.status >= 400) {
        console.error('Response:', response.status, response.data);
      } else {
        console.log('Response:', response.status, response.data);
      }
    }
    console.groupEnd();
    
    // Store API log
    this.log('info', `API ${method.toUpperCase()}: ${url}`, 
      response ? `Status: ${response.status}` : '');
  }

  /**
   * Log with specific level
   */
  private log(level: LogLevel, ...args: any[]): void {
    if (!isDev) return;

    const timestamp = new Date().toISOString().substring(11, 23);
    const prefix = `[${timestamp}][${this.context}]`;
    
    // Format message for console
    if (level === 'error') {
      console.error(LOG_COLORS[level], prefix, ...args);
    } else if (level === 'warn') {
      console.warn(LOG_COLORS[level], prefix, ...args);
    } else {
      console.log(LOG_COLORS[level], prefix, ...args);
    }
    
    // Store log in LogStore for DevTools if handler is available
    if (_logStoreHandler) {
      // Convert args to string for storage
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
      
      _logStoreHandler(this.context, level, message);
    }
  }
}

/**
 * Create a logger for a specific context
 */
export const createLogger = (context: string): Logger => {
  return new Logger(context);
}; 