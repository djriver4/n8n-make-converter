import { getNodeMappings } from "../mappings/node-mapping"
import { getPluginRegistry } from "../plugins/plugin-registry"
import { n8nToMake } from "../converters/n8n-to-make"
import { makeToN8n } from "../converters/make-to-n8n"
import { DebugTracker } from "../debug-tracker"

export interface CoverageResult {
  totalNodeTypes: number
  mappedNodeTypes: number
  unmappedNodeTypes: number
  coveragePercentage: number
  unmappedNodes: string[]
}

export class CoverageValidator {
  /**
   * Validates the coverage of n8n node types
   */
  static async validateN8nCoverage(): Promise<CoverageResult> {
    // Get all node mappings
    const nodeMappings = getNodeMappings().n8nToMake
    const pluginMappings = getPluginRegistry().getNodeMappings().n8nToMake

    // Combine mappings
    const allMappings = { ...nodeMappings, ...pluginMappings }

    // Define a list of common n8n node types to test
    const commonNodeTypes = [
      "n8n-nodes-base.httpRequest",
      "n8n-nodes-base.set",
      "n8n-nodes-base.function",
      "n8n-nodes-base.if",
      "n8n-nodes-base.switch",
      "n8n-nodes-base.gmail",
      "n8n-nodes-base.googleSheets",
      "n8n-nodes-base.slack",
      "n8n-nodes-base.webhook",
      "n8n-nodes-base.emailSend",
      "n8n-nodes-base.noOp",
      "n8n-nodes-base.merge",
      "n8n-nodes-base.splitInBatches",
      "n8n-nodes-base.openWeatherMap",
      "n8n-nodes-base.notion",
      "n8n-nodes-base.airtable",
      "n8n-nodes-base.trello",
      "n8n-nodes-base.github",
      "n8n-nodes-base.jira",
      "n8n-nodes-base.salesforce",
    ]

    // Check which node types are mapped
    const mappedNodes: string[] = []
    const unmappedNodes: string[] = []

    for (const nodeType of commonNodeTypes) {
      if (allMappings[nodeType]) {
        mappedNodes.push(nodeType)
      } else {
        unmappedNodes.push(nodeType)
      }
    }

    // Calculate coverage
    const totalNodeTypes = commonNodeTypes.length
    const mappedNodeTypes = mappedNodes.length
    const coveragePercentage = Math.round((mappedNodeTypes / totalNodeTypes) * 100)

    return {
      totalNodeTypes,
      mappedNodeTypes,
      unmappedNodeTypes: unmappedNodes.length,
      coveragePercentage,
      unmappedNodes,
    }
  }

  /**
   * Validates the coverage of Make.com module types
   */
  static async validateMakeCoverage(): Promise<CoverageResult> {
    // Get all node mappings
    const nodeMappings = getNodeMappings().makeToN8n
    const pluginMappings = getPluginRegistry().getNodeMappings().makeToN8n

    // Combine mappings
    const allMappings = { ...nodeMappings, ...pluginMappings }

    // Define a list of common Make.com module types to test
    const commonModuleTypes = [
      "http:ActionSendData",
      "gmail:ActionSendEmail",
      "google-sheets:addRow",
      "builtin:BasicRouter",
      "webhook:CustomWebhook",
      "helper:Note",
      "helper:TriggerApp",
      "weather:ActionGetCurrentWeather",
      "slack:ActionSendMessage",
      "notion:ActionCreatePage",
      "airtable:ActionCreateRecord",
      "trello:ActionCreateCard",
      "github:ActionCreateIssue",
      "jira:ActionCreateIssue",
      "salesforce:ActionCreateRecord",
    ]

    // Check which module types are mapped
    const mappedModules: string[] = []
    const unmappedModules: string[] = []

    for (const moduleType of commonModuleTypes) {
      if (allMappings[moduleType]) {
        mappedModules.push(moduleType)
      } else {
        unmappedModules.push(moduleType)
      }
    }

    // Calculate coverage
    const totalNodeTypes = commonModuleTypes.length
    const mappedNodeTypes = mappedModules.length
    const coveragePercentage = Math.round((mappedNodeTypes / totalNodeTypes) * 100)

    return {
      totalNodeTypes,
      mappedNodeTypes,
      unmappedNodeTypes: unmappedModules.length,
      coveragePercentage,
      unmappedNodes: unmappedModules,
    }
  }

