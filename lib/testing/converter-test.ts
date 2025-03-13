import { n8nToMake } from "../converters/n8n-to-make"
import { makeToN8n } from "../converters/make-to-n8n"
import { detectPlatform } from "../platform-detector"

export interface TestResult {
  testName: string
  passed: boolean
  error?: string
  details?: any
}

export class ConverterTester {
  private testResults: TestResult[] = []

  // Run all tests
  async runAllTests(): Promise<TestResult[]> {
    this.testResults = []

    // Run n8n to Make.com tests
    await this.testN8nToMake()

    // Run Make.com to n8n tests
    await this.testMakeToN8n()

    // Run round-trip tests
    await this.testRoundTrip()

    return this.testResults
  }

  // Test n8n to Make.com conversion
  async testN8nToMake(): Promise<void> {
    // Test basic workflow
    await this.testN8nToMakeBasic()

    // Test complex workflow
    await this.testN8nToMakeComplex()
  }

  // Test Make.com to n8n conversion
  async testMakeToN8n(): Promise<void> {
    // Test basic workflow
    await this.testMakeToN8nBasic()

    // Test complex workflow
    await this.testMakeToN8nComplex()
  }

  // Test round-trip conversion (n8n -> Make.com -> n8n)
  async testRoundTrip(): Promise<void> {
    try {
      const testName = "Round-trip conversion (n8n -> Make.com -> n8n)"

      // Start with a basic n8n workflow
      const n8nWorkflow = this.getBasicN8nWorkflow()

      // Convert to Make.com
      const { convertedWorkflow: makeWorkflow } = await n8nToMake(n8nWorkflow)

      // Convert back to n8n
      const { convertedWorkflow: roundTripWorkflow } = await makeToN8n(makeWorkflow)

      // Validate the round-trip workflow
      const isValid = this.validateRoundTripWorkflow(n8nWorkflow, roundTripWorkflow)

      this.testResults.push({
        testName,
        passed: isValid,
        details: {
          original: n8nWorkflow,
          makeWorkflow,
          roundTrip: roundTripWorkflow,
        },
      })
    } catch (error) {
      this.testResults.push({
        testName: "Round-trip conversion (n8n -> Make.com -> n8n)",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  // Test basic n8n to Make.com conversion
  private async testN8nToMakeBasic(): Promise<void> {
    try {
      const testName = "Basic n8n to Make.com conversion"
      const n8nWorkflow = this.getBasicN8nWorkflow()

      // Convert to Make.com
      const { convertedWorkflow, logs } = await n8nToMake(n8nWorkflow)

      // Validate the converted workflow
      const isValid = this.validateMakeWorkflow(convertedWorkflow)

      this.testResults.push({
        testName,
        passed: isValid,
        details: {
          original: n8nWorkflow,
          converted: convertedWorkflow,
          logs,
        },
      })
    } catch (error) {
      this.testResults.push({
        testName: "Basic n8n to Make.com conversion",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  // Test complex n8n to Make.com conversion
  private async testN8nToMakeComplex(): Promise<void> {
    try {
      const testName = "Complex n8n to Make.com conversion"
      const n8nWorkflow = this.getComplexN8nWorkflow()

      // Convert to Make.com
      const { convertedWorkflow, logs } = await n8nToMake(n8nWorkflow)

      // Validate the converted workflow
      const isValid = this.validateMakeWorkflow(convertedWorkflow)

      this.testResults.push({
        testName,
        passed: isValid,
        details: {
          original: n8nWorkflow,
          converted: convertedWorkflow,
          logs,
        },
      })
    } catch (error) {
      this.testResults.push({
        testName: "Complex n8n to Make.com conversion",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  // Test basic Make.com to n8n conversion
  private async testMakeToN8nBasic(): Promise<void> {
    try {
      const testName = "Basic Make.com to n8n conversion"
      const makeWorkflow = this.getBasicMakeWorkflow()

      // Convert to n8n
      const { convertedWorkflow, logs } = await makeToN8n(makeWorkflow)

      // Validate the converted workflow
      const isValid = this.validateN8nWorkflow(convertedWorkflow)

      this.testResults.push({
        testName,
        passed: isValid,
        details: {
          original: makeWorkflow,
          converted: convertedWorkflow,
          logs,
        },
      })
    } catch (error) {
      this.testResults.push({
        testName: "Basic Make.com to n8n conversion",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  // Test complex Make.com to n8n conversion
  private async testMakeToN8nComplex(): Promise<void> {
    try {
      const testName = "Complex Make.com to n8n conversion"
      const makeWorkflow = this.getComplexMakeWorkflow()

      // Convert to n8n
      const { convertedWorkflow, logs } = await makeToN8n(makeWorkflow)

      // Validate the converted workflow
      const isValid = this.validateN8nWorkflow(convertedWorkflow)

      this.testResults.push({
        testName,
        passed: isValid,
        details: {
          original: makeWorkflow,
          converted: convertedWorkflow,
          logs,
        },
      })
    } catch (error) {
      this.testResults.push({
        testName: "Complex Make.com to n8n conversion",
        passed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  // Validate a Make.com workflow
  private validateMakeWorkflow(workflow: any): boolean {
    if (!workflow) return false

    // Check for required properties
    if (!workflow.name || !workflow.flow || !Array.isArray(workflow.flow)) {
      return false
    }

    // Check that the platform detector recognizes it as a Make.com workflow
    const detectedPlatform = detectPlatform(workflow)
    if (detectedPlatform !== "make") {
      return false
    }

    return true
  }

  // Validate an n8n workflow
  private validateN8nWorkflow(workflow: any): boolean {
    if (!workflow) return false

    // Check for required properties
    if (!workflow.nodes || !Array.isArray(workflow.nodes) || !workflow.connections) {
      return false
    }

    // Check that the platform detector recognizes it as an n8n workflow
    const detectedPlatform = detectPlatform(workflow)
    if (detectedPlatform !== "n8n") {
      return false
    }

    return true
  }

  // Validate a round-trip workflow
  private validateRoundTripWorkflow(original: any, roundTrip: any): boolean {
    if (!this.validateN8nWorkflow(roundTrip)) {
      return false
    }

    // Check that the round-trip workflow has the same number of nodes
    if (original.nodes.length !== roundTrip.nodes.length) {
      return false
    }

    // Check that all node types are preserved
    const originalNodeTypes = new Set(original.nodes.map((node: any) => node.type))
    const roundTripNodeTypes = new Set(roundTrip.nodes.map((node: any) => node.type))

    // Check if all original node types are in the round-trip workflow
    for (const nodeType of originalNodeTypes) {
      if (!roundTripNodeTypes.has(nodeType)) {
        return false
      }
    }

    return true
  }

  // Get a basic n8n workflow for testing
  private getBasicN8nWorkflow(): any {
    return {
      name: "Basic Test Workflow",
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
          name: "Set",
          type: "n8n-nodes-base.set",
          position: [300, 300],
          parameters: {
            values: {
              number: [
                {
                  name: "count",
                  value: 1,
                },
              ],
              string: [
                {
                  name: "message",
                  value: "Hello World",
                },
              ],
            },
          },
        },
        {
          id: "3",
          name: "HTTP Request",
          type: "n8n-nodes-base.httpRequest",
          position: [500, 300],
          parameters: {
            url: "https://example.com",
            method: "GET",
          },
        },
      ],
      connections: {
        Start: {
          main: [
            [
              {
                node: "Set",
                type: "main",
                index: 0,
              },
            ],
          ],
        },
        Set: {
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
      },
    }
  }

  // Get a complex n8n workflow for testing
  private getComplexN8nWorkflow(): any {
    return {
      name: "Complex Test Workflow",
      nodes: [
        {
          id: "1",
          name: "Webhook",
          type: "n8n-nodes-base.webhook",
          position: [100, 300],
          parameters: {
            path: "webhook",
            responseMode: "lastNode",
          },
        },
        {
          id: "2",
          name: "Switch",
          type: "n8n-nodes-base.switch",
          position: [300, 300],
          parameters: {
            rules: {
              conditions: [
                {
                  value1: "={{ $json.status }}",
                  operation: "equal",
                  value2: "success",
                },
                {
                  value1: "={{ $json.status }}",
                  operation: "equal",
                  value2: "error",
                },
              ],
            },
          },
        },
        {
          id: "3",
          name: "Gmail",
          type: "n8n-nodes-base.gmail",
          position: [500, 200],
          parameters: {
            operation: "sendEmail",
            to: "test@example.com",
            subject: "Success",
            message: "The operation was successful",
          },
        },
        {
          id: "4",
          name: "HTTP Request",
          type: "n8n-nodes-base.httpRequest",
          position: [500, 400],
          parameters: {
            url: "https://example.com/error",
            method: "POST",
            body: "={{ $json }}",
          },
        },
      ],
      connections: {
        Webhook: {
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
                node: "Gmail",
                type: "main",
                index: 0,
              },
            ],
            [
              {
                node: "HTTP Request",
                type: "main",
                index: 0,
              },
            ],
          ],
        },
      },
    }
  }

  // Get a basic Make.com workflow for testing
  private getBasicMakeWorkflow(): any {
    return {
      name: "Basic Test Workflow",
      flow: [
        {
          id: 1,
          module: "http:ActionSendData",
          version: 1,
          parameters: {},
          mapper: {
            url: "https://example.com",
            method: "GET",
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
          module: "gmail:ActionSendEmail",
          version: 1,
          parameters: {
            __IMTCONN__: "123456",
          },
          mapper: {
            to: "test@example.com",
            subject: "Test Email",
            text: "This is a test email",
          },
          metadata: {
            designer: {
              x: 300,
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
  }

  // Get a complex Make.com workflow for testing
  private getComplexMakeWorkflow(): any {
    return {
      name: "Complex Test Workflow",
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
          module: "builtin:BasicRouter",
          version: 1,
          mapper: null,
          metadata: {
            designer: {
              x: 300,
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
                  id: 3,
                  module: "gmail:ActionSendEmail",
                  version: 1,
                  parameters: {
                    __IMTCONN__: "123456",
                  },
                  mapper: {
                    to: "test@example.com",
                    subject: "Success",
                    text: "The operation was successful",
                  },
                  metadata: {
                    designer: {
                      x: 600,
                      y: -100,
                    },
                  },
                },
              ],
            },
            {
              condition: {
                left: "{{1.status}}",
                operator: "eq",
                right: "error",
              },
              flow: [
                {
                  id: 4,
                  module: "http:ActionSendData",
                  version: 1,
                  parameters: {},
                  mapper: {
                    url: "https://example.com/error",
                    method: "POST",
                    data: "{{1}}",
                  },
                  metadata: {
                    designer: {
                      x: 600,
                      y: 100,
                    },
                  },
                },
              ],
            },
          ],
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
  }
}

