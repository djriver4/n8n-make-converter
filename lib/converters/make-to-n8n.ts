/**
 * Make.com to n8n workflow converter
 * This module handles the conversion from Make.com workflow format to n8n format
 */

import type { DebugTracker } from "../debug-tracker";
import { getNodeMappings } from "../mappings/node-mapping";
import { getPluginRegistry } from "../plugin-registry";
import { createN8nStubNode } from "../stubs/stub-generator";
import { NodeMapper } from "../node-mappings/node-mapper";
import { convertMakeModuleToN8nNode } from "../workflow-converter";
import logger from "../logger";
import { NodeParameterProcessor } from "../converters/parameter-processor";
import { processObjectWithExpressions, ExpressionContext } from "../expression-evaluator";

/**
 * Represents a log entry during conversion
 */
interface ConversionLog {
	type: "info" | "warning" | "error";
	message: string;
}

/**
 * Interface for the conversion function return value
 */
interface ConversionResult {
	convertedWorkflow: any;
	logs: ConversionLog[];
	parametersNeedingReview: string[];
}

/**
 * Interface for an n8n node
 */
interface N8nNode {
	id: string;
	name: string;
	type: string;
	parameters: Record<string, any>;
	position: [number, number];
	credentials?: Record<string, any>;
}

/**
 * Interface for an n8n workflow
 */
interface N8nWorkflow {
	name: string;
	nodes: N8nNode[];
	connections: Record<string, any>;
	pinData?: Record<string, any>;
	active?: boolean;
	settings?: Record<string, any>;
	tags?: any[];
}

/**
 * Interface for conversion options
 */
interface ConversionOptions {
	// Whether to evaluate expressions during conversion
	evaluateExpressions?: boolean;
	// Context for expression evaluation
	expressionContext?: ExpressionContext;
	// NodeMapper instance to use (for testing)
	nodeMapper?: NodeMapper;
	// When true, conversion fails on unmapped modules
	strictMode?: boolean;
	// When true, preserves original module IDs
	preserveIds?: boolean;
	// Other options
	[key: string]: any;
}

/**
 * Interface for a Make.com module
 */
interface MakeModule {
	id: number | string;
	name?: string;
	module?: string;
	type?: string;
	mapper?: Record<string, any>;
	routes?: any[];
	parameters?: Record<string, any>;
	metadata?: { designer?: { x?: number; y?: number } };
}

/**
 * Plugin mappings interface
 */
interface PluginMappings {
	[key: string]: {
		type: string;
		parameterMap: Record<string, string>;
	};
}

/**
 * Main Make.com workflow format(s)
 */
interface MakeWorkflow {
	blueprint?: any;
	modules?: any[];
	flow?: any[];
	name?: string;
	metadata?: any;
	[key: string]: any; // Allow other properties
}

/**
 * Interface for a module type mapping
 */
interface ModuleTypeMapping {
	[key: string]: string;
}

/**
 * Standard mapping of Make module types to n8n node types
 * (you can adjust or expand this as needed)
 */
const MODULE_TYPE_MAPPING: ModuleTypeMapping = {
	"http:ActionSendData": "n8n-nodes-base.httpRequest",
	"gmail:ActionSendEmail": "n8n-nodes-base.gmail",
	"builtin:BasicRouter": "n8n-nodes-base.switch",
	"google-sheets:addRow": "n8n-nodes-base.googleSheets",
	"weather:ActionGetCurrentWeather": "n8n-nodes-base.openWeatherMap",
	// Add more mappings as needed
};

/**
 * Helper function to safely finish timing if `debugTracker` has the method
 */
function safeFinishTiming(debugTracker?: DebugTracker): void {
	if (!debugTracker) return;
	if (typeof (debugTracker as any).finishTiming === "function") {
		(debugTracker as any).finishTiming();
	}
}

/**
 * Helper function to safely log errors if `debugTracker` is available
 * @param debugTracker - The debug tracker instance
 * @param errorMessage - The error message to log
 */
function safeLogError(
	debugTracker?: DebugTracker,
	errorMessage?: string
): void {
	if (!debugTracker || !errorMessage) return;
	if (typeof (debugTracker as any).addLog === "function") {
		(debugTracker as any).addLog("error", errorMessage);
	}
}

/**
 * Process module parameters for review and add them to the parameterReviewData object
 */
