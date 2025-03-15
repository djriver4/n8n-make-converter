"use strict";
/**
 * Node Mapper Utility
 *
 * Provides functionality to convert nodes between n8n and Make.com formats
 * using a mapping database.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeMapper = exports.NodeMappingError = exports.MappingDirection = void 0;
// Create a simple console logger for now to fix the import error
const logger = {
    info: (message, ...args) => console.info(`[INFO] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ERROR] ${message}`, ...args),
    debug: (message, ...args) => console.debug(`[DEBUG] ${message}`, ...args)
};
const expression_evaluator_1 = require("../expression-evaluator");
/**
 * Direction of node mapping conversion
 */
var MappingDirection;
(function (MappingDirection) {
    MappingDirection["N8N_TO_MAKE"] = "n8n_to_make";
    MappingDirection["MAKE_TO_N8N"] = "make_to_n8n";
})(MappingDirection || (exports.MappingDirection = MappingDirection = {}));
/**
 * Error thrown when node mapping fails
 */
class NodeMappingError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NodeMappingError';
    }
}
exports.NodeMappingError = NodeMappingError;
/**
 * Node mapper class for converting between n8n and Make.com node formats
 *
 * This class is responsible for:
 * 1. Finding the appropriate mapping for a node type
 * 2. Converting parameters between formats
 * 3. Transforming parameter values as needed
 * 4. Handling expressions in parameter values
 */