  /**
   * Tests a conversion with a sample workflow to validate node mapping
   */
  static async testConversion(direction: "n8nToMake" | "makeToN8n"): Promise<any> {
    const debugTracker = new DebugTracker()

    if (direction === "n8nToMake") {
      // Create a sample n8n workflow with various node types
      const sampleWorkflow = {
        name: "Test Workflow",
        nodes: [
          {
            id: "1",
            name: "Start",
            type: "n8n-nodes-base.start",
            position: [100, 300],
            parameters: {},
          },
          {
            id: "2",
            name: "HTTP Request",
            type: "n8n-nodes-base.httpRequest",
            position: [300, 300],
            parameters: {
              url: "https://example.com",
              method: "GET",
            },
          },
          {
            id: "3",
            name: "Switch",
            type: "n8n-nodes-base.switch",
            position: [500, 300],
            parameters: {
              rules: {
                conditions: [
                  {
                    value1: "={{ $json.status }}",
                    operation: "equal",
                    value2: "success",
                  },
                ],
              },
            },
          },
          {
            id: "4",
            name: "Weather",
            type: "n8n-nodes-base.openWeatherMap",
            position: [700, 300],
            parameters: {
              cityName: "New York",
              units: "metric",
            },
          },
          {
            id: "5",
            name: "Custom Node",
            type: "custom-nodes-base.customAction",
            position: [900, 300],
            parameters: {
              customField: "custom value",
            },
          },
        ],
        connections: {
          Start: {
            main: [
              [
                {
                  node: "HTTP Request",
                  type: "main",
                  index: 0,
                },
              ],
            ],
          },
          "HTTP Request": {
            main: [
              [
                {
                  node: "Switch",
                  type: "main",
                  index: 0,
                },
              ],
            ],
          },
          Switch: {
            main: [
              [
                {
                  node: "Weather",
                  type: "main",
                  index: 0,
                },
              ],
            ],
          },
          Weather: {
            main: [
              [
                {
                  node: "Custom Node",
                  type: "main",
                  index: 0,
                },
              ],
            ],
          },
        },
      }

      // Convert the workflow
      const result = await n8nToMake(sampleWorkflow, debugTracker)

      // Return the debug report
      return debugTracker.getDebugReport()
    } else {
      // Create a sample Make.com workflow with various module types
      const sampleWorkflow = {
        name: "Test Workflow",
        flow: [
          {
            id: 1,
            module: "webhook:CustomWebhook",
            version: 1,
            parameters: {},
            mapper: {
              path: "webhook",
            },
            metadata: {
              designer: {
                x: 0,
                y: 0,
              },
            },
          },
          {
            id: 2,
            module: "http:ActionSendData",
            version: 1,
            parameters: {},
            mapper: {
              url: "https://example.com",
              method: "GET",
            },
            metadata: {
              designer: {
                x: 300,
                y: 0,
              },
            },
          },
          {
            id: 3,
            module: "builtin:BasicRouter",
            version: 1,
            mapper: null,
            metadata: {
              designer: {
                x: 600,
                y: 0,
              },
            },
            routes: [
              {
                condition: {
                  left: "{{1.status}}",
                  operator: "eq",
                  right: "success",
                },
                flow: [
                  {
                    id: 4,
                    module: "weather:ActionGetCurrentWeather",
                    version: 1,
                    parameters: {},
                    mapper: {
                      city: "New York",
                      units: "metric",
                    },
                    metadata: {
                      designer: {
                        x: 900,
                        y: 0,
                      },
                    },
                  },
                ],
              },
            ],
          },
          {
            id: 5,
            module: "custom:CustomModule",
            version: 1,
            parameters: {},
            mapper: {
              customField: "custom value",
            },
            metadata: {
              designer: {
                x: 1200,
                y: 0,
              },
            },
          },
        ],
        metadata: {
          instant: false,
          version: 1,
          scenario: {
            roundtrips: 1,
            maxErrors: 3,
            autoCommit: true,
            autoCommitTriggerLast: true,
            sequential: false,
            confidential: false,
            dataloss: false,
            dlq: false,
            freshVariables: false,
          },
          designer: {
            orphans: [],
          },
          zone: "us1.make.com",
        },
      }

      // Convert the workflow
      const result = await makeToN8n(sampleWorkflow, debugTracker)

      // Return the debug report
      return debugTracker.getDebugReport()
    }
  }
}

