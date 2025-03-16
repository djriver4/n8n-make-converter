/**
 * Node Mapper Utility
 * 
 * Provides functionality to convert nodes between n8n and Make.com formats
 * using a mapping database.
 */

import { NodeMapping, NodeMappingDatabase, ParameterMapping } from './schema';
import { N8nNode, MakeModule, ParameterValue } from './node-types';
// Create a simple console logger for now to fix the import error
const logger = {
  info: (message: string, ...args: any[]) => console.info(`[INFO] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`[DEBUG] ${message}`, ...args)
};
import { NodeParameterProcessor } from '../converters/parameter-processor';
import { evaluateExpression, isExpression, extractExpressionContent, convertMakeExpressionToN8n } from '../expression-evaluator';
import { generateNodeId } from '../utils/typescript-utils';

/**
 * Direction of node mapping conversion
 */
export enum MappingDirection {
  N8N_TO_MAKE = 'n8n_to_make',
  MAKE_TO_N8N = 'make_to_n8n'
}

/**
 * Error thrown when node mapping fails
 */
export class NodeMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NodeMappingError';
  }
}

/**
 * Options for node conversion
 */
export interface ConversionOptions {
  /**
   * Whether to transform parameter values according to mapping rules
   */
  transformParameterValues?: boolean;
  
  /**
   * Whether to evaluate expressions
   */
  evaluateExpressions?: boolean;
  
  /**
   * Context for expression evaluation
   */
  expressionContext?: any;
  
  /**
   * Include debug information
   */
  debug?: boolean;
  
  /**
   * Copy parameters that don't have explicit mappings
   */
  copyNonMappedParameters?: boolean;
}

/**
 * Result of a node conversion operation
 */
export interface ConversionResult {
  /**
   * The converted node
   */
  node: Record<string, any>;
  
  /**
   * Debug information if requested
   */
  debug?: any;
}

/**
 * Node mapper class for converting between n8n and Make.com node formats
 * 
 * This class is responsible for:
 * 1. Finding the appropriate mapping for a node type
 * 2. Converting parameters between formats
 * 3. Transforming parameter values as needed
 * 4. Handling expressions in parameter values
 */
export class NodeMapper {
  private mappingDatabase: NodeMappingDatabase;
  
  /**
   * Create a new NodeMapper
   * 
   * @param mappingDatabase - Database of node mappings (optional)
   */
  constructor(mappingDatabase?: NodeMappingDatabase) {
    this.mappingDatabase = mappingDatabase || {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      mappings: {}
    };
    logger.info('NodeMapper initialized');
  }
  
  /**
   * Get a node mapping by n8n node type
   * 
   * @param n8nNodeType - The n8n node type to find mapping for
   * @returns The matching node mapping or undefined if not found
   */
  getNodeMappingByN8nType(n8nNodeType: string): NodeMapping | undefined {
    // Find the mapping by source node type
    return Object.values(this.mappingDatabase.mappings).find(
      (mapping) => mapping.sourceNodeType === n8nNodeType && mapping.source === 'n8n'
    );
  }
  
  /**
   * Get the mapping for a Make.com module ID
   * 
   * @param makeModuleId - The Make.com module ID to find mapping for
   * @returns The matching node mapping or undefined if not found
   */
  getNodeMappingByMakeId(makeModuleId: string | undefined): NodeMapping | undefined {
    if (!makeModuleId) return undefined;
    
    // Add debug logging
    logger.debug(`Looking for Make module mapping with ID: ${makeModuleId}`);
    
    // Try multiple formats:
    // 1. Exact match (e.g. "http:ActionSendData")
    // 2. Module prefix only (e.g. "http" from "http:ActionSendData")
    // 3. For builtin:SetVariable, try special cases
    
    // Case 1: Exact match on sourceNodeType
    let mapping = Object.values(this.mappingDatabase.mappings).find(
      (m) => m.sourceNodeType === makeModuleId && m.source === 'make'
    );
    
    if (mapping) {
      logger.debug(`Found mapping for ${makeModuleId} with exact match: ${mapping.targetNodeType}`);
      return mapping;
    }
    
    // Case 2: Try with just the prefix if this is a prefixed module ID
    if (makeModuleId.includes(':')) {
      const prefix = makeModuleId.split(':')[0];
      logger.debug(`No exact match, trying with prefix: ${prefix}`);
      
      mapping = Object.values(this.mappingDatabase.mappings).find(
        (m) => m.sourceNodeType === prefix && m.source === 'make'
      );
      
      if (mapping) {
        logger.debug(`Found mapping for ${makeModuleId} using prefix ${prefix}: ${mapping.targetNodeType}`);
        return mapping;
      }
    }
    
    // Case 3: Special case for builtin:SetVariable
    if (makeModuleId === 'builtin:SetVariable' || makeModuleId === 'builtin' && makeModuleId.includes('SetVariable')) {
      logger.debug(`Checking for setVariable mapping for builtin:SetVariable`);
      
      mapping = Object.values(this.mappingDatabase.mappings).find(
        (m) => m.sourceNodeType === 'setVariable' && m.source === 'make'
      );
      
      if (mapping) {
        logger.debug(`Found setVariable mapping for builtin:SetVariable: ${mapping.targetNodeType}`);
        return mapping;
      }
    }
    
    // Case 4: Check if this is a suffix matching a special case mapping
    if (makeModuleId.includes('SetVariable')) {
      logger.debug(`Module ID contains SetVariable, checking for setVariable mapping`);
      
      mapping = Object.values(this.mappingDatabase.mappings).find(
        (m) => m.sourceNodeType === 'setVariable' && m.source === 'make'
      );
      
      if (mapping) {
        logger.debug(`Found setVariable mapping for ${makeModuleId}: ${mapping.targetNodeType}`);
        return mapping;
      }
    }
    
    // No mapping found after all attempts
    logger.debug(`No mapping found for Make module ID: ${makeModuleId}`);
    logger.debug(`Available mappings: ${Object.keys(this.mappingDatabase.mappings).join(', ')}`);
    
    return undefined;
  }
  
  /**
   * Get a mapped node type for the given source type and direction
   * 
   * @param sourceType - The source node type
   * @param direction - Direction of mapping (n8n to make or vice versa)
   * @returns Object with mapped type information and validity
   */
  getMappedNode(
    sourceType: string,
    direction: MappingDirection
  ): { isValid: boolean; mappedType?: string } {
    let mapping: NodeMapping | undefined;
    
    if (direction === MappingDirection.N8N_TO_MAKE) {
      mapping = this.getNodeMappingByN8nType(sourceType);
    } else if (direction === MappingDirection.MAKE_TO_N8N) {
      mapping = this.getNodeMappingByMakeId(sourceType);
    }
    
    if (!mapping) {
      return { isValid: false };
    }
    
    return {
      isValid: true,
      mappedType: mapping.targetNodeType
    };
  }
  
  /**
   * Transform a parameter value based on its type and the transformation direction
   * 
   * @param value - The value to transform
   * @param sourceFormat - Source format ('n8n' or 'make')
   * @param targetFormat - Target format ('n8n' or 'make')
   * @param parameterType - Optional parameter type for specialized transformations
   * @returns The transformed value
   */
  transformParameterValue(
    value: any, 
    sourceFormat: 'n8n' | 'make', 
    targetFormat: 'n8n' | 'make',
    parameterType?: string
  ): any {
    // Handle null and undefined
    if (value === null || value === undefined) {
      return value;
    }
    
    // Handle expression transformations
    if (typeof value === 'string' && isExpression(value)) {
      return this.transformExpression(value, sourceFormat, targetFormat);
    }
    
    // Handle arrays - transform each element
    if (Array.isArray(value)) {
      return value.map(item => this.transformParameterValue(item, sourceFormat, targetFormat, parameterType));
    }
    
    // Handle objects - transform each property
    if (typeof value === 'object' && value !== null) {
      const result: Record<string, any> = {};
      for (const key of Object.keys(value)) {
        result[key] = this.transformParameterValue(value[key], sourceFormat, targetFormat, parameterType);
      }
      return result;
    }
    
    // For boolean parameters being converted from n8n to Make
    if (typeof value === 'boolean' && sourceFormat === 'n8n' && targetFormat === 'make') {
      // Some Make.com APIs expect booleans as strings ('0'/'1')
      return value ? '1' : '0';
    }
    
    // For string boolean representations being converted from Make to n8n
    if (typeof value === 'string' && sourceFormat === 'make' && targetFormat === 'n8n') {
      if (value === '1' || value === 'true') {
        return true;
      }
      if (value === '0' || value === 'false') {
        return false;
      }
    }
    
    // Handle date transformations
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return this.transformDateFormat(value, sourceFormat, targetFormat);
    }
    
    // Return the value unchanged for other types
    return value;
  }
  
  /**
   * Transform an expression between n8n and Make.com formats
   * 
   * @param expression - The expression to transform
   * @param sourceFormat - Source format ('n8n' or 'make')
   * @param targetFormat - Target format ('n8n' or 'make')
   * @returns Transformed expression
   */
  private transformExpression(
    expression: string,
    sourceFormat: 'n8n' | 'make',
    targetFormat: 'n8n' | 'make'
  ): string {
    // Extract the expression content without delimiters
    const content = extractExpressionContent(expression);
    
    if (sourceFormat === 'n8n' && targetFormat === 'make') {
      // n8n to Make.com transformation
      
      // Replace n8n references with Make.com equivalents
      let makeContent = content
        .replace(/\$json\./g, '1.') // $json.property -> 1.property
        .replace(/\$node\["(.+?)"\]\.(.+?)/g, '$1.$2') // $node["NodeName"].output.data.property -> NodeName.property
        .replace(/\$binary\./g, 'binary.') // Keep binary references
        .replace(/\$parameter\./g, 'parameters.') // $parameter.param -> parameters.param
        .replace(/\$env\./g, 'env.'); // Keep environment variables
      
      // Format according to Make.com expression syntax
      return `{{${makeContent}}}`;
    } 
    else if (sourceFormat === 'make' && targetFormat === 'n8n') {
      // Make.com to n8n transformation
      
      // Replace Make.com references with n8n equivalents
      let n8nContent = content
        .replace(/(\d+)\./g, '$json.') // 1.property -> $json.property
        .replace(/(\w+)\.(\w+)/g, (match, nodeName, property) => {
          // If it's a specific node reference, transform to n8n format
          if (!['$json', '$node', '$binary', '$parameter', '$env'].includes(nodeName)) {
            return `$node["${nodeName}"].${property}`;
          }
          return match;
        })
        .replace(/binary\./g, '$binary.') // binary.data -> $binary.data
        .replace(/parameters\./g, '$parameter.') // parameters.param -> $parameter.param
        .replace(/env\./g, '$env.'); // env.API_KEY -> $env.API_KEY
      
      // Format according to n8n expression syntax
      return `={{${n8nContent}}}`;
    }
    
    // If formats are the same, return original
    return expression;
  }
  
  /**
   * Transform a date string between n8n and Make.com formats
   * 
   * @param value - The date string to transform
   * @param sourceFormat - Source format ('n8n' or 'make')
   * @param targetFormat - Target format ('n8n' or 'make') 
   * @returns Transformed date string
   */
  private transformDateFormat(
    value: string,
    sourceFormat: 'n8n' | 'make',
    targetFormat: 'n8n' | 'make'
  ): string {
    try {
      const date = new Date(value);
      
      // n8n typically uses ISO format
      if (targetFormat === 'n8n') {
        return date.toISOString();
      }
      
      // Make.com also typically uses ISO, but some modules might have different requirements
      if (targetFormat === 'make') {
        return date.toISOString();
      }
      
      // Default: return the original value
      return value;
    } catch (e) {
      logger.warn(`Failed to transform date format: ${value}`, e);
      return value;
    }
  }
  
  /**
   * Normalizes position data to ensure consistent format
   * 
   * @param position - Position data which could be in various formats
   * @returns A normalized [x, y] tuple
   */
  private normalizePosition(position: any): [number, number] {
    if (!position) return [0, 0]; // Default position
    
    if (Array.isArray(position)) {
      // Ensure array has exactly two elements
      return [
        typeof position[0] === 'number' ? position[0] : 0,
        typeof position[1] === 'number' ? position[1] : 0
      ];
    }
    
    if (typeof position === 'object') {
      // Handle object format {x: number, y: number}
      return [
        typeof position.x === 'number' ? position.x : 0,
        typeof position.y === 'number' ? position.y : 0
      ];
    }
    
    return [0, 0]; // Fallback
  }
  
  /**
   * Convert an n8n node to a Make.com module
   * 
   * This method handles the complete conversion process:
   * 1. Find the mapping for the node type
   * 2. Create the basic module structure
   * 3. Map parameters according to the mapping rules
   * 4. Transform values as needed
   * 5. Apply any custom transformations
   * 
   * @param n8nNode - The n8n node to convert
   * @param options - Conversion options
   * @returns Result containing the converted Make.com module
   */
  convertN8nNodeToMakeModule(
    n8nNode: Record<string, any>,
    options: ConversionOptions = {}
  ): ConversionResult {
    const nodeType = n8nNode.type;
    
    // Get the mapping for this node type
    const mapping = this.getNodeMappingByN8nType(nodeType);
      
    if (!mapping) {
      // Special case for comment nodes - convert to helper:Note in Make
      if (nodeType === 'n8n-nodes-base.comment' || nodeType === 'n8n-nodes-base.stickyNote') {
        logger.info('No mapping found for Comment node, using helper:Note module mapping');
        
        // Extract parameters from the n8n node
        const nodeParams = n8nNode.parameters || {};
        
        // Create a base Make module for a note
        const makeModule: Record<string, any> = {
          id: n8nNode.id,
          name: n8nNode.name || 'Note',
          label: n8nNode.name || 'Note',
          module: 'helper:Note',
          type: 'helper',
          parameters: {},
          mapper: {
            note: nodeParams.note || nodeParams.content || 'Converted from n8n Comment'
          }
        };
        
        // Copy position if available
        if (n8nNode.position) {
          makeModule.position = this.normalizePosition(n8nNode.position);
        }
        
        return {
          node: makeModule,
          debug: {
            usedFallback: true,
            nodeType
          }
        };
      }
      
      // Special case for switch nodes - convert to builtin:BasicRouter in Make
      if (nodeType === 'n8n-nodes-base.switch') {
        logger.info('No mapping found for Switch node, using builtin:BasicRouter module mapping');
        
        // Extract parameters from the n8n node
        const nodeParams = n8nNode.parameters || {};
        const rules = nodeParams.rules?.conditions || [];
        
        // Create a base Make module for a router
        const makeModule: Record<string, any> = {
          id: n8nNode.id,
          name: n8nNode.name || 'Router',
          label: n8nNode.name || 'Router',
          module: 'builtin:BasicRouter',
          type: 'builtin',
          parameters: {},
          mapper: {},
          routes: rules.map((rule: any, index: number) => {
            return {
              sourceId: n8nNode.id,
              targetId: '', // Will be filled in by the workflow converter
              label: `Route ${index + 1}`,
              condition: {
                left: rule.value1 || '',
                operator: rule.operation || 'equal',
                right: rule.value2 || ''
              }
            };
          })
        };
        
        // Copy position if available
        if (n8nNode.position) {
          makeModule.position = this.normalizePosition(n8nNode.position);
        }
        
        return {
          node: makeModule,
          debug: {
            usedFallback: true,
            nodeType
          }
        };
      }
      
      // Special case for webhook nodes - convert to webhooks:CustomWebhook in Make
      if (nodeType === 'n8n-nodes-base.webhook') {
        logger.info('No mapping found for Webhook node, using webhooks:CustomWebhook module mapping');
        
        // Extract parameters from the n8n node
        const nodeParams = n8nNode.parameters || {};
        
        // Create a base Make module for a webhook
        const makeModule: Record<string, any> = {
          id: n8nNode.id,
          name: n8nNode.name || 'Webhook',
          label: n8nNode.name || 'Webhook', 
          module: 'webhooks:CustomWebhook',
          type: 'webhooks',
          parameters: {},
          mapper: {
            method: nodeParams.httpMethod || 'GET',
            url: nodeParams.path || 'webhook',
            responseType: nodeParams.responseMode || 'onReceived',
            responseData: nodeParams.responseData || 'firstEntryJson'
          }
        };
        
        // Copy position if available
        if (n8nNode.position) {
          makeModule.position = this.normalizePosition(n8nNode.position);
        }
        
        return {
          node: makeModule,
          debug: {
            usedFallback: true,
            nodeType
          }
        };
      }
      
      throw new NodeMappingError(`No mapping found for n8n node type: ${nodeType}`);
    }
    
    // Create the base Make module
    const makeModule: Record<string, any> = {
      id: n8nNode.id,
      name: n8nNode.name || `Converted ${nodeType}`,
      type: mapping.targetNodeType,
      parameters: {},
    };
    
    // Copy position if available
    if (n8nNode.position) {
      makeModule.position = this.normalizePosition(n8nNode.position);
    }
    
    // Special handling for Set node
    if (nodeType === 'n8n-nodes-base.set') {
      this.processSetNodeToSetVariableModule(n8nNode, makeModule, options);
    } else {
      // Standard parameter processing for other node types
      if (n8nNode.parameters) {
        this.processN8nParameters(n8nNode.parameters, makeModule.parameters, mapping, options);
      }
    }
    
    // Apply any custom transformations defined in the mapping
    if (mapping.customTransform && typeof mapping.customTransform === 'function') {
      try {
        const customResult = mapping.customTransform(n8nNode, options.expressionContext);
        // Merge the custom result with our base result
        Object.assign(makeModule, customResult);
      } catch (error) {
        logger.error(`Error in custom transform for ${nodeType}:`, error);
      }
    }
    
    // Return the result
    const result: ConversionResult = {
      node: makeModule
    };
    
    // Include debug info if requested
    if (options.debug) {
      result.debug = {
        sourceNode: n8nNode,
        mapping,
        options
      };
    }
    
    return result;
  }
  
  /**
   * Special handler for converting n8n Set node to Make.com setVariable module
   * This handles the specific data structure differences between these node types
   * 
   * @param n8nNode - The n8n Set node
   * @param makeModule - The Make.com setVariable module being created
   * @param options - Conversion options
   */
  private processSetNodeToSetVariableModule(
    n8nNode: Record<string, any>,
    makeModule: Record<string, any>,
    options: ConversionOptions
  ): void {
    // Initialize the variables object for the setVariable module
    makeModule.parameters.variables = {};
    
    // Handle case where values might be an object with key-value pairs
    if (n8nNode.parameters && n8nNode.parameters.values && typeof n8nNode.parameters.values === 'object') {
      const values = n8nNode.parameters.values;
      
      // Convert from n8n's format to Make's object format
      for (const [key, config] of Object.entries(values)) {
        if (typeof config === 'object' && config !== null && 'value' in config) {
          const typedConfig = config as Record<string, any>;
          let value = typedConfig.value;
          
          // Transform the value if needed
          if (options.transformParameterValues && typeof value === 'string') {
            if (value.startsWith('={{') && value.endsWith('}}')) {
              // Extract the expression content
              const content = value.slice(3, -2).trim();
              // Replace $json references with numeric references (1.xxx)
              const convertedJson = content.replace(/\$json\.(\w+)/g, '1.$1');
              // Replace $workflow references with numeric references (1.xxx)
              const converted = convertedJson.replace(/\$workflow\.(\w+)/g, '1.$1');
              value = `{{${converted}}}`;
            } else if (value.includes('{{') && value.includes('}}')) {
              // Handle embedded expressions correctly
              value = value.replace(/{{\s*(.+?)\s*}}/g, (match: string, content: string) => {
                const convertedJson = content.replace(/\$json\.(\w+)/g, '1.$1');
                const convertedWorkflow = convertedJson.replace(/\$workflow\.(\w+)/g, '1.$1');
                return `{{${convertedWorkflow}}}`;
              });
            } else if (value.includes('=$json.') || value.includes('=$workflow.')) {
              // Handle embedded expressions with equals sign prefix
              value = value.replace(/=\$json\.(\w+)/g, '{{1.$1}}')
                           .replace(/=\$workflow\.(\w+)/g, '{{1.$1}}');
            }
          }
          
          // Store the converted value in Make format
          makeModule.parameters.variables[key] = { value };
        }
      }
    } 
    // Handle case where values might be direct parameters
    else if (n8nNode.parameters) {
      // Convert any direct parameters
      for (const [key, value] of Object.entries(n8nNode.parameters)) {
        // Skip internal properties or metadata
        if (key === 'values' || key === 'Content-Type') continue;
        
        let convertedValue = value;
        
        // Transform the value if needed
        if (options.transformParameterValues && typeof value === 'string') {
          if (value.startsWith('={{') && value.endsWith('}}')) {
            // Extract the expression content
            const content = value.slice(3, -2).trim();
            // Replace $json references with numeric references (1.xxx)
            const convertedJson = content.replace(/\$json\.(\w+)/g, '1.$1');
            // Replace $workflow references with numeric references (1.xxx)
            const converted = convertedJson.replace(/\$workflow\.(\w+)/g, '1.$1');
            convertedValue = `{{${converted}}}`;
          } else if (typeof convertedValue === 'string' && convertedValue.includes('{{') && convertedValue.includes('}}')) {
            // Handle embedded expressions correctly
            convertedValue = convertedValue.replace(/{{\s*(.+?)\s*}}/g, (match: string, content: string) => {
              const convertedJson = content.replace(/\$json\.(\w+)/g, '1.$1');
              const convertedWorkflow = convertedJson.replace(/\$workflow\.(\w+)/g, '1.$1');
              return `{{${convertedWorkflow}}}`;
            });
          } else if (typeof convertedValue === 'string' && (convertedValue.includes('=$json.') || convertedValue.includes('=$workflow.'))) {
            // Handle embedded expressions with equals sign prefix
            convertedValue = convertedValue.replace(/=\$json\.(\w+)/g, '{{1.$1}}')
                                           .replace(/=\$workflow\.(\w+)/g, '{{1.$1}}');
          }
        }
        
        // Store the converted value in Make format
        makeModule.parameters.variables[key] = { value: convertedValue };
      }
    }
  }
  
  /**
   * Process parameters from n8n to Make.com format
   * 
   * @param sourceParams - The source n8n parameters
   * @param targetParams - The target Make.com parameters
   * @param mapping - The node mapping to use
   * @param options - Conversion options
   */
  private processN8nParameters(
    sourceParams: Record<string, any>,
    targetParams: Record<string, any>,
    mapping: NodeMapping,
    options: ConversionOptions
  ): void {
    // Check if parameterMappings exists
    if (mapping.parameterMappings) {
      // Process each parameter
      for (const [sourcePath, paramMapping] of Object.entries(mapping.parameterMappings)) {
        const sourceValue = this.getNestedValue(sourceParams, sourcePath);
        
        // Skip undefined values
        if (sourceValue === undefined) continue;
        
        let value = sourceValue;
        
        // Evaluate expressions if requested
        if (options.evaluateExpressions && typeof value === 'string' && isExpression(value)) {
          try {
            const expressionContent = extractExpressionContent(value);
            value = evaluateExpression(expressionContent, options.expressionContext || {});
            
            // If evaluation returns undefined or null, use the original
            if (value === undefined || value === null) {
              value = sourceValue;
            }
          } catch (error) {
            logger.warn(`Error evaluating expression "${value}":`, error);
            // Use original value if evaluation fails
            value = sourceValue;
          }
        }
        
        // Transform the value if needed and requested
        if (options.transformParameterValues) {
          // First try custom transform if defined
          if (paramMapping.transform) {
            value = this.applyTransformation(value, paramMapping.transform);
          } else {
            // Otherwise apply standard transform based on type
            value = this.transformParameterValue(value, 'n8n', 'make');
          }
        }
        
        // Set the value in the target structure
        this.setNestedValue(targetParams, paramMapping.targetPath, value);
      }
    }
    
    // Copy additional parameters that aren't mapped
    if (options.copyNonMappedParameters) {
      // Check if parameterMappings exists, if not use empty object for comparison
      const mappedSourcePaths = mapping.parameterMappings ? Object.keys(mapping.parameterMappings) : [];
      
      for (const [key, value] of Object.entries(sourceParams)) {
        // Skip already mapped parameters
        if (mappedSourcePaths.some(path => path === key || path.startsWith(`${key}.`))) {
          continue;
        }
        
        // Copy value, applying transformations
        let transformedValue = value;
        if (options.transformParameterValues) {
          transformedValue = this.transformParameterValue(value, 'n8n', 'make');
        }
        
        targetParams[key] = transformedValue;
      }
    }
  }
  
  /**
   * Convert a Make module to an n8n node
   * 
   * This method handles the complete conversion process:
   * 1. Find the mapping for the module type
   * 2. Create the basic node structure
   * 3. Map parameters according to the mapping rules
   * 4. Transform values as needed
   * 5. Apply any custom transformations
   * 
   * @param makeModule - The Make module to convert
   * @param options - Conversion options
   * @returns Result containing the converted n8n node
   */
  convertMakeModuleToN8nNode(makeModule: MakeModule, options: ConversionOptions = {}): ConversionResult {
    try {
      // Ensure makeModule object is valid
      if (!makeModule) {
        throw new Error('Invalid makeModule: Module object is undefined or null');
      }

      // Start with type if available, otherwise use a default value of 'unknown' (not empty string)
      let moduleType = makeModule.type !== undefined ? makeModule.type : 'unknown';
      let fullModuleString = '';
      
      // If module property exists, extract both the prefix and full string
      if (makeModule.module) {
        fullModuleString = makeModule.module;
        
        // If module is a simple string without colons, use it directly as the module type
        if (!makeModule.module.includes(':')) {
          moduleType = makeModule.module;
          logger.debug(`Using module value directly as type: ${moduleType}`);
        } else {
          const parts = makeModule.module.split(':');
          const prefix = parts[0];
          
          // Special case for builtin:SetVariable - prioritize using 'setVariable' type if available
          if (prefix === 'builtin' && makeModule.module.includes('SetVariable')) {
            if (makeModule.type === 'setVariable') {
              moduleType = 'setVariable';
              logger.debug(`Using 'setVariable' type for builtin:SetVariable module`);
            } else {
              // Only override moduleType with prefix if it's empty
              moduleType = moduleType || 'setVariable';
              logger.debug(`Using 'setVariable' type for ${makeModule.module}`);
            }
          } 
          // Special case for webhook modules
          else if (prefix === 'webhook' || prefix === 'webhooks') {
            moduleType = moduleType || 'webhook';
            logger.debug(`Using 'webhook' type for ${makeModule.module}`);
          }
          // Default case: Only use prefix if type is not already set
          else if (!moduleType) {
            moduleType = prefix;
            logger.debug(`Using prefix '${prefix}' from module string: ${makeModule.module}`);
          }
        }
      }
      
      logger.debug(`Module type determined: ${moduleType}, full module: ${fullModuleString}`);
      
      // Try to find the mapping for this module type
      let mapping = this.getNodeMappingByMakeId(moduleType);
      
      // If no mapping found with the moduleType, try with the full module string
      if (!mapping && fullModuleString) {
        logger.debug(`No mapping found for ${moduleType}, trying with full module string: ${fullModuleString}`);
        mapping = this.getNodeMappingByMakeId(fullModuleString);
      }
      
      // Special case for setVariable modules
      if (!mapping && (moduleType === 'setVariable' || fullModuleString.includes('SetVariable'))) {
        logger.info(`No mapping found for setVariable module, using default Set node mapping`);
        return this.createSetVariableNode(makeModule, options);
      }
      
      // Special case for webhook modules
      if (!mapping && (moduleType === 'webhook' || fullModuleString.includes('webhook') || fullModuleString.includes('webhooks'))) {
        logger.info(`No mapping found for webhook module, using default Webhook node mapping`);
        return this.createWebhookNode(makeModule);
      }
      
      // Special case for HTTP modules - more thorough detection of HTTP module types
      if (!mapping && (
          moduleType === 'http' || 
          moduleType === 'HTTP' || 
          fullModuleString?.includes('http:') || 
          fullModuleString?.includes('HTTP:') || 
          makeModule.name?.toLowerCase() === 'http'
        )) {
        logger.info('Converting HTTP module using enhanced HTTP mapping');
        
        // Extract parameters from the Make module
        const makeParams = makeModule.parameters || {};
        const mapper = makeModule.mapper || {};
        
        // Use NodeParameterProcessor to convert parameters properly
        const convertedParams = NodeParameterProcessor.convertMakeToN8nParameters(makeParams, options.expressionContext);
        
        // Create a base n8n node for HTTP Request
        const n8nNode: N8nNode = {
          id: makeModule.id ? String(makeModule.id) : generateNodeId(),
          name: makeModule.name || makeModule.label || 'HTTP Request',
          type: 'n8n-nodes-base.httpRequest',
          parameters: {},
          typeVersion: 1
        };
        
        // Handle URL parameter (case-insensitive)
        n8nNode.parameters.url = 
          mapper.url || mapper.URL || 
          makeParams.url || makeParams.URL || 
          '';
        
        // Handle method parameter (case-insensitive)
        n8nNode.parameters.method = 
          mapper.method || mapper.METHOD || 
          makeParams.method || makeParams.METHOD || 
          'GET';

        // Transform expressions in URL parameter
        if (n8nNode.parameters.url && typeof n8nNode.parameters.url === 'string' && 
            n8nNode.parameters.url.includes('{{') && n8nNode.parameters.url.includes('}}')) {
          // Convert Make.com expressions to n8n expressions
          const urlParam = n8nNode.parameters.url;
          const convertedUrl = convertMakeExpressionToN8n(urlParam);
          n8nNode.parameters.url = convertedUrl;
          logger.debug(`Converted URL parameter from "${urlParam}" to "${convertedUrl}"`);
        }

        // Only set authentication if it's not "none" and not empty/undefined
        const auth = mapper.authentication || makeParams.authentication;
        if (auth && auth !== 'none') {
          n8nNode.parameters.authentication = auth;
        }
        
        // Handle headers if they exist
        if (mapper.headers || makeParams.headers || convertedParams.headers) {
          n8nNode.parameters.headers = mapper.headers || makeParams.headers || convertedParams.headers || {};
        }
        
        // Handle authentication if specified
        if (mapper.authentication || makeParams.authentication) {
          const authConfig = typeof mapper.authentication === 'string' 
            ? { type: mapper.authentication } 
            : mapper.authentication || makeParams.authentication || { type: 'none' };
          
          const authType = (authConfig.type || 'none').toLowerCase();
          
          // Only set credentials if authentication type is not 'none'
          if (authType !== 'none') {
            if (authType === 'basic' || authType === 'basicauth') {
              n8nNode.parameters.authentication = 'basicAuth';
              n8nNode.credentials = {
                httpBasicAuth: {
                  username: mapper.username || makeParams.username || convertedParams.username || '',
                  password: mapper.password || makeParams.password || convertedParams.password || ''
                }
              };
              logger.debug('Added Basic Auth credentials to HTTP node');
            } else if (authType === 'header' || authType === 'headerauth') {
              n8nNode.parameters.authentication = 'headerAuth';
              n8nNode.credentials = {
                httpHeaderAuth: {
                  name: authConfig.name || 'Authorization',
                  value: authConfig.value || ''
                }
              };
              logger.debug('Added Header Auth credentials to HTTP node');
            } else if (authType === 'oauth2' || authType === 'oauth') {
              n8nNode.parameters.authentication = 'oAuth2';
              n8nNode.credentials = {
                oAuth2Api: {
                  accessToken: authConfig.accessToken || '',
                  refreshToken: authConfig.refreshToken || '',
                  tokenType: authConfig.tokenType || 'Bearer'
                }
              };
              logger.debug('Added OAuth2 credentials to HTTP node');
            } else if (authType === 'apikey' || authType === 'queryauth') {
              n8nNode.parameters.authentication = 'queryAuth';
              n8nNode.credentials = {
                httpQueryAuth: {
                  name: authConfig.name || 'api_key',
                  value: authConfig.value || ''
                }
              };
              logger.debug('Added Query Auth credentials to HTTP node');
            }
          }
        }
        
        // Only add options if they are explicitly provided
        if (makeParams.options || mapper.options) {
          n8nNode.parameters.options = makeParams.options || mapper.options || {};
        }
        
        // Copy position if available
        if (makeModule.position) {
          n8nNode.position = this.normalizePosition(makeModule.position);
        }
        
        // Return the result
        return {
          node: n8nNode,
          debug: options.debug ? {
            sourceModule: makeModule,
            options,
            note: 'Used enhanced HTTP mapping'
          } : undefined
        };
      }
      
      // Special case for JSON modules
      if (!mapping && (moduleType === 'json' || fullModuleString === 'json')) {
        logger.info('Converting JSON module to JSON Parse node');
        
        // Extract parameters from the Make module
        const mapper = makeModule.mapper || {};
        
        // Create a base n8n node for JSON Parse
        const n8nNode: N8nNode = {
          id: makeModule.id ? String(makeModule.id) : generateNodeId(),
          name: makeModule.name || makeModule.label || 'JSON Parse',
          type: 'n8n-nodes-base.jsonParse',
          parameters: {
            property: mapper.parsedObject || '{{$json.data}}'
          },
          typeVersion: 1
        };
        
        // Set position
        n8nNode.position = [0, 0];
        
        return {
          node: n8nNode,
          debug: {
            moduleType,
            fullModuleString
          }
        };
      }
      
      // Special case for Function/Tools modules
      if (!mapping && (moduleType === 'tools' || fullModuleString === 'tools')) {
        logger.info('Converting Tools module to Function node');
        
        // Extract parameters from the Make module
        const mapper = makeModule.mapper || {};
        
        // Create a base n8n node for Function
        const n8nNode: N8nNode = {
          id: makeModule.id ? String(makeModule.id) : generateNodeId(),
          name: makeModule.name || makeModule.label || 'Function',
          type: 'n8n-nodes-base.function',
          parameters: {
            functionCode: mapper.code || '// Add code here\nreturn items;'
          },
          typeVersion: 1
        };
        
        // Set position
        n8nNode.position = [0, 0];
        
        return {
          node: n8nNode,
          debug: {
            moduleType,
            fullModuleString
          }
        };
      }
      
      if (!mapping) {
        // Create a placeholder node instead of throwing an error
        logger.warn(`No mapping found for Make.com module type: ${moduleType || 'undefined'}. Creating placeholder node.`);
        
        // Create a placeholder node that clearly indicates it's unmapped
        const n8nNode: N8nNode = {
          id: makeModule.id ? String(makeModule.id) : generateNodeId(),
          name: `[Unmapped] ${makeModule.name || makeModule.label || (moduleType ? moduleType : 'Unknown')}`,
          type: 'n8n-nodes-base.noOp',
          parameters: {
            __stubInfo: {
              originalModuleType: moduleType || 'custom',
              fullModuleString: fullModuleString || '',
              originalName: makeModule.name || makeModule.label || ''
            } as unknown as ParameterValue, // Type assertion to satisfy ParameterValue
            displayName: makeModule.name || makeModule.label || moduleType,
            notes: `This is a placeholder for an unmapped Make.com module of type "${moduleType || 'undefined'}"`
          },
          typeVersion: 1
        };
        
        // Copy position if available
        if (makeModule.position) {
          n8nNode.position = this.normalizePosition(makeModule.position);
        }
        
        // Copy all parameters from the original module to help with debugging
        if (makeModule.parameters) {
          Object.assign(n8nNode.parameters, makeModule.parameters);
        }
        
        if (makeModule.mapper) {
          // Store the mapper content in the parameters for reference
          Object.keys(makeModule.mapper).forEach(key => {
            const paramName = `__mapper_${key}`;
            n8nNode.parameters[paramName] = makeModule.mapper![key];
          });
        }
        
        // Return the placeholder node
        const result: ConversionResult = {
          node: n8nNode
        };
        
        // Include debug info if requested
        if (options.debug) {
          result.debug = {
            sourceModule: makeModule,
            options
          };
        }
        
        return result;
      }

      // Create the base n8n node
      const n8nNode: N8nNode = {
        id: makeModule.id ? String(makeModule.id) : generateNodeId(),
        name: makeModule.name || `Converted ${moduleType}`,
        type: mapping.targetNodeType,
        parameters: {},
        typeVersion: 1
      };

      // Copy position if available
      if (makeModule.position) {
        n8nNode.position = this.normalizePosition(makeModule.position);
      }

      // Special handling for setVariable module
      if (moduleType === 'setVariable') {
        this.processSetVariableModuleToSetNode(makeModule, n8nNode, options);
      } else {
        // Use NodeParameterProcessor to convert parameters
        if (makeModule.parameters) {
          n8nNode.parameters = NodeParameterProcessor.convertMakeToN8nParameters(makeModule.parameters, options.expressionContext);
          
          // Ensure headers are correctly mapped
          if (makeModule.parameters.headers) {
            n8nNode.parameters.headers = makeModule.parameters.headers;
          }
        }
      }

      // Apply any custom transformations defined in the mapping
      if (mapping.customTransform && typeof mapping.customTransform === 'function') {
        try {
          const customResult = mapping.customTransform(makeModule, options.expressionContext);
          // Merge the custom result with our base result
          Object.assign(n8nNode, customResult);
        } catch (error) {
          logger.error(`Error in custom transform for ${moduleType}:`, error);
        }
      }

      // Return the result
      const result: ConversionResult = {
        node: n8nNode
      };

      // Include debug info if requested
      if (options.debug) {
        result.debug = {
          sourceModule: makeModule,
          mapping,
          options
        };
      }

      return result;
    } catch (error: any) {
      logger.error(`Error in convertMakeModuleToN8nNode:`, error);
      throw new NodeMappingError(`Error in convertMakeModuleToN8nNode: ${error.message}`);
    }
  }

  /**
   * Special handler for converting Make.com setVariable module to n8n Set node
   * This handles the specific data structure differences between these node types
   * 
   * @param makeModule - The Make.com setVariable module
   * @param n8nNode - The n8n Set node being created
   * @param options - Conversion options
   */
  private processSetVariableModuleToSetNode(
    makeModule: Record<string, any>,
    n8nNode: Record<string, any>,
    options: ConversionOptions
  ): void {
    // Initialize the values object for the Set node
    n8nNode.parameters.values = {};
    
    // Handle case where variables might be an object with key-value pairs
    if (makeModule.parameters && makeModule.parameters.variables && typeof makeModule.parameters.variables === 'object') {
      const variables = makeModule.parameters.variables;
      
      // Convert from Make's format to n8n's object format
      for (const [key, config] of Object.entries(variables)) {
        if (typeof config === 'object' && config !== null && 'value' in config) {
          const typedConfig = config as Record<string, any>;
          let value = typedConfig.value;
          
          // Transform the value if needed
          if (options.transformParameterValues && typeof value === 'string') {
            if (value.startsWith('={{') && value.endsWith('}}')) {
              // Already in n8n format, just convert the content
              const content = value.slice(3, -2).trim();
              // Convert to n8n format
              const converted = content.replace(/(\d+)\.(\w+)/g, '$json["$2"]');
              value = `={{ ${converted} }}`;
            } else if (value.startsWith('{{') && value.endsWith('}}')) {
              // Extract the expression content
              const content = value.slice(2, -2).trim();
              // Convert Make format to n8n format
              const converted = content.replace(/(\d+)\.(\w+)/g, '$json["$2"]');
              value = `={{ ${converted} }}`;
            }
          }
          
          // Set the value in n8n format
          n8nNode.parameters.values[key] = {
            name: key,
            type: typedConfig.type || 'string',
            value: value
          };
        } else if (config !== null) {
          // Handle simple value case (not wrapped in an object)
          n8nNode.parameters.values[key] = {
            name: key,
            type: 'string',
            value: config
          };
        }
      }
    } else if (makeModule.parameters && makeModule.parameters.values) {
      // Alternative format: directly using values
      n8nNode.parameters.values = makeModule.parameters.values;
    }
    
    // Set node type
    n8nNode.type = 'n8n-nodes-base.set';
  }
  
  /**
   * Apply a transformation to a value
   * 
   * @param value - The value to transform
   * @param transform - Transformation function or name
   * @returns The transformed value
   */
  private applyTransformation(value: any, transform: string | Function): any {
    // If transform is a function, call it directly
    if (typeof transform === 'function') {
      try {
        return transform(value);
      } catch (error) {
        logger.error(`Error applying custom transformation to ${value}:`, error);
        return value;
      }
    }
    
    // Handle transform by name
    switch (transform) {
      case 'booleanToString':
        if (typeof value === 'boolean') {
          return value ? '1' : '0';
        }
        return value;
      
      case 'stringToBoolean':
        if (value === '1' || value === 'true') {
          return true;
        }
        if (value === '0' || value === 'false') {
          return false;
        }
        return value;
      
      case 'toUpperCase':
        if (typeof value === 'string') {
          return value.toUpperCase();
        }
        return value;
        
      case 'toLowerCase':
        if (typeof value === 'string') {
          return value.toLowerCase();
        }
        return value;
      
      case 'numberToString':
        if (typeof value === 'number') {
          return value.toString();
        }
        return value;
      
      case 'stringToNumber':
        if (typeof value === 'string' && !isNaN(Number(value))) {
          return Number(value);
        }
        return value;
        
      // Add more named transformations as needed
      
      default:
        logger.warn(`Unknown transformation: ${transform}`);
        return value;
    }
  }
  
  /**
   * Get a nested value from an object using a dot-notation path
   * 
   * @param obj - The object to retrieve from
   * @param path - Dot-notation path to the property
   * @returns The value at the path or undefined if not found
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    // Handle root-level properties
    if (!path.includes('.')) {
      return obj[path];
    }
    
    // Handle nested properties
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }
  
  /**
   * Set a nested value in an object using a dot-notation path
   * 
   * @param obj - The object to modify
   * @param path - Dot-notation path to the property
   * @param value - The value to set
   */
  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    // Handle root-level properties
    if (!path.includes('.')) {
      obj[path] = value;
      return;
    }
    
    // Handle nested properties
    const parts = path.split('.');
    let current = obj;
    
    // Create nested objects as needed
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }
    
    // Set the final property
    current[parts[parts.length - 1]] = value;
  }

  /**
   * Maps Make.com operators to n8n operators
   */
  private mapOperator(makeOperator: string): string {
    const operatorMap: Record<string, string> = {
      // Equality operators
      'eq': 'equal',
      'equal': 'equal',
      'equals': 'equal',
      '==': 'equal',
      '===': 'equal',
      
      // Inequality operators
      'ne': 'notEqual',
      'notEqual': 'notEqual',
      '!=': 'notEqual',
      '!==': 'notEqual',
      
      // Comparison operators
      'gt': 'larger',
      'greaterThan': 'larger',
      '>': 'larger',
      'gte': 'largerEqual',
      'greaterThanEqual': 'largerEqual',
      '>=': 'largerEqual',
      'lt': 'smaller',
      'lessThan': 'smaller',
      '<': 'smaller',
      'lte': 'smallerEqual',
      'lessThanEqual': 'smallerEqual',
      '<=': 'smallerEqual',
      
      // String operators
      'contains': 'contains',
      'includes': 'contains',
      'notContains': 'notContains',
      'doesNotContain': 'notContains',
      'startsWith': 'startsWith',
      'beginsWith': 'startsWith',
      'endsWith': 'endsWith',
      
      // Existence operators
      'isEmpty': 'isEmpty',
      'isNull': 'isEmpty',
      'isNotEmpty': 'isNotEmpty',
      'isNotNull': 'isNotEmpty',
      'exists': 'isNotEmpty',
      
      // Pattern matching
      'regex': 'regex',
      'matches': 'regex',
      'regexp': 'regex'
    };
    
    return operatorMap[makeOperator] || 'equal';
  }

  /**
   * Creates a webhook node from a Make module
   * 
   * @param makeModule - The Make webhook module to convert
   * @returns The conversion result with the webhook node
   */
  private createWebhookNode(makeModule: MakeModule): ConversionResult {
    logger.info('No mapping found for Webhooks module, using Webhook node mapping');
    
    // Extract parameters from the Make module
    const makeParams = makeModule.parameters || {};
    const mapper = makeModule.mapper || {};
    
    // Create a base n8n node for a webhook
    const n8nNode: Record<string, any> = {
      id: makeModule.id ? String(makeModule.id) : generateNodeId(),
      name: makeModule.name || makeModule.label || 'Webhook',
      type: 'n8n-nodes-base.webhook',
      parameters: {
        httpMethod: mapper.method || 'GET',
        path: mapper.url || mapper.path || makeParams.path || 'webhook',
        responseMode: 'onReceived',
        responseData: 'firstEntryJson'
      },
      typeVersion: 1
    };
    
    // Copy position if available
    if (makeModule.position) {
      n8nNode.position = this.normalizePosition(makeModule.position);
    }
    
    return {
      node: n8nNode,
      debug: {
        usedFallback: true,
        moduleType: makeModule.module || makeModule.type || 'webhook',
      }
    };
  }

  /**
   * Creates a Set node for a Make.com setVariable module when no mapping is found
   * 
   * @param makeModule - The Make.com setVariable module
   * @param options - Conversion options
   * @returns Conversion result with the created node
   */
  private createSetVariableNode(makeModule: MakeModule, options: ConversionOptions = {}): ConversionResult {
    logger.info('Creating default Set node for setVariable module');
    
    // Extract parameters from the Make module
    const makeParams = makeModule.parameters || {};
    const variables = makeParams.variables || {};
    
    // Create a base n8n node for Set
    const n8nNode: N8nNode = {
      id: makeModule.id ? String(makeModule.id) : generateNodeId(),
      name: makeModule.name || 'Set Variable',
      type: 'n8n-nodes-base.set',
      parameters: {
        mode: 'manual',
        values: {}
      },
      typeVersion: 1
    };
    
    // Convert parameters properly using the existing parameter processor
    if (Object.keys(variables).length > 0) {
      // Use the built-in parameter conversion which handles expressions
      const parameterData = {
        variables: variables
      };
      
      const convertedParams = NodeParameterProcessor.convertMakeToN8nParameters(
        parameterData, 
        options.expressionContext
      );
      
      // For Set nodes, we need to map the variables to values
      if (convertedParams.variables) {
        n8nNode.parameters.values = convertedParams.variables;
        logger.debug(`Converted variables to values: ${JSON.stringify(convertedParams.variables)}`);
      }
    }
    
    // Copy position if available
    if (makeModule.position) {
      n8nNode.position = this.normalizePosition(makeModule.position);
    }
    
    // Return the conversion result
    const result: ConversionResult = {
      node: n8nNode
    };
    
    // Include debug info if requested
    if (options.debug) {
      result.debug = {
        sourceModule: makeModule,
        options
      };
    }
    
    return result;
  }
} 