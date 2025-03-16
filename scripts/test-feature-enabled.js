#!/usr/bin/env node

/**
 * Test script for the isFeatureEnabled function
 */

// Import the necessary modules
const { FeatureFlags } = require('../lib/feature-management/feature-flags');
const fs = require('fs');
const path = require('path');

// Set up logging
const logFile = path.join(__dirname, 'feature-enabled-test.log');
let logData = '';

function log(message) {
  const formattedMessage = typeof message === 'object' 
    ? JSON.stringify(message, null, 2) 
    : message;
  console.log(formattedMessage);
  logData += formattedMessage + '\n';
}

// Import the isFeatureEnabled function directly
// We need to use a workaround since we can't directly import from TypeScript files in Node.js
// So we'll copy the implementation here
function isDevelopmentMode() {
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

function isFeatureEnabled(featureFlag, devModeOnly = false) {
  // If the feature is not restricted to dev mode, just check the flag
  if (!devModeOnly) {
    return featureFlag;
  }
  
  // If it's restricted to dev mode, check both the flag and the environment
  return featureFlag && isDevelopmentMode();
}

// Main function
const main = async () => {
  log('Starting Feature Enabled Test Script');
  log(`Date: ${new Date().toISOString()}`);
  
  // Test isDevelopmentMode function
  log('\n=== Testing isDevelopmentMode function ===');
  log(`NODE_ENV before: ${process.env.NODE_ENV || 'undefined'}`);
  log(`isDevelopmentMode(): ${isDevelopmentMode()}`);
  
  // Set NODE_ENV to development
  process.env.NODE_ENV = 'development';
  log(`NODE_ENV after setting to 'development': ${process.env.NODE_ENV}`);
  log(`isDevelopmentMode() after setting NODE_ENV: ${isDevelopmentMode()}`);
  
  // Test isFeatureEnabled function
  log('\n=== Testing isFeatureEnabled function ===');
  
  // Test with feature flag false, devModeOnly false
  log(`isFeatureEnabled(false, false): ${isFeatureEnabled(false, false)}`);
  
  // Test with feature flag true, devModeOnly false
  log(`isFeatureEnabled(true, false): ${isFeatureEnabled(true, false)}`);
  
  // Test with feature flag false, devModeOnly true
  log(`isFeatureEnabled(false, true): ${isFeatureEnabled(false, true)}`);
  
  // Test with feature flag true, devModeOnly true
  log(`isFeatureEnabled(true, true): ${isFeatureEnabled(true, true)}`);
  
  // Test with FeatureFlags class
  log('\n=== Testing FeatureFlags class ===');
  
  // Check initial state
  const initialFlag = FeatureFlags.getFlag('enableFullConversionInDevMode');
  log(`Initial enableFullConversionInDevMode: ${initialFlag}`);
  
  // Set flag to true
  FeatureFlags.setFlag('enableFullConversionInDevMode', true);
  const updatedFlag = FeatureFlags.getFlag('enableFullConversionInDevMode');
  log(`Updated enableFullConversionInDevMode: ${updatedFlag}`);
  
  // Test with isFeatureEnabled
  log(`isFeatureEnabled(updatedFlag, true): ${isFeatureEnabled(updatedFlag, true)}`);
  
  // Reset flag
  FeatureFlags.setFlag('enableFullConversionInDevMode', false);
  log(`Reset enableFullConversionInDevMode: ${FeatureFlags.getFlag('enableFullConversionInDevMode')}`);
  
  // Save log file
  fs.writeFileSync(logFile, logData);
  log(`\nTest completed. Log saved to ${logFile}`);
};

// Run main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 