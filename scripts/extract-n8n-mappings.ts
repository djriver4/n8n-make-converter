/**
 * Node mapping extraction script
 * 
 * This script extracts node definitions from n8n source code on GitHub and generates
 * mappings in the format required by the n8n-make-converter.
 * 
 * Usage:
 * Run: npm run extract-mappings
 * 
 * No need to clone the n8n repository locally - this script pulls directly from GitHub!
 */

import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { NodeMappingDatabase, NodeMapping, OperationMapping, ParameterMapping } from '../lib/node-mappings/schema';

// GitHub repository configuration
const GITHUB_REPO_OWNER = 'n8n-io';
const GITHUB_REPO_NAME = 'n8n';
const GITHUB_BRANCH = 'master';
const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''; // Optional: Set a GitHub token to increase rate limits

// Popular services to prioritize in extraction
const PRIORITY_SERVICES = [
  'slack',
  'airtable',
  'google',
  'mailchimp',
  'trello',
  'github',
  'asana',
  'twitter',
  'notion',
  'discord',
  'dropbox',
  'telegram',
  'stripe',
  'zoom',
  'hubspot',
  'instagram',
  'linkedin',
  'twilio',
  'zapier',
  'zendesk',
  'shopify',
  'salesforce',
  'facebook',
  'jira',
  'wordpress',
  'pipedrive',
  'xero',
  'quickbooks',
  'monday',
  'bitbucket',
  'clickup',
  'intercom',
  'mailerlite',
  'gitlab',
  'calendly',
  'todoist',
  'woocommerce',
  'microsoft',
  'aws',
  'freshdesk',
  'wrike',
  'aweber',
  'activecampaign',
  'elastic',
  'baserow',
  'coda',
  'mautic',
  'typeform',
  'box',
];

// Configuration
const OUTPUT_FILE_PATH = path.resolve(__dirname, '../lib/node-mappings/nodes-mapping.json');
const LOG_FILE_PATH = path.resolve(__dirname, './extraction-log.txt');
const CACHE_DIR = path.resolve(__dirname, './.cache');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Logging
function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE_PATH, logMessage + '\n');
}

// Clear log file
fs.writeFileSync(LOG_FILE_PATH, '');

// GitHub API helper class
class GitHubApiClient {
  private rateLimitRemaining: number = 5000;
  private headers: Record<string, string>;
  private requestCount: number = 0;

  constructor() {
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'n8n-make-converter-mapping-extractor'
    };

