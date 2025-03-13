import { makeToN8n } from "../../../lib/converters/make-to-n8n"
import { getNodeMappings } from "../../../lib/mappings/node-mapping"
import { DebugTracker } from "../../../lib/debug-tracker"
import {
  basicMakeWorkflow,
  complexMakeWorkflow,
  credentialsMakeWorkflow,
  unsupportedModuleMakeWorkflow,
  expressionsMakeWorkflow,
} from "../../fixtures/make-workflows"

// Mock the node mappings
jest.mock("../../../lib/mappings/node-mapping")

describe("makeToN8n", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Set up default mock implementation for getNodeMappings
    ;(getNodeMappings as jest.Mock).mockReturnValue({
      makeToN8n: {
        "http:ActionSendData": {
          type: "n8n-nodes-base.httpRequest",
          parameterMap: {
            url: "url",
            method: "method",
            data: "body",
            headers: "headers",
          },
        },
        "helper:TriggerApp": {
          type: "n8n-nodes-base.start",
          parameterMap: {},
        },
        "webhook:CustomWebhook": {
          type: "n8n-nodes-base.webhook",
          parameterMap: {
            path: "path",
            responseMode: "responseMode",
          },
        },
        "builtin:BasicRouter": {
          type: "n8n-nodes-base.switch",
          parameterMap: {},
        },
        "builtin:SetVariable": {
          type: "n8n-nodes-base.set",
          parameterMap: {
            values: "values",
          },
        },
      },
    })
  })

  it("should convert a basic Make.com workflow to n8n format", async () => {
    const debugTracker = new DebugTracker()
    const result = await makeToN8n(basicMakeWorkflow, debugTracker)

    expect(result.convertedWorkflow).toBeDefined()
    expect(result.convertedWorkflow.name).toBe(basicMakeWorkflow.name)
    expect(result.convertedWorkflow.nodes).toBeInstanceOf(Array)

    // Check that the HTTP module was converted correctly
    const httpNode = result.convertedWorkflow.nodes.find((node: any) => node.type === "n8n-nodes-base.httpRequest")
    expect(httpNode).toBeDefined()
    expect(httpNode.parameters.url).toBe("https://example.com/api")
    expect(httpNode.parameters.method).toBe("GET")

    // Check logs
    expect(result.logs).toContainEqual({
      type: "info",
      message: expect.stringContaining("Conversion complete"),
    })
  })

  it("should convert a complex Make.com workflow with router to n8n switch node", async () => {
    const debugTracker = new DebugTracker()
    const result = await makeToN8n(complexMakeWorkflow, debugTracker)

    expect(result.convertedWorkflow).toBeDefined()
    expect(result.convertedWorkflow.nodes).toBeInstanceOf(Array)

    // Check that the switch node was created
    const switchNode = result.convertedWorkflow.nodes.find((node: any) => node.type === "n8n-nodes-base.switch")
    expect(switchNode).toBeDefined()
    expect(switchNode.parameters.rules).toBeDefined()
    expect(switchNode.parameters.rules.conditions).toBeInstanceOf(Array)
    expect(switchNode.parameters.rules.conditions.length).toBe(2)

    // Check that the conditions were mapped correctly
    expect(switchNode.parameters.rules.conditions[0]).toEqual(
      expect.objectContaining({
        operation: "equal",
        value2: "success",
      }),
    )
    expect(switchNode.parameters.rules.conditions[1]).toEqual(
      expect.objectContaining({
        operation: "equal",
        value2: "error",
      }),
    )

    // Check that the connections were created correctly
    expect(result.convertedWorkflow.connections).toBeDefined()
    const webhookNode = result.convertedWorkflow.nodes.find((node: any) => node.type === "n8n-nodes-base.webhook")
    expect(webhookNode).toBeDefined()
    expect(result.convertedWorkflow.connections[webhookNode.name]).toBeDefined()

    // Check that the switch node has connections to both HTTP nodes
    expect(result.convertedWorkflow.connections[switchNode.name]).toBeDefined()
    expect(result.convertedWorkflow.connections[switchNode.name].main.length).toBe(2)
  })

  it("should handle credentials in Make.com modules", async () => {
    const debugTracker = new DebugTracker()
    const result = await makeToN8n(credentialsMakeWorkflow, debugTracker)

    expect(result.convertedWorkflow).toBeDefined()

    // Check that the HTTP node has credentials
    const httpNode = result.convertedWorkflow.nodes.find((node: any) => node.type === "n8n-nodes-base.httpRequest")
    expect(httpNode).toBeDefined()
    expect(httpNode.credentials).toBeDefined()
  })

  it("should create stub nodes for unsupported Make.com modules", async () => {
    // Mock the node mappings to not include the custom module
    ;(getNodeMappings as jest.Mock).mockReturnValue({
      makeToN8n: {},
    })

    const debugTracker = new DebugTracker()
    const result = await makeToN8n(unsupportedModuleMakeWorkflow, debugTracker)

    expect(result.convertedWorkflow).toBeDefined()

    // Check that a stub node was created
    const stubNode = result.convertedWorkflow.nodes.find((node: any) => node.type === "n8n-nodes-base.noOp")
    expect(stubNode).toBeDefined()
    expect(stubNode.parameters).toHaveProperty("__stubInfo")
    expect(stubNode.parameters.__stubInfo).toHaveProperty("originalModuleType", "custom:CustomAction")

    // Check logs
    expect(result.logs).toContainEqual({
      type: "warning",
      message: expect.stringContaining("No mapping found for module type"),
    })
  })

  it("should convert Make.com expressions to n8n format", async () => {
    const debugTracker = new DebugTracker()
    const result = await makeToN8n(expressionsMakeWorkflow, debugTracker)

    expect(result.convertedWorkflow).toBeDefined()

    // Find the HTTP node
    const httpNode = result.convertedWorkflow.nodes.find((node: any) => node.type === "n8n-nodes-base.httpRequest")
    expect(httpNode).toBeDefined()

    // Check that the expression was converted correctly
    // Make.com: "{{1.id}}"
    // n8n: "={{ $1.id }}"
    expect(httpNode.parameters.url).toContain("={{")
    expect(httpNode.parameters.url).toContain("}}")
  })

  it("should handle invalid Make.com workflow structure", async () => {
    const invalidWorkflow = { name: "Invalid Workflow" } // Missing flow array

    const debugTracker = new DebugTracker()
    const result = await makeToN8n(invalidWorkflow, debugTracker)

    expect(result.convertedWorkflow).toEqual({})
    expect(result.logs).toContainEqual({
      type: "error",
      message: expect.stringContaining("Invalid Make.com workflow format"),
    })
  })

  it("should respect preserveIds option", async () => {
    const debugTracker = new DebugTracker()
    const options = { preserveIds: true }

    const result = await makeToN8n(basicMakeWorkflow, debugTracker, options)

    expect(result.convertedWorkflow).toBeDefined()

    // Check that the node IDs match the original module IDs
    const httpNode = result.convertedWorkflow.nodes.find((node: any) => node.type === "n8n-nodes-base.httpRequest")
    expect(httpNode).toBeDefined()
    expect(httpNode.id).toBe("1") // ID from the original Make.com module
  })

  it("should handle strictMode option", async () => {
    // Mock the node mappings to not include the HTTP module
    ;(getNodeMappings as jest.Mock).mockReturnValue({
      makeToN8n: {},
    })

    const debugTracker = new DebugTracker()

    // With strictMode = false, it should create a stub
    const resultNonStrict = await makeToN8n(basicMakeWorkflow, debugTracker, { strictMode: false })
    expect(resultNonStrict.convertedWorkflow).toBeDefined()
    expect(resultNonStrict.convertedWorkflow.nodes.length).toBe(1)

    // With strictMode = true, it should fail
    const resultStrict = await makeToN8n(basicMakeWorkflow, debugTracker, { strictMode: true })
    expect(resultStrict.logs).toContainEqual({
      type: "error",
      message: expect.stringContaining("Strict mode enabled"),
    })
  })

  it("should handle legacy Make.com workflow format", async () => {
    // Create a legacy format workflow
    const legacyWorkflow = {
      blueprint: {
        name: "Legacy Workflow",
      },
      modules: [
        {
          id: 1,
          module: "http:ActionSendData",
          parameters: {},
          mapper: {
            url: "https://example.com/api",
            method: "GET",
          },
        },
      ],
      connections: [
        // Legacy connections format
      ],
    }

    const debugTracker = new DebugTracker()
    const result = await makeToN8n(legacyWorkflow, debugTracker)

    expect(result.convertedWorkflow).toBeDefined()
    expect(result.convertedWorkflow.name).toBe("Legacy Workflow")
    expect(result.convertedWorkflow.nodes).toBeInstanceOf(Array)
  })
})

