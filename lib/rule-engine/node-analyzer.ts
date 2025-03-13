export interface AnalysisRule {
  id: string
  name: string
  description: string
  check: (node: any, workflow: any) => boolean
  suggestion: string
  severity: "info" | "warning" | "error"
}

export interface NodeAnalysisResult {
  nodeId: string
  nodeName: string
  nodeType: string
  issues: Array<{
    ruleId: string
    ruleName: string
    suggestion: string
    severity: "info" | "warning" | "error"
  }>
}

export class NodeAnalyzer {
  private rules: AnalysisRule[] = []

  constructor(rules?: AnalysisRule[]) {
    if (rules) {
      this.rules = rules
    } else {
      // Add default rules
      this.addDefaultRules()
    }
  }

  // Add a new rule
  addRule(rule: AnalysisRule): void {
    this.rules.push(rule)
  }

  // Remove a rule by ID
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((rule) => rule.id !== ruleId)
  }

  // Get all rules
  getRules(): AnalysisRule[] {
    return this.rules
  }

  // Analyze a single node
  analyzeNode(node: any, workflow: any): NodeAnalysisResult {
    // Validate node structure to prevent errors
    if (!node || typeof node !== 'object') {
      console.warn('NodeAnalyzer: Invalid node structure', node);
      return {
        nodeId: 'unknown',
        nodeName: 'Unknown Node',
        nodeType: 'unknown',
        issues: [{
          ruleId: 'invalid-node',
          ruleName: 'Invalid Node Structure',
          suggestion: 'This node has an invalid structure and could not be analyzed.',
          severity: 'error'
        }]
      };
    }

    // Ensure required node properties exist
    const nodeId = node.id || 'unknown-id';
    const nodeName = node.name || `Node ${nodeId}`;
    const nodeType = node.type || 'unknown-type';

    const result: NodeAnalysisResult = {
      nodeId,
      nodeName,
      nodeType,
      issues: [],
    }

    try {
      // Apply each rule to the node
      for (const rule of this.rules) {
        try {
          if (rule.check(node, workflow)) {
            result.issues.push({
              ruleId: rule.id,
              ruleName: rule.name,
              suggestion: rule.suggestion,
              severity: rule.severity,
            })
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`Error applying rule ${rule.id} to node ${nodeId}:`, error);
          // Add a warning about the rule error
          result.issues.push({
            ruleId: 'rule-error',
            ruleName: `Rule Error: ${rule.name}`,
            suggestion: `This rule could not be applied due to an error: ${errorMessage}`,
            severity: 'warning'
          });
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error analyzing node:', error);
      result.issues.push({
        ruleId: 'analysis-error',
        ruleName: 'Analysis Error',
        suggestion: `An error occurred while analyzing this node: ${errorMessage}`,
        severity: 'error'
      });
    }

    return result
  }

  // Analyze all nodes in a workflow
  analyzeWorkflow(workflow: any): NodeAnalysisResult[] {
    if (!workflow) {
      return [];
    }

    // Handle n8n workflows (which have nodes array)
    if (workflow.nodes && Array.isArray(workflow.nodes)) {
      console.log("Analyzing n8n workflow with", workflow.nodes.length, "nodes");
      return workflow.nodes.map((node: any) => this.analyzeNode(node, workflow));
    }

    // Handle Make.com workflows (which have flow array)
    if (workflow.flow && Array.isArray(workflow.flow)) {
      console.log("Analyzing Make.com workflow with", workflow.flow.length, "modules");
      return workflow.flow.map((module: any) => {
        // Adapt Make.com modules to be compatible with the analyzer
        const adaptedNode = {
          id: module.id,
          name: module.name || `Module ${module.id}`,
          type: module.type || module.module, // Use module if type is not available
          parameters: module.parameters || module.mapper || {}, // Use mapper if parameters not available
          credentials: module.__IMTCONN__ ? { __IMTCONN__: module.__IMTCONN__ } : {}
        };
        return this.analyzeNode(adaptedNode, workflow);
      });
    }

    // If no recognized workflow structure, return empty array
    return [];
  }

  // Add default analysis rules
  private addDefaultRules(): void {
    // Rule 1: Detect custom nodes
    this.addRule({
      id: "custom-node",
      name: "Custom Node Detected",
      description: "Detects nodes that are not part of the standard n8n library",
      check: (node) => {
        return node.type && !node.type.startsWith("n8n-nodes-base.")
      },
      suggestion: "This node appears to be a custom node. Make sure to create a custom mapping for it.",
      severity: "warning",
    })

    // Rule 2: Detect complex expressions
    this.addRule({
      id: "complex-expression",
      name: "Complex Expression Detected",
      description: "Detects nodes with complex expressions that might not convert properly",
      check: (node) => {
        if (!node.parameters) return false

        // Check for complex expressions in parameters
        return Object.values(node.parameters).some((value) => {
          if (typeof value === "string" && value.includes("={{")) {
            // Check for complex expressions (functions, complex operations)
            return (
              value.includes(".") ||
              value.includes("(") ||
              value.includes("?") ||
              value.includes("filter") ||
              value.includes("map") ||
              value.includes("reduce")
            )
          }
          return false
        })
      },
      suggestion: "This node contains complex expressions that might not convert properly. Review after conversion.",
      severity: "warning",
    })

    // Rule 3: Detect nodes with credentials
    this.addRule({
      id: "credentials-node",
      name: "Credentials Detected",
      description: "Detects nodes that use credentials which need to be reconfigured after conversion",
      check: (node) => {
        return node.credentials && Object.keys(node.credentials).length > 0
      },
      suggestion: "This node uses credentials that will need to be reconfigured in the target platform.",
      severity: "info",
    })

    // Rule 4: Detect webhook nodes
    this.addRule({
      id: "webhook-node",
      name: "Webhook Node Detected",
      description: "Detects webhook nodes which may have platform-specific configurations",
      check: (node) => {
        return (
          node.type && (node.type.includes("webhook") || node.type.includes("Webhook") || node.type.includes("trigger"))
        )
      },
      suggestion:
        "Webhook configurations are platform-specific. Manual configuration may be required after conversion.",
      severity: "warning",
    })

    // Rule 5: Detect nodes with binary data
    this.addRule({
      id: "binary-data",
      name: "Binary Data Handling",
      description: "Detects nodes that process binary data which may be handled differently across platforms",
      check: (node) => {
        if (!node.parameters) return false

        // Check for binary data handling
        return Object.values(node.parameters).some((value) => {
          if (typeof value === "string") {
            return value.includes("binary") || value.includes("file") || value.includes("image")
          }
          return false
        })
      },
      suggestion: "This node processes binary data which may be handled differently in the target platform.",
      severity: "warning",
    })
  }
}

