/**
 * Make.com to n8n Converter
 * 
 * This module converts Make.com workflows to n8n format
 */

import { getNodeMappings } from "../mappings/node-mapping";
import { DebugTracker } from "../debug-tracker";
import logger from "../logger";
import { NodeMapper } from "../node-mappings/node-mapper";
import { NodeMappingLoader } from "../node-mappings/node-mapping-loader";

// Define interfaces for type safety
interface NodeMappingDefinition {
	type: string;
	parameterMap: Record<string, string>;
	description?: string;
	userDefined?: boolean;
	displayName?: string;
}

interface NodeMappings {
	n8nToMake: Record<string, NodeMappingDefinition>;
	makeToN8n: Record<string, NodeMappingDefinition>;
}

interface N8nNode {
	id: string | number;
	name: string;
	type: string;
	parameters: Record<string, any>;
	position: [number, number];
	typeVersion?: number;
	credentials?: Record<string, any>;
}

interface N8nConnection {
	node: string;
	type: string;
	index: number;
}

interface N8nWorkflow {
	name: string;
	nodes: N8nNode[];
	connections: Record<string, {
		main?: N8nConnection[][];
	}>;
	active: boolean;
	settings: {
		executionOrder: string;
	};
}

interface ConversionResult {
	convertedWorkflow: N8nWorkflow | Record<string, never>;
	logs: Array<{
		type: "info" | "warning" | "error";
		message: string;
	}>;
	parametersNeedingReview: string[];
}

/**
 * Convert a Make.com workflow to n8n format
 * 
 * @param makeWorkflow - The Make.com workflow to convert
 * @param debugTracker - Optional debug tracker
 * @param options - Conversion options
 * @returns A promise resolving to the conversion result
 */
