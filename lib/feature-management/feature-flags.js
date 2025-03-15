"use strict";
/**
 * Feature Flags Management System
 *
 * Allows enabling/disabling features throughout the application.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureFlags = void 0;
// Default state for all feature flags
const defaultFeatureFlags = {
    showNodeInfoManager: false,
    showCustomMappingsManager: true,
    showPreferences: true,
    enableGitHubFetching: true,
    enableLocalStorage: true,
    experimentalFeatures: false,
};
// Singleton for feature flag management
class FeatureFlagsManager {
    constructor() {
        this.STORAGE_KEY = 'n8n-make-converter-feature-flags';
        this.flags = Object.assign({}, defaultFeatureFlags);
        this.loadFromLocalStorage();
    }
    static getInstance() {
        if (!FeatureFlagsManager.instance) {
            FeatureFlagsManager.instance = new FeatureFlagsManager();
        }
        return FeatureFlagsManager.instance;
    }
    /**
     * Get the current state of all feature flags
     */
    getFlags() {
        return Object.assign({}, this.flags);
    }
    /**
     * Get a specific feature flag state
     */
    getFlag(flagName) {
        return this.flags[flagName];
    }
    /**
     * Set a specific feature flag state
     */
    setFlag(flagName, value) {
        this.flags[flagName] = value;
        this.saveToLocalStorage();
    }
    /**
     * Reset all flags to their default values
     */
    resetFlags() {
        this.flags = Object.assign({}, defaultFeatureFlags);
        this.saveToLocalStorage();
    }
    /**
     * Save the current flag state to localStorage
     */
    saveToLocalStorage() {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.flags));
            }
            catch (error) {
                console.warn('Failed to save feature flags to localStorage:', error);
            }
        }
    }
    /**
     * Load flag state from localStorage
     */
    loadFromLocalStorage() {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(this.STORAGE_KEY);
                if (stored) {
                    // Only override flags that exist in the stored data
                    const storedFlags = JSON.parse(stored);
                    this.flags = Object.assign(Object.assign({}, this.flags), storedFlags);
                }
            }
            catch (error) {
                console.warn('Failed to load feature flags from localStorage:', error);
            }
        }
    }
}
// Export singleton instance
exports.FeatureFlags = FeatureFlagsManager.getInstance();
