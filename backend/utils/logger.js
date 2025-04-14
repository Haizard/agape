/**
 * Logger Utility
 * 
 * Provides consistent logging functionality across the application.
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Get current date for log file name
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Create log file paths
const infoLogFile = path.join(logDir, `info_${getCurrentDate()}.log`);
const errorLogFile = path.join(logDir, `error_${getCurrentDate()}.log`);
const debugLogFile = path.join(logDir, `debug_${getCurrentDate()}.log`);

/**
 * Write log message to file
 * @param {string} filePath - Path to log file
 * @param {string} message - Log message
 */
const writeToFile = (filePath, message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  fs.appendFileSync(filePath, logMessage);
};

/**
 * Generate a unique error code
 * @returns {string} - Unique error code
 */
const generateErrorCode = () => {
  return `ERR-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
};

/**
 * Logger object with different log levels
 */
const logger = {
  /**
   * Log info message
   * @param {string} message - Info message
   */
  info: (message) => {
    console.log(`[INFO] ${message}`);
    writeToFile(infoLogFile, `[INFO] ${message}`);
  },
  
  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Error} [error] - Error object
   * @returns {string} - Error code
   */
  error: (message, error) => {
    const errorCode = generateErrorCode();
    const errorMessage = error ? `${message}: ${error.message}\n${error.stack}` : message;
    
    console.error(`[ERROR] [${errorCode}] ${message}`);
    writeToFile(errorLogFile, `[ERROR] [${errorCode}] ${errorMessage}`);
    
    return errorCode;
  },
  
  /**
   * Log debug message
   * @param {string} message - Debug message
   */
  debug: (message) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`);
      writeToFile(debugLogFile, `[DEBUG] ${message}`);
    }
  },
  
  /**
   * Log warning message
   * @param {string} message - Warning message
   */
  warn: (message) => {
    console.warn(`[WARN] ${message}`);
    writeToFile(infoLogFile, `[WARN] ${message}`);
  }
};

module.exports = logger;
