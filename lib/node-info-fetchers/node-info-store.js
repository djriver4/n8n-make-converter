"use strict";
/**
 * Node Info Store
 *
 * Central storage for node information fetched from various sources
 * (GitHub, local files, etc.) to enhance node mappings.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeInfoStore = void 0;
const github_node_fetcher_1 = require("./github-node-fetcher");
const local_node_loader_1 = require("./local-node-loader");
// Singleton store for node information
class NodeInfoManager {
    constructor() {
        this.store = {
            nodes: {},
            lastFetched: null,
            isLoading: false,
            error: null
        };
        // Cache duration (24 hours)
        this.CACHE_DURATION = 24 * 60 * 60 * 1000;
        // Initialize (can load from local storage here if needed)
        this.loadFromLocalStorage();
    }
    static getInstance() {
        if (!NodeInfoManager.instance) {
            NodeInfoManager.instance = new NodeInfoManager();
        }
        return NodeInfoManager.instance;
    }
    /**
     * Fetches node information from GitHub if needed
     */
    fetchNodes() {
        return __awaiter(this, arguments, void 0, function* (force = false) {
            // Check if we need to fetch (if data is old or forced)
            if (force ||
                !this.store.lastFetched ||
                Date.now() - this.store.lastFetched > this.CACHE_DURATION) {
                try {
                    this.store.isLoading = true;
                    this.store.error = null;
                    // Get GitHub token from environment if available
                    const githubToken = process.env.GITHUB_TOKEN;
                    // Fetch from GitHub
                    const nodes = yield (0, github_node_fetcher_1.fetchNodesFromGitHub)();
                    // Update store
                    this.store.nodes = Object.assign(Object.assign({}, this.store.nodes), nodes);
                    this.store.lastFetched = Date.now();
                    // Save to local storage
                    this.saveToLocalStorage();
                    return this.store.nodes;
                }
                catch (error) {
                    this.store.error = error instanceof Error ? error : new Error(String(error));
                    console.error("Error fetching node information:", error);
                    throw error;
                }
                finally {
                    this.store.isLoading = false;
                }
            }
            return this.store.nodes;
        });
    }
    /**
     * Loads node information from a local JSON file
     */
    loadNodesFromFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.store.isLoading = true;
                this.store.error = null;
                // Load nodes from file
                const nodes = yield (0, local_node_loader_1.loadNodesFromFile)(filePath);
                // Update store
                this.store.nodes = Object.assign(Object.assign({}, this.store.nodes), nodes);
                this.store.lastFetched = Date.now();
                // Save to local storage
                this.saveToLocalStorage();
                console.log(`Loaded ${Object.keys(nodes).length} nodes from file: ${filePath}`);
                return this.store.nodes;
            }
            catch (error) {
                this.store.error = error instanceof Error ? error : new Error(String(error));
                console.error("Error loading node information from file:", error);
                throw error;
            }
            finally {
                this.store.isLoading = false;
            }
        });
    }
    /**
     * Gets node information by node type
     */
    getNode(nodeType) {
        return this.store.nodes[nodeType];
    }
    /**
     * Gets all loaded node information
     */
    getAllNodes() {
        return this.store.nodes;
    }
    /**
     * Gets loading status
     */
    isLoading() {
        return this.store.isLoading;
    }
    /**
     * Gets error if any
     */
    getError() {
        return this.store.error;
    }
    /**
     * Gets when nodes were last fetched
     */
    getLastFetched() {
        return this.store.lastFetched;
    }
    /**
     * Saves node info to localStorage (client-side only)
     */
    saveToLocalStorage() {
        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem('n8n-node-info', JSON.stringify({
                    nodes: this.store.nodes,
                    lastFetched: this.store.lastFetched
                }));
            }
            catch (error) {
                console.warn('Failed to save node info to localStorage:', error);
            }
        }
    }
    /**
     * Loads node info from localStorage (client-side only)
     */
    loadFromLocalStorage() {
        if (typeof window !== 'undefined') {
            try {
                const stored = window.localStorage.getItem('n8n-node-info');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    this.store.nodes = parsed.nodes || {};
                    this.store.lastFetched = parsed.lastFetched || null;
                }
            }
            catch (error) {
                console.warn('Failed to load node info from localStorage:', error);
            }
        }
    }
}
// Export singleton instance
exports.NodeInfoStore = NodeInfoManager.getInstance();
