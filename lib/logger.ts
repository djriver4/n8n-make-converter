/**
 * Simple logger utility for the n8n to Make.com converter
 */

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private logLevel: LogLevel = LogLevel.INFO;

  /**
   * Set the current log level
   * 
   * @param level - The log level to set
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log an error message
   * 
   * @param message - The message to log
   * @param data - Optional data to include with the log
   */
  error(message: string, data?: any): void {
    if (this.logLevel >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, data ? data : '');
    }
  }

  /**
   * Log a warning message
   * 
   * @param message - The message to log
   * @param data - Optional data to include with the log
   */
  warn(message: string, data?: any): void {
    if (this.logLevel >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, data ? data : '');
    }
  }

  /**
   * Log an info message
   * 
   * @param message - The message to log
   * @param data - Optional data to include with the log
   */
  info(message: string, data?: any): void {
    if (this.logLevel >= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, data ? data : '');
    }
  }

  /**
   * Log a debug message
   * 
   * @param message - The message to log
   * @param data - Optional data to include with the log
   */
  debug(message: string, data?: any): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data ? data : '');
    }
  }
}

// Export a singleton instance
const logger = new Logger();
export default logger; 