class NodeMapper {
    /**
     * Create a new NodeMapper
     *
     * @param mappingDatabase - Database of node mappings (optional)
     */
    constructor(mappingDatabase) {
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
    getNodeMappingByN8nType(n8nNodeType) {
        // Find the mapping by source node type
        return Object.values(this.mappingDatabase.mappings).find((mapping) => mapping.sourceNodeType === n8nNodeType && mapping.source === 'n8n');
    }
    /**
     * Get a node mapping by Make.com module ID
     *
     * @param makeModuleId - The Make.com module ID to find mapping for
     * @returns The matching node mapping or undefined if not found
     */
    getNodeMappingByMakeId(makeModuleId) {
        // Find the mapping by source node type
        return Object.values(this.mappingDatabase.mappings).find((mapping) => mapping.sourceNodeType === makeModuleId && mapping.source === 'make');
    }
    /**
     * Get a mapped node type for the given source type and direction
     *
     * @param sourceType - The source node type
     * @param direction - Direction of mapping (n8n to make or vice versa)
     * @returns Object with mapped type information and validity
     */
    getMappedNode(sourceType, direction) {
        let mapping;
        if (direction === MappingDirection.N8N_TO_MAKE) {
            mapping = this.getNodeMappingByN8nType(sourceType);
        }
        else if (direction === MappingDirection.MAKE_TO_N8N) {
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
    transformParameterValue(value, sourceFormat, targetFormat, parameterType) {
        // Handle null and undefined
        if (value === null || value === undefined) {
            return value;
        }
        // Handle expression transformations
        if (typeof value === 'string' && (0, expression_evaluator_1.isExpression)(value)) {
            return this.transformExpression(value, sourceFormat, targetFormat);
        }
        // Handle arrays - transform each element
        if (Array.isArray(value)) {
            return value.map(item => this.transformParameterValue(item, sourceFormat, targetFormat, parameterType));
        }
        // Handle objects - transform each property
        if (typeof value === 'object' && value !== null) {
            const result = {};
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
    transformExpression(expression, sourceFormat, targetFormat) {
        // Extract the expression content without delimiters
        const content = (0, expression_evaluator_1.extractExpressionContent)(expression);
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
    transformDateFormat(value, sourceFormat, targetFormat) {
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
        }
        catch (e) {
            logger.warn(`Failed to transform date format: ${value}`, e);
            return value;
        }
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
    convertN8nNodeToMakeModule(n8nNode, options = {}) {
        const nodeType = n8nNode.type;
        // Get the mapping for this node type
        const mapping = this.getNodeMappingByN8nType(nodeType);
        if (!mapping) {
            throw new NodeMappingError(`No mapping found for n8n node type: ${nodeType}`);
        }
        // Create the base Make module
        const makeModule = {
            id: n8nNode.id,
            name: n8nNode.name || `Converted ${nodeType}`,
            type: mapping.targetNodeType,
            parameters: {},
        };
        // Copy position if available
        if (n8nNode.position) {
            makeModule.position = n8nNode.position;
        }
        // Special handling for Set node
        if (nodeType === 'n8n-nodes-base.set') {
            this.processSetNodeToSetVariableModule(n8nNode, makeModule, options);
        }
        else {
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
            }
            catch (error) {
                logger.error(`Error in custom transform for ${nodeType}:`, error);
            }
        }
        // Return the result
        const result = {
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
    processSetNodeToSetVariableModule(n8nNode, makeModule, options) {
        // Initialize the variables object for the setVariable module
        makeModule.parameters.variables = {};
        // Handle case where values might be an object with key-value pairs
        if (n8nNode.parameters && n8nNode.parameters.values && typeof n8nNode.parameters.values === 'object') {
            const values = n8nNode.parameters.values;
            // Convert from n8n's format to Make's object format
            for (const [key, config] of Object.entries(values)) {
                if (typeof config === 'object' && config !== null && 'value' in config) {
                    const typedConfig = config;
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
                        }
                        else if (value.includes('{{') && value.includes('}}')) {
                            // Handle embedded expressions correctly
                            value = value.replace(/{{\s*(.+?)\s*}}/g, (match, content) => {
                                const convertedJson = content.replace(/\$json\.(\w+)/g, '1.$1');
                                const convertedWorkflow = convertedJson.replace(/\$workflow\.(\w+)/g, '1.$1');
                                return `{{${convertedWorkflow}}}`;
                            });
                        }
                        else if (value.includes('=$json.') || value.includes('=$workflow.')) {
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
                if (key === 'values' || key === 'Content-Type')
                    continue;
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
                    }
                    else if (typeof convertedValue === 'string' && convertedValue.includes('{{') && convertedValue.includes('}}')) {
                        // Handle embedded expressions correctly
                        convertedValue = convertedValue.replace(/{{\s*(.+?)\s*}}/g, (match, content) => {
                            const convertedJson = content.replace(/\$json\.(\w+)/g, '1.$1');
                            const convertedWorkflow = convertedJson.replace(/\$workflow\.(\w+)/g, '1.$1');
                            return `{{${convertedWorkflow}}}`;
                        });
                    }
                    else if (typeof convertedValue === 'string' && (convertedValue.includes('=$json.') || convertedValue.includes('=$workflow.'))) {
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
    processN8nParameters(sourceParams, targetParams, mapping, options) {
        // Process each parameter
        for (const [sourcePath, paramMapping] of Object.entries(mapping.parameterMappings)) {
            const sourceValue = this.getNestedValue(sourceParams, sourcePath);
            // Skip undefined values
            if (sourceValue === undefined)
                continue;
            let value = sourceValue;
            // Evaluate expressions if requested
            if (options.evaluateExpressions && typeof value === 'string' && (0, expression_evaluator_1.isExpression)(value)) {
                try {
                    const expressionContent = (0, expression_evaluator_1.extractExpressionContent)(value);
                    value = (0, expression_evaluator_1.evaluateExpression)(expressionContent, options.expressionContext || {});
                    // If evaluation returns undefined or null, use the original
                    if (value === undefined || value === null) {
                        value = sourceValue;
                    }
                }
                catch (error) {
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
                }
                else {
                    // Otherwise apply standard transform based on type
                    value = this.transformParameterValue(value, 'n8n', 'make');
                }
            }
            // Set the value in the target structure
            this.setNestedValue(targetParams, paramMapping.targetPath, value);
        }
        // Copy non-mapped parameters if requested
        if (options.copyNonMappedParameters) {
            const mappedSourcePaths = Object.keys(mapping.parameterMappings);
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
     * Convert a Make.com module to an n8n node
     *
     * This method handles the complete conversion process:
     * 1. Find the mapping for the module type
     * 2. Create the basic node structure
     * 3. Map parameters according to the mapping rules
     * 4. Transform values as needed
     * 5. Apply any custom transformations
     *
     * @param makeModule - The Make.com module to convert
     * @param options - Conversion options
     * @returns Result containing the converted n8n node
     */
    convertMakeModuleToN8nNode(makeModule, options = {}) {
        try {
            const moduleType = makeModule.type;
            
            // Try to find the mapping for this module type
            const mapping = this.getNodeMappingByMakeId(moduleType);
            
            if (!mapping) {
                // Special case for HTTP modules - create a default HTTP node
                if (moduleType === 'http') {
                    console.info('No mapping found for HTTP module, using default HTTP mapping');
                    
                    // Extract parameters from the Make module
                    const makeParams = makeModule.parameters || {};
                    
                    // Use NodeParameterProcessor to convert parameters properly
                    const convertedParams = NodeParameterProcessor.convertMakeToN8nParameters(makeParams, options.expressionContext);
                    
                    // Create a base n8n node with converted parameters
                    const n8nNode = {
                        id: makeModule.id || generateNodeId(),
                        name: makeModule.name || 'HTTP',
                        type: 'n8n-nodes-base.httpRequest',
                        parameters: {
                            // Use converted parameters with fallbacks
                            url: convertedParams.url || 'https://example.com',
                            method: convertedParams.method || 'GET',
                            authentication: convertedParams.authentication || 'none',
                            headers: convertedParams.headers || {}
                        }
                    };
                    
                    // Copy position if available
                    if (makeModule.position) {
                        n8nNode.position = makeModule.position;
                    }
                    
                    return {
                        node: n8nNode,
                        debug: {
                            usedFallback: true,
                            moduleType,
                        }
                    };
                }
                
                throw new NodeMappingError(`No mapping found for Make.com module type: ${moduleType}`);
            }
            
            // Create the base n8n node
            const n8nNode = {
                id: makeModule.id,
                name: makeModule.name || `Converted ${moduleType}`,
                type: mapping.targetNodeType,
                parameters: {},
            };
            // Copy position if available
            if (makeModule.position) {
                n8nNode.position = makeModule.position;
            }
            // Special handling for setVariable module
            if (moduleType === 'setVariable') {
                this.processSetVariableModuleToSetNode(makeModule, n8nNode, options);
            }
            else {
                // Use NodeParameterProcessor to convert parameters
                const parameter_processor_1 = require('../converters/parameter-processor');
                if (makeModule.parameters) {
                    n8nNode.parameters = parameter_processor_1.NodeParameterProcessor.convertMakeToN8nParameters(makeModule.parameters, options.expressionContext);
                }
            }
            // Apply any custom transformations defined in the mapping
            if (mapping.customTransform && typeof mapping.customTransform === 'function') {
                try {
                    const customResult = mapping.customTransform(makeModule, options.expressionContext);
                    // Merge the custom result with our base result
                    Object.assign(n8nNode, customResult);
                }
                catch (error) {
                    logger.error(`Error in custom transform for ${moduleType}:`, error);
                }
            }
            // Return the result
            const result = {
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
        }
        catch (error) {
            logger.error(`Error in convertMakeModuleToN8nNode:`, error);
            throw error;
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
    processSetVariableModuleToSetNode(makeModule, n8nNode, options) {
        // Initialize the values object for the Set node
        n8nNode.parameters.values = {};
        // Handle case where variables might be an object with key-value pairs
        if (makeModule.parameters && makeModule.parameters.variables && typeof makeModule.parameters.variables === 'object') {
            const variables = makeModule.parameters.variables;
            // Convert from Make's format to n8n's object format
            for (const [key, config] of Object.entries(variables)) {
                if (typeof config === 'object' && config !== null && 'value' in config) {
                    const typedConfig = config;
                    let value = typedConfig.value;
                    // Transform the value if needed
                    if (options.transformParameterValues && typeof value === 'string') {
                        if (value.startsWith('={{') && value.endsWith('}}')) {
                            // Already in n8n format, just convert the content
                            const content = value.slice(3, -2).trim();
                            // Convert to n8n format
                            const converted = content.replace(/1\.(\w+)/g, '$json.$1');
                            value = `={{ ${converted} }}`;
                        }
                        else if (value.startsWith('{{') && value.endsWith('}}')) {
                            // Extract the expression content
                            const content = value.slice(2, -2).trim();
                            // Convert to n8n format
                            const converted = content.replace(/1\.(\w+)/g, '$json.$1');
                            value = `={{ ${converted} }}`;
                        }
                        else if (value.includes('{{') && value.includes('}}')) {
                            // Handle embedded expressions
                            value = value.replace(/{{(.+?)}}/g, (match, content) => {
                                const contentTrimmed = content.trim();
                                // Replace $json references with numeric references (1.xxx)
                                const convertedJson = contentTrimmed.replace(/\$json\.(\w+)/g, '1.$1');
                                // Replace $workflow references with numeric references (1.xxx)
                                const converted = convertedJson.replace(/\$workflow\.(\w+)/g, '1.$1');
                                return `{{${converted}}}`;
                            });
                        }
                    }
                    // Store the converted value in n8n format
                    n8nNode.parameters.values[key] = { value };
                }
            }
        }
        // Handle case where variables might be direct parameters
        else if (makeModule.parameters) {
            // Convert any direct parameters
            for (const [key, value] of Object.entries(makeModule.parameters)) {
                // Skip internal properties or metadata
                if (key === 'variables' || key === 'Content-Type')
                    continue;
                let convertedValue = value;
                // Transform the value if needed
                if (options.transformParameterValues && typeof value === 'string') {
                    if (value.startsWith('={{') && value.endsWith('}}')) {
                        // Extract the expression content
                        const content = value.slice(2, -2).trim();
                        // Convert to n8n format
                        const converted = content.replace(/1\.(\w+)/g, '$json.$1');
                        convertedValue = `={{ ${converted} }}`;
                    }
                }
                // Store the converted value in n8n format
                n8nNode.parameters.values[key] = { value: convertedValue };
            }
        }
    }
    /**
     * Apply a transformation to a value
     *
     * @param value - The value to transform
     * @param transform - Transformation function or name
     * @returns The transformed value
     */
    applyTransformation(value, transform) {
        // If transform is a function, call it directly
        if (typeof transform === 'function') {
            try {
                return transform(value);
            }
            catch (error) {
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
    getNestedValue(obj, path) {
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
    setNestedValue(obj, path, value) {
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
}
exports.NodeMapper = NodeMapper;
