/**
 * Node Info Store
 * 
 * Central storage for node information fetched from various sources
 * (GitHub, local files, etc.) to enhance node mappings.
 */

import { fetchNodesFromGitHub } from './github-node-fetcher'
import { loadNodesFromFile } from './local-node-loader'
import { NodeInfo } from '../types/node-info'
import path from 'path'

// Store type for loaded node information
type NodeInfoStore = {
  nodes: Record<string, NodeInfo>
  lastFetched: number | null
  isLoading: boolean
  error: Error | null
}

// Singleton store for node information
class NodeInfoManager {
  private static instance: NodeInfoManager
  private store: NodeInfoStore = {
    nodes: {},
    lastFetched: null,
    isLoading: false,
    error: null
  }
  
  // Cache duration (24 hours)
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000
  
  private constructor() {
    // Initialize (can load from local storage here if needed)
    this.loadFromLocalStorage()
  }
  
  public static getInstance(): NodeInfoManager {
    if (!NodeInfoManager.instance) {
      NodeInfoManager.instance = new NodeInfoManager()
    }
    return NodeInfoManager.instance
  }
  
  /**
   * Fetches node information from GitHub if needed
   */
  public async fetchNodes(force = false): Promise<Record<string, NodeInfo>> {
    // Check if we need to fetch (if data is old or forced)
    if (
      force || 
      !this.store.lastFetched || 
      Date.now() - this.store.lastFetched > this.CACHE_DURATION
    ) {
      try {
        this.store.isLoading = true
        this.store.error = null
        
        // Get GitHub token from environment if available
        const githubToken = process.env.GITHUB_TOKEN
        
        // Fetch from GitHub
        const nodes = await fetchNodesFromGitHub()
        
        // Update store
        this.store.nodes = { ...this.store.nodes, ...nodes }
        this.store.lastFetched = Date.now()
        
        // Save to local storage
        this.saveToLocalStorage()
        
        return this.store.nodes
      } catch (error) {
        this.store.error = error instanceof Error ? error : new Error(String(error))
        console.error("Error fetching node information:", error)
        throw error
      } finally {
        this.store.isLoading = false
      }
    }
    
    return this.store.nodes
  }

  /**
   * Loads node information from a local JSON file
   */
  public async loadNodesFromFile(filePath: string): Promise<Record<string, NodeInfo>> {
    try {
      this.store.isLoading = true;
      this.store.error = null;
      
      // Load nodes from file
      const nodes = await loadNodesFromFile(filePath);
      
      // Update store
      this.store.nodes = { ...this.store.nodes, ...nodes };
      this.store.lastFetched = Date.now();
      
      // Save to local storage
      this.saveToLocalStorage();
      
      console.log(`Loaded ${Object.keys(nodes).length} nodes from file: ${filePath}`);
      return this.store.nodes;
    } catch (error) {
      this.store.error = error instanceof Error ? error : new Error(String(error));
      console.error("Error loading node information from file:", error);
      throw error;
    } finally {
      this.store.isLoading = false;
    }
  }
  
  /**
   * Gets node information by node type
   */
  public getNode(nodeType: string): NodeInfo | undefined {
    return this.store.nodes[nodeType]
  }
  
  /**
   * Gets all loaded node information
   */
  public getAllNodes(): Record<string, NodeInfo> {
    return this.store.nodes
  }
  
  /**
   * Gets loading status
   */
  public isLoading(): boolean {
    return this.store.isLoading
  }
  
  /**
   * Gets error if any
   */
  public getError(): Error | null {
    return this.store.error
  }
  
  /**
   * Gets when nodes were last fetched
   */
  public getLastFetched(): number | null {
    return this.store.lastFetched
  }
  
  /**
   * Saves node info to localStorage (client-side only)
   */
  private saveToLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          'n8n-node-info', 
          JSON.stringify({
            nodes: this.store.nodes,
            lastFetched: this.store.lastFetched
          })
        )
      } catch (error) {
        console.warn('Failed to save node info to localStorage:', error)
      }
    }
  }
  
  /**
   * Loads node info from localStorage (client-side only)
   */
  private loadFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('n8n-node-info')
        if (stored) {
          const parsed = JSON.parse(stored)
          this.store.nodes = parsed.nodes || {}
          this.store.lastFetched = parsed.lastFetched || null
        }
      } catch (error) {
        console.warn('Failed to load node info from localStorage:', error)
      }
    }
  }
}

// Export singleton instance
export const NodeInfoStore = NodeInfoManager.getInstance() 