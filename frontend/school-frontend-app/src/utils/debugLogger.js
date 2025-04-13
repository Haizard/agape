/**
 * Advanced Debug Logger for React Applications
 * 
 * This utility provides comprehensive logging capabilities for debugging React applications,
 * with a focus on initialization, rendering, and router-related issues.
 */

// Configuration
const DEBUG_CONFIG = {
  enabled: true,
  logLevel: 'debug', // 'error', 'warn', 'info', 'debug', 'trace'
  logToConsole: true,
  logToStorage: true,
  maxStorageLogs: 1000,
  componentTracing: true,
  routerTracing: true,
  reduxTracing: false,
  performanceTracing: true,
  storageKey: 'react_debug_logs',
};

// Log levels
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

// Utility to get current timestamp
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

// Main logger class
class DebugLogger {
  constructor(config = DEBUG_CONFIG) {
    this.config = { ...DEBUG_CONFIG, ...config };
    this.logs = [];
    this.loadLogsFromStorage();
    
    // Initialize
    this.info('DebugLogger initialized', { config: this.config });
    
    // Set up global error handler
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandlers();
    }
  }
  
  // Set up global error handlers
  setupGlobalErrorHandlers() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.stack : null,
      });
      
      // Don't prevent default to allow normal error handling
    });
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason ? (event.reason.stack || event.reason.message || event.reason) : 'Unknown reason',
      });
    });
    
    // Override console methods to capture logs
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
    };
    
    // Only override if we're not already in a debug session
    if (!window.__REACT_DEBUG_SESSION__) {
      window.__REACT_DEBUG_SESSION__ = true;
      
      console.log = (...args) => {
        this.captureConsoleLog('log', ...args);
        originalConsole.log(...args);
      };
      
      console.info = (...args) => {
        this.captureConsoleLog('info', ...args);
        originalConsole.info(...args);
      };
      
      console.warn = (...args) => {
        this.captureConsoleLog('warn', ...args);
        originalConsole.warn(...args);
      };
      
      console.error = (...args) => {
        this.captureConsoleLog('error', ...args);
        originalConsole.error(...args);
      };
      
      console.debug = (...args) => {
        this.captureConsoleLog('debug', ...args);
        originalConsole.debug(...args);
      };
    }
  }
  
  // Capture console logs
  captureConsoleLog(level, ...args) {
    // Convert args to a more serializable format
    const serializedArgs = args.map(arg => {
      if (arg instanceof Error) {
        return {
          errorType: arg.name,
          message: arg.message,
          stack: arg.stack,
        };
      }
      
      if (typeof arg === 'object' && arg !== null) {
        try {
          // Try to convert to JSON and back to handle circular references
          return JSON.parse(JSON.stringify(arg));
        } catch (e) {
          return `[Object: ${typeof arg}]`;
        }
      }
      
      return arg;
    });
    
    this[level === 'log' ? 'debug' : level]('Console', { args: serializedArgs });
  }
  
  // Log methods
  log(level, category, data = {}) {
    if (!this.config.enabled) return;
    
    // Check if we should log based on level
    if (LOG_LEVELS[level] > LOG_LEVELS[this.config.logLevel]) return;
    
    const logEntry = {
      timestamp: getTimestamp(),
      level,
      category,
      data,
    };
    
    // Add to memory logs
    this.logs.push(logEntry);
    
    // Trim logs if needed
    if (this.logs.length > this.config.maxStorageLogs) {
      this.logs = this.logs.slice(-this.config.maxStorageLogs);
    }
    
    // Save to storage
    if (this.config.logToStorage) {
      this.saveLogsToStorage();
    }
    
    // Log to console
    if (this.config.logToConsole) {
      const consoleMethod = level === 'debug' ? 'log' : level;
      if (console[consoleMethod]) {
        console[consoleMethod](`[${logEntry.timestamp}] [${level.toUpperCase()}] [${category}]`, data);
      }
    }
  }
  
  // Convenience methods
  error(category, data) { this.log('error', category, data); }
  warn(category, data) { this.log('warn', category, data); }
  info(category, data) { this.log('info', category, data); }
  debug(category, data) { this.log('debug', category, data); }
  trace(category, data) { this.log('trace', category, data); }
  
  // Storage methods
  saveLogsToStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.logs));
      } catch (e) {
        // If storage fails (e.g., quota exceeded), just continue without saving
        console.warn('Failed to save logs to localStorage', e);
      }
    }
  }
  
  loadLogsFromStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        const storedLogs = localStorage.getItem(this.config.storageKey);
        if (storedLogs) {
          this.logs = JSON.parse(storedLogs);
        }
      } catch (e) {
        // If loading fails, start with empty logs
        console.warn('Failed to load logs from localStorage', e);
        this.logs = [];
      }
    }
  }
  
  clearLogs() {
    this.logs = [];
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.config.storageKey);
    }
    this.info('Logs cleared');
  }
  
  // Get all logs
  getLogs() {
    return this.logs;
  }
  
  // Get logs by level
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }
  
  // Get logs by category
  getLogsByCategory(category) {
    return this.logs.filter(log => log.category === category);
  }
  
  // Export logs as JSON
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
  
  // Create diagnostic report
  createDiagnosticReport() {
    const report = {
      timestamp: getTimestamp(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Not available',
      logs: this.logs,
      stats: {
        totalLogs: this.logs.length,
        errorCount: this.getLogsByLevel('error').length,
        warnCount: this.getLogsByLevel('warn').length,
        infoCount: this.getLogsByLevel('info').length,
        debugCount: this.getLogsByLevel('debug').length,
        traceCount: this.getLogsByLevel('trace').length,
      },
      environment: {
        windowSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Not available',
        language: typeof navigator !== 'undefined' ? navigator.language : 'Not available',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'Not available',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
    
    return report;
  }
}

// Create singleton instance
const debugLogger = new DebugLogger();

// Export
export default debugLogger;
