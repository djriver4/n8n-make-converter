"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
/**
 * Simple logger utility for the application
 * Provides methods for logging at different levels (debug, info, warn, error)
 */
class Logger {
    /**
     * Log a debug message
     *
     * @param message - The debug message
     * @param ...args - Additional arguments to log
     */
    static debug(message, ...args) {
        if (typeof console !== 'undefined') {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }
    /**
     * Log an info message
     *
     * @param message - The info message
     * @param ...args - Additional arguments to log
     */
    static info(message, ...args) {
        if (typeof console !== 'undefined') {
            console.info(`[INFO] ${message}`, ...args);
        }
    }
    /**
     * Log a warning message
     *
     * @param message - The warning message
     * @param ...args - Additional arguments to log
     */
    static warn(message, ...args) {
        if (typeof console !== 'undefined') {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }
    /**
     * Log an error message
     *
     * @param message - The error message
     * @param ...args - Additional arguments to log
     */
    static error(message, ...args) {
        if (typeof console !== 'undefined') {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }
}
exports.Logger = Logger;
// Default export for easier importing
exports.default = Logger;
