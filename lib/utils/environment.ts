/**
 * Environment utility functions
 */

/**
 * Checks if the application is running in development mode
 * @returns {boolean} True if in development mode, false otherwise
 */
export function isDevelopmentMode(): boolean {
  // Check if process.env.NODE_ENV is defined and equals 'development'
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
    return process.env.NODE_ENV === 'development';
  }
  
  // For client-side (browser) detection
  if (typeof window !== 'undefined') {
    // Check if the URL contains localhost or a local development server
    const isLocalhost = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.includes('.local');
    
    // Check if the URL contains common development ports
    const isDevelopmentPort = 
      window.location.port === '3000' || 
      window.location.port === '8000' || 
      window.location.port === '8080';
    
    return isLocalhost || isDevelopmentPort;
  }
  
  return false;
}

/**
 * Checks if a feature should be enabled in the current environment
 * based on development mode and feature flag status
 * 
 * @param {boolean} featureFlag The feature flag status
 * @param {boolean} devModeOnly Whether the feature should only be enabled in dev mode
 * @returns {boolean} Whether the feature should be enabled
 */
export function isFeatureEnabled(featureFlag: boolean, devModeOnly: boolean = false): boolean {
  // If the feature is not restricted to dev mode, just check the flag
  if (!devModeOnly) {
    return featureFlag;
  }
  
  // If it's restricted to dev mode, check both the flag and the environment
  return featureFlag && isDevelopmentMode();
} 