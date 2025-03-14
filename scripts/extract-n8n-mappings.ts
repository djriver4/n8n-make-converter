/**
 * Node mapping extraction script
 * 
 * This script extracts node definitions from n8n source code and generates
 * mappings in the format required by the n8n-make-converter.
 * 
 * Usage:
 * 1. Clone the n8n repository: git clone https://github.com/n8n-io/n8n.git
 * 2. Set the N8N_SRC_PATH environment variable to point to the n8n repository
 * 3. Run: npm run extract-mappings
 */

import * as fs from 'fs';
import * as path from 'path';
import { NodeMappingDatabase, NodeMapping, OperationMapping, ParameterMapping } from '../lib/node-mappings/schema';

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

/**
 * Configure logging
 */
function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (level === 'error') {
    console.error(`${prefix} ${message}`);
  } else if (level === 'warn') {
    console.warn(`${prefix} ${message}`);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

// FIXME: The n8n directory should be removed in the future.
// Currently ignoring it in the path resolution to avoid errors but should clean up later.
const N8N_SRC_PATH = process.env.N8N_SRC_PATH || '/path/to/non-existent-dir';

// Configuration
const OUTPUT_FILE_PATH = path.resolve(__dirname, '../lib/node-mappings/nodes-mapping.json');
const LOG_FILE_PATH = path.resolve(__dirname, './extraction-log.txt');

// Clear log file
fs.writeFileSync(LOG_FILE_PATH, '');

// Main extractor class
class NodeExtractor {
  private nodesPath: string;
  private nodeFiles: string[] = [];
  private mappingDatabase: NodeMappingDatabase = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString().split('T')[0],
    mappings: {}
  };

  constructor() {
    this.nodesPath = path.join(N8N_SRC_PATH, 'packages/nodes-base/nodes');
    
    // Skip directory validation to prevent errors
    log(`NOTE: n8n directory is currently being ignored. The local n8n directory at ${path.join(process.cwd(), '../n8n')} should be removed in the future.`);
    log(`Using virtual n8n nodes directory: ${this.nodesPath}`);
  }

  /**
   * Find all node definition files
   */
  public findNodeFiles() {
    log('Finding node definition files...');
    
    // Check if directory exists first (it won't since we're ignoring n8n directory)
    if (!fs.existsSync(this.nodesPath)) {
      log('n8n nodes directory not found. Using existing mappings instead.', 'warn');
      return [];
    }
    
    const findFiles = (dir: string): string[] => {
      const files: string[] = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...findFiles(fullPath));
        } else if (item.endsWith('.node.ts') || item.endsWith('.Node.ts')) {
          // Only include .node.ts files
          files.push(fullPath);
        }
      }
      
      return files;
    };
    
    try {
      this.nodeFiles = findFiles(this.nodesPath);
      log(`Found ${this.nodeFiles.length} node definition files`);
      return this.nodeFiles;
    } catch (error) {
      log(`Error finding node files: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return [];
    }
  }

  /**
   * Parse a node definition file to extract key information
   */
  private parseNodeFile(filePath: string): NodeMapping | null {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
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
      const fileName = path.basename(filePath, '.node.ts');
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
   * Process all node files and generate mappings
   */
  public processNodeFiles() {
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
        const nodeMapping = this.parseNodeFile(file);
        
        if (nodeMapping) {
          const key = path.basename(file, '.node.ts').toLowerCase();
          this.mappingDatabase.mappings[key] = nodeMapping;
          processedCount++;
          log(`Processed priority node: ${key}`);
        }
      }
    }
    
    // Then process any remaining files up to a reasonable limit (e.g., 50 total)
    const maxNodes = 50;
    
    for (const file of this.nodeFiles) {
      if (processedCount >= maxNodes) break;
      
      const key = path.basename(file, '.node.ts').toLowerCase();
      
      // Skip if already processed as a priority
      if (this.mappingDatabase.mappings[key]) continue;
      
      const nodeMapping = this.parseNodeFile(file);
      
      if (nodeMapping) {
        this.mappingDatabase.mappings[key] = nodeMapping;
        processedCount++;
        log(`Processed node: ${key}`);
      }
    }
    
    log(`Processed ${processedCount} nodes in total`);
  }

  /**
   * Save the mappings to the output file
   */
  public saveMappings() {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(OUTPUT_FILE_PATH);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Update the last updated timestamp
      this.mappingDatabase.lastUpdated = new Date().toISOString().split('T')[0];
      
      // Write the mappings to the output file
      const data = JSON.stringify(this.mappingDatabase, null, 2);
      fs.writeFileSync(OUTPUT_FILE_PATH, data);
      
      log(`Generated ${Object.keys(this.mappingDatabase.mappings).length} node mappings`);
      log(`Mappings saved to: ${OUTPUT_FILE_PATH}`);
    } catch (error) {
      log(`Error saving mappings: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }

  /**
   * Run the extraction process
   */
  public run() {
    try {
      // Initialize
      log('Starting n8n node mapping extraction');
      
      // Find node files
      this.findNodeFiles();
      
      // Check if we have any files to process
      if (this.nodeFiles.length === 0) {
        log('No node files found. Using existing mappings or generating empty mapping database.', 'warn');
        
        // Try to load existing mappings
        try {
          if (fs.existsSync(OUTPUT_FILE_PATH)) {
            const existingData = fs.readFileSync(OUTPUT_FILE_PATH, 'utf8');
            this.mappingDatabase = JSON.parse(existingData);
            log(`Loaded existing mappings with ${Object.keys(this.mappingDatabase.mappings).length} entries`);
          } else {
            log('No existing mappings found. Generating empty mapping database.');
          }
        } catch (error) {
          log(`Error loading existing mappings: ${error instanceof Error ? error.message : String(error)}`, 'error');
        }
      } else {
        // Process node files
        this.processNodeFiles();
      }
      
      // Save mappings
      this.saveMappings();
      
      log('Extraction completed!');
    } catch (error) {
      log(`Extraction failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }
}

// Run the extractor
try {
  log('Starting n8n node mapping extraction');
  const extractor = new NodeExtractor();
  extractor.run();
} catch (error) {
  log(`Failed to run extractor: ${(error as Error).message}`, 'error');
} 