export async function makeToN8n(
	makeWorkflow: any,
	debugTracker: DebugTracker,
	options: any = {}
): Promise<ConversionResult> {
	debugTracker.addLog("info", "Starting Make.com to n8n conversion");
	
	// Create default empty workflow structure
	const emptyWorkflow: N8nWorkflow = {
		name: "Empty Workflow",
		nodes: [],
		connections: {},
		active: true,
		settings: {
			executionOrder: "v1",
		}
	};
	
	try {
		// Initialize the node mapper if needed
		if (options.useEnhancedMapper) {
			const mappingLoader = NodeMappingLoader.getInstance();
			await mappingLoader.loadMappings();
			const mappingDatabase = mappingLoader.getMappings();
			const nodeMapper = new NodeMapper(mappingDatabase);
			
			// Here we could use the enhanced mapper for better conversion
			logger.info('Using enhanced node mapper for conversion');
		} else {
			// Use the simpler mapping approach from node-mapping.ts
			logger.info('Using basic node mapper for conversion');
		}

		// Validate the Make.com workflow
		if (!makeWorkflow) {
			debugTracker.addLog("error", "Invalid Make.com workflow: Source workflow is empty");
			return {
				convertedWorkflow: {},
				logs: debugTracker.getGeneralLogs(),
				parametersNeedingReview: []
			};
		}
		
		// Handle legacy format
		if (makeWorkflow.blueprint && makeWorkflow.modules) {
			debugTracker.addLog("info", "Converting legacy Make.com workflow format");
			makeWorkflow = {
				name: makeWorkflow.blueprint.name || "Legacy Workflow",
				flow: makeWorkflow.modules
			};
		}
		
		// Validate the Make.com workflow has a flow array
		if (!makeWorkflow.flow || !Array.isArray(makeWorkflow.flow)) {
			debugTracker.addLog("error", "Invalid Make.com workflow format: Missing or invalid flow array");
			return {
				convertedWorkflow: {},
				logs: debugTracker.getGeneralLogs(),
				parametersNeedingReview: []
			};
		}
		
		// Get the node mappings
		const mappings = getNodeMappings() as NodeMappings;
		
		// Create the n8n workflow structure
		const n8nWorkflow: N8nWorkflow = {
			name: makeWorkflow.name || "Converted from Make.com",
			nodes: [] as N8nNode[],
			connections: {} as Record<string, { main?: N8nConnection[][] }>,
			active: true,
			settings: {
				executionOrder: "v1",
			},
		};
		
		// Track modules that couldn't be converted
		const unconvertedModules: string[] = [];
		
		// Convert each Make.com module to an n8n node
		for (const module of makeWorkflow.flow) {
			try {
				// Skip disabled modules if specified in options
				if (options.skipDisabled && module.disabled) {
					debugTracker.addLog("info", `Skipping disabled module: ${module.label || module.name}`);
					continue;
				}
				
				// Get the module type
				const moduleType = module.module as string;
				
				// Find the mapping for this module type
				const mapping = mappings.makeToN8n[moduleType];
				
				if (!mapping) {
					// If strict mode is enabled, fail the conversion
					if (options.strictMode) {
						debugTracker.addLog("error", `Strict mode enabled: No mapping found for Make.com module type: ${moduleType}`);
						return {
							convertedWorkflow: {},
							logs: debugTracker.getGeneralLogs(),
							parametersNeedingReview: []
						};
					}
					
					// Otherwise, create a stub node
					debugTracker.addLog("warning", `Failed to convert module ${module.label || module.name}: No mapping found for Make.com module type: ${moduleType}`);
					unconvertedModules.push(module.label || module.name);
					
					// Add a placeholder node
					const placeholderNode: N8nNode = {
						id: options.preserveIds ? String(module.id) : n8nWorkflow.nodes.length + 1,
						name: module.label || `Placeholder ${n8nWorkflow.nodes.length + 1}`,
						type: "n8n-nodes-base.noOp",
						parameters: {
							displayName: `Placeholder for ${module.label || module.name} (${moduleType})`,
							__stubInfo: {
								originalModuleType: moduleType,
								originalModuleName: module.label || module.name,
								note: `This module could not be automatically converted. Original type: ${moduleType}`
							}
						},
						position: [
							(n8nWorkflow.nodes.length * 200),
							0
						]
					};
					
					n8nWorkflow.nodes.push(placeholderNode);
					continue;
				}
				
				// Create the n8n node
				const n8nNode: N8nNode = {
					id: options.preserveIds ? String(module.id) : n8nWorkflow.nodes.length + 1,
					name: module.label || module.name || `Node ${n8nWorkflow.nodes.length + 1}`,
					type: mapping.type,
					parameters: {},
					typeVersion: 1,
					position: [
						(n8nWorkflow.nodes.length * 200),
						0
					]
				};
				
				// Map the parameters
				if (module.mapper && mapping.parameterMap) {
					for (const [makeParam, n8nParam] of Object.entries(mapping.parameterMap)) {
						if (module.mapper[makeParam] !== undefined) {
							n8nNode.parameters[n8nParam] = module.mapper[makeParam];
						}
					}
				}
				
				// Handle special node types
				if (moduleType === 'builtin:BasicRouter' && mapping.type === 'n8n-nodes-base.switch') {
					// Handle router module
					if (module.routes && Array.isArray(module.routes)) {
						// Create rules object with conditions
						n8nNode.parameters.rules = {
							conditions: module.routes.map((route: any) => ({
								operation: route.condition?.operator === 'eq' ? 'equal' : 'notEqual',
								value1: route.condition?.left,
								value2: route.condition?.right
							}))
						};
					}
				}
				
				// Handle credentials
				if (module.parameters) {
					const credentials: Record<string, any> = {};
					
					for (const [paramName, paramValue] of Object.entries(module.parameters as Record<string, any>)) {
						if (paramName.startsWith('__IMTCONN__')) {
							const credName = paramName.replace('__IMTCONN__', '');
							credentials[credName] = paramValue;
						}
					}
					
					if (Object.keys(credentials).length > 0) {
						n8nNode.credentials = credentials;
					}
				}
				
				// Add the node to the workflow
				n8nWorkflow.nodes.push(n8nNode);
				
			} catch (error) {
				debugTracker.addLog("error", `Error converting module ${module.label || module.name}: ${error instanceof Error ? error.message : String(error)}`);
				unconvertedModules.push(module.label || module.name);
			}
		}
		
		// Add connections between nodes based on Make.com connections
		// This is a simplified approach - in a real implementation, you'd need to handle
		// more complex connection scenarios
		if (makeWorkflow.flow.length > 1) {
			// Create connections for regular flow (sequential)
			for (let i = 0; i < makeWorkflow.flow.length - 1; i++) {
				const sourceModule = makeWorkflow.flow[i];
				const targetModule = makeWorkflow.flow[i + 1];
				
				// Find the source and target nodes
				const sourceNode = n8nWorkflow.nodes.find(node => 
					(options.preserveIds && String(node.id) === String(sourceModule.id)) || 
					(!options.preserveIds && node.name === sourceModule.label)
				);
				
				const targetNode = n8nWorkflow.nodes.find(node => 
					(options.preserveIds && String(node.id) === String(targetModule.id)) || 
					(!options.preserveIds && node.name === targetModule.label)
				);
				
				if (sourceNode && targetNode) {
					// Initialize the connections object for the source node
					if (!n8nWorkflow.connections[sourceNode.name]) {
						n8nWorkflow.connections[sourceNode.name] = { main: [] };
					}
					
					// Ensure main array exists
					if (!n8nWorkflow.connections[sourceNode.name].main) {
						n8nWorkflow.connections[sourceNode.name].main = [];
					}
					
					// Initialize the first output index if it doesn't exist
					if (!n8nWorkflow.connections[sourceNode.name].main![0]) {
						n8nWorkflow.connections[sourceNode.name].main![0] = [];
					}
					
					// Add the connection
					n8nWorkflow.connections[sourceNode.name].main![0].push({
						node: targetNode.name,
						type: 'main',
						index: 0
					});
				}
			}
			
			// Handle router/switch nodes separately
			for (const node of n8nWorkflow.nodes) {
				if (node.type === 'n8n-nodes-base.switch' && node.parameters?.rules?.conditions) {
					// For switch nodes, create connections to multiple targets
					const sourceNode = node;
					
					// Initialize the connections object for the source node
					if (!n8nWorkflow.connections[sourceNode.name]) {
						n8nWorkflow.connections[sourceNode.name] = { main: [] };
					}
					
					// Ensure main array exists
					if (!n8nWorkflow.connections[sourceNode.name].main) {
						n8nWorkflow.connections[sourceNode.name].main = [];
					}
					
					// Add connections for each condition (output)
					for (let i = 0; i < node.parameters.rules.conditions.length; i++) {
						// Create an empty array for this output if it doesn't exist
						if (!n8nWorkflow.connections[sourceNode.name].main![i]) {
							n8nWorkflow.connections[sourceNode.name].main![i] = [];
						}
						
						// Find a target node to connect to (this is simplified - in a real implementation,
						// you'd need to determine the actual target based on the workflow structure)
						const targetNode = n8nWorkflow.nodes.find(n => n.id !== sourceNode.id);
						
						if (targetNode) {
							n8nWorkflow.connections[sourceNode.name].main![i].push({
								node: targetNode.name,
								type: 'main',
								index: 0
							});
						}
					}
				}
			}
		}
		
		debugTracker.addLog("info", `Conversion completed: ${n8nWorkflow.nodes.length} nodes created`);
		
		return {
			convertedWorkflow: n8nWorkflow,
			logs: debugTracker.getGeneralLogs(),
			parametersNeedingReview: unconvertedModules
		};
	} catch (error) {
		debugTracker.addLog("error", `Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
		return {
			convertedWorkflow: {},
			logs: debugTracker.getGeneralLogs(),
			parametersNeedingReview: []
		};
	}
}