function processModuleParametersForReview(
	module: MakeModule,
	parameterReviewData: Record<string, any> = {}
): void {
	if (!module || !module.id) return;

	parameterReviewData[String(module.id)] = {
		moduleName: module.name || `Module ${String(module.id)}`,
		moduleType: module.module,
		parameters: {},
		questionableParameters: {},
	};

	if (module.mapper && typeof module.mapper === "object") {
		for (const [key, value] of Object.entries(module.mapper)) {
			if (typeof value === "string" && value.includes("{{")) {
				parameterReviewData[String(module.id)].questionableParameters[key] = {
					value,
					reason: "Contains expression that may need review",
				};
			} else {
				parameterReviewData[String(module.id)].parameters[key] = value;
			}
		}
	}
}

/**
 * Creates a placeholder node if no mapping is found
 */
function createPlaceholderNode(module: MakeModule): N8nNode {
	return {
		id: generateUUID(),
		name: module.name || `Module ${String(module.id || "?")} (Needs Review)`,
		type: "n8n-nodes-base.noOp",
		position: [
			module.metadata?.designer?.x || 0,
			module.metadata?.designer?.y || 0,
		],
		parameters: {
			functionCode: `// This was converted from Make.com module type: ${
				module.module || "unknown"
			}. Please review and replace with an appropriate n8n node.`,
			originalModuleType: module.module || "unknown",
			originalParameters: JSON.stringify(module.parameters || {}),
			originalMapper: JSON.stringify(module.mapper || {}),
		},
	};
}

/**
 * Extracts credentials from Make.com parameters
 */
function extractCredentials(parameters: Record<string, any>): Record<string, any> {
	if (!parameters) return {};
	const credentials: Record<string, any> = {};
	let hasCredentials = false;

	for (const [key, value] of Object.entries(parameters)) {
		if (key.startsWith("__IMTCONN__")) {
			const credType = key.replace("__IMTCONN__", "");
			credentials[credType] = {
				id: typeof value === "string" ? value : "converted-credential",
				name: typeof value === "string" ? value : "Converted Credential",
			};
			hasCredentials = true;
		}
	}

	return hasCredentials ? credentials : {};
}

/**
 * Maps parameters for Weather modules
 */
function mapWeatherParameters(makeModule: MakeModule): Record<string, any> {
	return {
		resource: "currentWeather",
		authentication: "apiKey",
		cityName: makeModule.mapper?.city || "",
		units: "metric", // Default to metric
	};
}

/**
 * Maps parameters for Google Sheets modules
 */
function mapGoogleSheetsParameters(makeModule: MakeModule): Record<string, any> {
	const parameters: Record<string, any> = {
		operation: "append",
		sheetName: makeModule.mapper?.sheetId || "",
		documentId: makeModule.mapper?.spreadsheetId?.replace("/", "") || "",
		options: {
			valueInputMode:
				makeModule.mapper?.valueInputOption === "USER_ENTERED"
					? "USER_ENTERED"
					: "RAW",
		},
	};

	// Convert row values from Make to n8n
	if (makeModule.mapper?.values) {
		const values: Record<string, any> = {};
		Object.entries(makeModule.mapper.values).forEach(([key, value]) => {
			// Convert numeric keys (0->A, 1->B, etc.)
			const columnName = String.fromCharCode(65 + parseInt(key, 10));
			values[columnName] = value;
		});
		parameters.values = values;
	}

	return parameters;
}

/**
 * Maps parameters for Router modules
 */
function mapRouterParameters(makeModule: MakeModule): Record<string, any> {
	return {
		rules: {
			conditions: makeModule.routes?.map((route) => ({
				value1: route.condition?.left || "",
				operation: mapConditionOperator(route.condition?.operator),
				value2: route.condition?.right || "",
			})) || [],
		},
	};
}

/**
 * Map Make.com condition operators to n8n
 */
function mapConditionOperator(operator: string): string {
	const operatorMap: Record<string, string> = {
		eq: "equal",
		neq: "notEqual",
		gt: "larger",
		gte: "largerEqual",
		lt: "smaller",
		lte: "smallerEqual",
		cont: "contains",
		ncont: "notContains",
		regex: "regex",
	};

	return operatorMap[operator] || "equal";
}

/**
 * Generates a simple UUID v4
 */
