/**
 * Feature Flags Management System
 * 
 * Allows enabling/disabling features throughout the application.
 */

// Define all available feature flags and their default states
export interface FeatureFlags {
  // UI Components
  showNodeInfoManager: boolean;
  showCustomMappingsManager: boolean;
  showPreferences: boolean;
  
  // Functionality
  enableGitHubFetching: boolean;
  enableLocalStorage: boolean;
  
  // Experimental
  experimentalFeatures: boolean;
  enableFullConversionInDevMode: boolean; // Enables full conversion even if modules are not available (dev mode only)
}

// Default state for all feature flags
const defaultFeatureFlags: FeatureFlags = {
  showNodeInfoManager: false,
  showCustomMappingsManager: true,
  showPreferences: true,
  enableGitHubFetching: true, 
  enableLocalStorage: true,
  experimentalFeatures: false,
  enableFullConversionInDevMode: false,
};

// Singleton for feature flag management
class FeatureFlagsManager {
  private static instance: FeatureFlagsManager;
  private flags: FeatureFlags;
  private readonly STORAGE_KEY = 'n8n-make-converter-feature-flags';
  
  private constructor() {
    this.flags = {...defaultFeatureFlags};
    this.loadFromLocalStorage();
  }
  
  public static getInstance(): FeatureFlagsManager {
    if (!FeatureFlagsManager.instance) {
      FeatureFlagsManager.instance = new FeatureFlagsManager();
    }
    return FeatureFlagsManager.instance;
  }
  
  /**
   * Get the current state of all feature flags
   */
  public getFlags(): FeatureFlags {
    return {...this.flags};
  }
  
  /**
   * Get a specific feature flag state
   */
  public getFlag<K extends keyof FeatureFlags>(flagName: K): FeatureFlags[K] {
    return this.flags[flagName];
  }
  
  /**
   * Set a specific feature flag state
   */
  public setFlag<K extends keyof FeatureFlags>(flagName: K, value: FeatureFlags[K]): void {
    this.flags[flagName] = value;
    this.saveToLocalStorage();
  }
  
  /**
   * Reset all flags to their default values
   */
  public resetFlags(): void {
    this.flags = {...defaultFeatureFlags};
    this.saveToLocalStorage();
  }
  
  /**
   * Save the current flag state to localStorage
   */
  private saveToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.flags));
      } catch (error) {
        console.warn('Failed to save feature flags to localStorage:', error);
      }
    }
  }
  
  /**
   * Load flag state from localStorage
   */
  private loadFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          // Only override flags that exist in the stored data
          const storedFlags = JSON.parse(stored) as Partial<FeatureFlags>;
          this.flags = { ...this.flags, ...storedFlags };
        }
      } catch (error) {
        console.warn('Failed to load feature flags from localStorage:', error);
      }
    }
  }
}

// Export singleton instance
export const FeatureFlags = FeatureFlagsManager.getInstance(); 