    if (GITHUB_TOKEN) {
      this.headers['Authorization'] = `token ${GITHUB_TOKEN}`;
      log('Using provided GitHub token for API requests');
    } else {
      log('No GitHub token provided. API rate limits will be lower.', 'warn');
    }
  }

  /**
   * Fetch content from GitHub API with rate limit handling
   */
  async fetchFromApi(endpoint: string): Promise<any> {
    this.requestCount++;
    
    // Simple rate limit handling - add delay if making many requests
    if (this.requestCount > 10 && this.requestCount % 10 === 0) {
      log(`Made ${this.requestCount} requests, adding delay to avoid rate limits...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const url = `${GITHUB_API_URL}${endpoint}`;
    log(`Fetching from GitHub API: ${url}`);
    
    try {
      const response = await fetch(url, { headers: this.headers });
      
      // Update rate limit info
      this.rateLimitRemaining = parseInt(response.headers.get('x-ratelimit-remaining') || '5000', 10);
      
      if (this.rateLimitRemaining < 10) {
        log(`GitHub API rate limit running low: ${this.rateLimitRemaining} requests remaining!`, 'warn');
      }
      
      if (!response.ok) {
        throw new Error(`GitHub API error (${response.status}): ${await response.text()}`);
      }
      
      return await response.json();
    } catch (error) {
      log(`API fetch failed: ${(error as Error).message}`, 'error');
      throw error;
    }
  }

  /**
   * Get contents of a directory in the repository
   */
  async getDirectoryContents(path: string): Promise<any[]> {
    const cacheFile = `${CACHE_DIR}/dir_${path.replace(/\//g, '_')}.json`;
    
    // Check if cached result exists and is less than 1 day old
    if (fs.existsSync(cacheFile)) {
      const stats = fs.statSync(cacheFile);
      const cacheAge = Date.now() - stats.mtimeMs;
      
      if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
        log(`Using cached directory listing for ${path}`);
        return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      }
    }
    
    const endpoint = `/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}?ref=${GITHUB_BRANCH}`;
    const result = await this.fetchFromApi(endpoint);
    
    // Cache the result
    fs.writeFileSync(cacheFile, JSON.stringify(result));
    
    return result;
  }

  /**
   * Get the content of a specific file
   */
  async getFileContent(path: string): Promise<string> {
    const cacheFile = `${CACHE_DIR}/file_${path.replace(/\//g, '_')}.txt`;
    
    // Check if cached result exists and is less than 1 day old
    if (fs.existsSync(cacheFile)) {
      const stats = fs.statSync(cacheFile);
      const cacheAge = Date.now() - stats.mtimeMs;
      
      if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
        log(`Using cached file content for ${path}`);
        return fs.readFileSync(cacheFile, 'utf-8');
      }
    }
    
    const endpoint = `/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}?ref=${GITHUB_BRANCH}`;
    const result = await this.fetchFromApi(endpoint);
    
    if (!result.content) {
      throw new Error(`No content found for file ${path}`);
    }
    
    // GitHub API returns base64 encoded content
    const content = Buffer.from(result.content, 'base64').toString('utf-8');
    
    // Cache the result
    fs.writeFileSync(cacheFile, content);
    
    return content;
  }
}

// Main extractor class
class NodeExtractor {
  private apiClient: GitHubApiClient;
  private nodeFiles: string[] = [];
  private mappingDatabase: NodeMappingDatabase = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString().split('T')[0],
    mappings: {}
  };

  constructor() {
    this.apiClient = new GitHubApiClient();
    log('Node extractor initialized. Will fetch node definitions from GitHub.');
  }

  /**
   * Find all node definition files in the repository
   */
  async findNodeFiles() {
    log('Finding node definition files from GitHub...');
    
    // The base nodes directory in n8n repository
    const nodesBasePath = 'packages/nodes-base/nodes';
    
    // Function to recursively find node files in directories
    const findFiles = async (dirPath: string): Promise<string[]> => {
      const files: string[] = [];
      
      try {
        const contents = await this.apiClient.getDirectoryContents(dirPath);
        
        for (const item of contents) {
          if (item.type === 'dir') {
            // Recursively search in this directory
            const subDirFiles = await findFiles(item.path);
            files.push(...subDirFiles);
          } else if (
            item.type === 'file' && 
            (item.name.endsWith('.node.ts') || item.name.endsWith('.Node.ts')) && 
            !item.name.includes('description.ts')
          ) {
            files.push(item.path);
          }
        }
      } catch (error) {
        log(`Error searching directory ${dirPath}: ${(error as Error).message}`, 'error');
      }
      
      return files;
    };
    
    this.nodeFiles = await findFiles(nodesBasePath);
    log(`Found ${this.nodeFiles.length} node definition files on GitHub`);
  }

  /**
   * Parse a node definition file to extract key information
   */
  private async parseNodeFile(filePath: string): Promise<NodeMapping | null> {
    try {
      const fileContent = await this.apiClient.getFileContent(filePath);
      const fileName = path.basename(filePath, '.node.ts');
      
      // Extract display name from class definition
      const displayNameMatch = fileContent.match(/displayName\s*=\s*['"]([^'"]+)['"]/);
      const displayName = displayNameMatch ? displayNameMatch[1] : path.basename(filePath, path.extname(filePath));
      
      // Extract description
      const descriptionMatch = fileContent.match(/description\s*=\s*['"]([^'"]+)['"]/);
      const description = descriptionMatch ? descriptionMatch[1] : '';
      
      // Extract node type
      const nodeTypeMatch = fileContent.match(/nodeType\s*=\s*['"]([^'"]+)['"]/);
      const nodeType = nodeTypeMatch ? 
        nodeTypeMatch[1] : 
        `n8n-nodes-base.${path.basename(filePath, '.node.ts').toLowerCase()}`;
      
      // Extract documentation URL
      const docsUrlMatch = fileContent.match(/documentationUrl\s*=\s*['"]([^'"]+)['"]/);
      const documentationUrl = docsUrlMatch ? docsUrlMatch[1] : '';
      
      // Extract operations
      const operations: OperationMapping[] = [];
      
      // Basic pattern for operations/methods
      const methodMatches = fileContent.match(/methods\s*=\s*{([^}]+)}/);
      if (methodMatches) {
        const methodsStr = methodMatches[1];
        const methodEntries = methodsStr.match(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g);
        
        if (methodEntries) {
          for (const entry of methodEntries) {
            const [n8nName, makeName] = entry
              .replace(/['"]/g, '')
              .split(':')
              .map(s => s.trim());
            
            operations.push({
              n8nName,
              makeName,
              description: `${n8nName} operation`,
              parameters: []
            });
          }
        }
      }
      
      // Extract parameters based on property definitions
      const propertyMatches = fileContent.match(/properties\s*=\s*\[([^\]]+)\]/);
      if (propertyMatches) {
        const propertiesStr = propertyMatches[1];
        const propertyBlocks = propertiesStr.match(/\{[^{}]*\}/g) || [];
        
        const parameters: ParameterMapping[] = [];
        
        for (const block of propertyBlocks) {
          const nameMatch = block.match(/name\s*:\s*['"]([^'"]+)['"]/);
          const displayNameMatch = block.match(/displayName\s*:\s*['"]([^'"]+)['"]/);
          const typeMatch = block.match(/type\s*:\s*['"]([^'"]+)['"]/);
          const requiredMatch = block.match(/required\s*:\s*(true|false)/);
          const descMatch = block.match(/description\s*:\s*['"]([^'"]+)['"]/);
          
          if (nameMatch) {
            parameters.push({
              n8nName: nameMatch[1],
              makeName: nameMatch[1],
              type: typeMatch ? typeMatch[1] : 'string',
              required: requiredMatch ? requiredMatch[1] === 'true' : false,
              description: descMatch ? descMatch[1] : (displayNameMatch ? displayNameMatch[1] : '')
            });
          }
        }
        
        // If we found operations, assign parameters to the first operation as a simple default
        if (operations.length > 0 && parameters.length > 0) {
          operations[0].parameters = parameters;
        } else if (parameters.length > 0) {
          // If no operations but parameters found, create a default operation
          operations.push({
            n8nName: 'default',
            makeName: 'default',
            description: 'Default operation',
            parameters
          });
        }
      }
      
      // Extract type category from file content
      const categoryMatch = fileContent.match(/nodeTypeVersion\s*=\s*[\d]+/);
      const n8nTypeCategory = categoryMatch ? 'Action' : 'Trigger';

      // Guess Make module name based on n8n node name
      const serviceName = fileName.replace(/([A-Z])/g, ' $1').trim();
      
      // Return the structured data
      return {
        n8nNodeType: nodeType,
        n8nDisplayName: displayName,
        makeModuleId: fileName.toLowerCase(), // Simplified mapping - in reality would need manual adjustment
        makeModuleName: serviceName,
        n8nTypeCategory,
        makeTypeCategory: 'App', // Default value, would need manual adjustment
        description,
        documentationUrl: {
          n8n: documentationUrl,
          make: '' // Would need manual adjustment
        },
        operations
      };
    } catch (error) {
      log(`Error parsing node file ${filePath}: ${(error as Error).message}`, 'error');
      return null;
    }
  }

  /**
   * Process node files and generate mappings
   */
  async processNodeFiles() {
    log('Processing node files...');
    
    let processedCount = 0;
    
    // First, process priority services
    for (const file of this.nodeFiles) {
      const fileName = path.basename(file, '.node.ts').toLowerCase();
      
      // Check if this file is for a priority service
      const isPriority = PRIORITY_SERVICES.some(service => 
        fileName.includes(service.toLowerCase())
      );
      
      if (isPriority) {
        const nodeMapping = await this.parseNodeFile(file);
        
        if (nodeMapping) {
          const key = path.basename(file, '.node.ts').toLowerCase();
          this.mappingDatabase.mappings[key] = nodeMapping;
          processedCount++;
          log(`Processed priority node: ${key}`);
        }
      }
      
      // Add reasonable delay every few files to avoid rate limits
      if (processedCount > 0 && processedCount % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Then process any remaining files up to a reasonable limit (e.g., 50 total)
    const maxNodes = 50;
    
    for (const file of this.nodeFiles) {
      if (processedCount >= maxNodes) break;
      
      const key = path.basename(file, '.node.ts').toLowerCase();
      
      // Skip if already processed as a priority
      if (this.mappingDatabase.mappings[key]) continue;
      
      const nodeMapping = await this.parseNodeFile(file);
      
      if (nodeMapping) {
        this.mappingDatabase.mappings[key] = nodeMapping;
        processedCount++;
        log(`Processed node: ${key}`);
      }
      
      // Add reasonable delay every few files to avoid rate limits
      if (processedCount % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    log(`Processed ${processedCount} nodes in total`);
  }

  /**
   * Save the generated mappings to a JSON file
   */
  saveMappings() {
    try {
      const jsonContent = JSON.stringify(this.mappingDatabase, null, 2);
      fs.writeFileSync(OUTPUT_FILE_PATH, jsonContent);
      log(`Successfully saved mappings to ${OUTPUT_FILE_PATH}`);
      log(`Generated ${Object.keys(this.mappingDatabase.mappings).length} node mappings`);
    } catch (error) {
      log(`Error saving mappings: ${(error as Error).message}`, 'error');
    }
  }

  /**
   * Run the entire extraction process
   */
  async run() {
    try {
      await this.findNodeFiles();
      await this.processNodeFiles();
      this.saveMappings();
      log('Extraction completed successfully');
    } catch (error) {
      log(`Extraction failed: ${(error as Error).message}`, 'error');
    }
  }
}

// Run the extractor
(async () => {
  try {
    log('Starting n8n node mapping extraction from GitHub');
    const extractor = new NodeExtractor();
    await extractor.run();
  } catch (error) {
    log(`Failed to run extractor: ${(error as Error).message}`, 'error');
  }
})(); 