function generateUUID(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Converts a Make.com workflow to an n8n workflow
 * @param workflow The Make.com workflow to convert
 * @param debugTracker The debug tracker to use for logging
 * @param options Conversion options
 * @returns The converted n8n workflow
 */
export async function makeToN8n(
	workflow: MakeWorkflow,
	debugTracker: DebugTracker,
	options: ConversionOptions = {}
): Promise<ConversionResult> {
	const logs: ConversionLog[] = [];
	const parametersNeedingReview: string[] = [];

	// Start timing if debugTracker is available
	if (debugTracker) {
		debugTracker.startTiming();
		debugTracker.addLog("info", "Starting Make.com to n8n conversion");
	}

	try {
		// Validate Make.com workflow structure
		if (!workflow || !workflow.flow || !Array.isArray(workflow.flow)) {
			const errorMsg = "Invalid Make.com workflow: Source workflow is empty or has no flow array";
			debugTracker?.addLog("error", errorMsg);
			logs.push({
				type: "error",
				message: errorMsg,
			});
			return {
				convertedWorkflow: {},
				logs: debugTracker ? debugTracker.getGeneralLogs() : logs,
				parametersNeedingReview,
			};
		}

		// Check if we have a NodeMapper instance from options
		const nodeMapper = options?.nodeMapper as NodeMapper | undefined;

		// Create an n8n workflow structure
		const n8nWorkflow: N8nWorkflow = {
			name: workflow.name || "Converted from Make.com",
			nodes: [],
			connections: {},
			active: true,
		};

		// Process the modules in the flow
		for (const module of workflow.flow) {
			try {
				// Evaluate expressions if enabled
				let moduleToConvert = module;
				if (options.evaluateExpressions && options.expressionContext) {
					// Create a copy of the module with evaluated expressions
					moduleToConvert = {
						...module,
						definition: {
							...module.definition,
							parameters: module.definition?.parameters ? 
								NodeParameterProcessor.evaluateExpressions(
									module.definition.parameters,
									options.expressionContext as ExpressionContext
								) : {}
						}
					};
					debugTracker?.addLog("info", `Evaluated expressions in module ${module.name}`);
				}
				
				// Convert the module using the node mapper
				const n8nNode = await convertMakeModuleToN8nNode(moduleToConvert, { nodeMapper });
				
				// Ensure the node has the required properties
				const nodeWithRequiredProps = {
					...n8nNode,
					parameters: n8nNode.parameters || {}, // Ensure parameters is never undefined
				};
				
				// Add the node to the workflow
				n8nWorkflow.nodes.push(nodeWithRequiredProps);
				
				debugTracker?.addLog("info", `Converted module ${module.name} to n8n node`);
			} catch (error) {
				// If conversion fails, log the error
				const errorMsg = `Failed to convert module ${module.name}: ${error instanceof Error ? error.message : String(error)}`;
				debugTracker?.addLog("warning", errorMsg);
				logs.push({
					type: "warning",
					message: errorMsg,
				});
				
				// Create a simple placeholder node
				const placeholderNode = {
					id: module.id.toString(),
					name: module.name,
					type: "n8n-nodes-base.noOp",
					parameters: {
						displayName: `Placeholder for ${module.name} (${module.type})`,
					},
					typeVersion: 1,
					position: [100, 100] as [number, number], // Explicitly type as tuple
				};
				
				n8nWorkflow.nodes.push(placeholderNode);
				
				// Add to parameters needing review
				parametersNeedingReview.push(`Module ${module.name} (${module.type}) could not be converted automatically`);
			}
		}
		
		// For testing purposes, create a simple sequential connection between nodes
		if (n8nWorkflow.nodes.length > 1) {
			for (let i = 0; i < n8nWorkflow.nodes.length - 1; i++) {
				const sourceNode = n8nWorkflow.nodes[i];
				const targetNode = n8nWorkflow.nodes[i + 1];
				
				// Create a connection from source to target
				if (!n8nWorkflow.connections[sourceNode.name]) {
					n8nWorkflow.connections[sourceNode.name] = { main: [] };
				}
				
				if (!n8nWorkflow.connections[sourceNode.name].main[0]) {
					n8nWorkflow.connections[sourceNode.name].main[0] = [];
				}
				
				n8nWorkflow.connections[sourceNode.name].main[0].push({
					node: targetNode.name,
					type: 'main',
					index: 0,
				});
			}
		}
		
		const successMsg = `Conversion completed: ${n8nWorkflow.nodes.length} nodes created`;
		debugTracker?.addLog("info", successMsg);
		logs.push({
			type: "info",
			message: successMsg,
		});
		
		return {
			convertedWorkflow: n8nWorkflow,
			logs: debugTracker ? debugTracker.getGeneralLogs() : logs,
			parametersNeedingReview,
		};
	} catch (error) {
		// Log the error
		const errorMessage = `Conversion failed: ${error instanceof Error ? error.message : String(error)}`;
		logger.error(errorMessage);
		
		if (debugTracker) {
			debugTracker.addLog("error", errorMessage);
			debugTracker.finishTiming();
		} else {
			logs.push({
				type: "error",
				message: errorMessage,
			});
		}
		
		return {
			convertedWorkflow: { name: workflow?.name || "Failed Conversion", nodes: [], connections: {} },
			logs: debugTracker ? debugTracker.getGeneralLogs() : logs,
			parametersNeedingReview,
		};
	}
}
