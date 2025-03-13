/**
 * Core types for the conversion system
 */

/**
 * Supported conversion platforms
 */
export type ConversionPlatform = 'n8n' | 'make';

/**
 * Base type for log entries
 */
export type LogEntry = {
  type: 'info' | 'warning' | 'error';
  message: string;
  timestamp?: Date;
};

/**
 * Type for node mapping status
 */
export type MappingStatus = 'full' | 'partial' | 'failed' | 'stub';

/**
 * Re-export node info types
 */
export * from './node-info'; 