import { n8nToMake } from "../../../lib/converters/n8n-to-make"
import { getNodeMappings } from "../../../lib/mappings/node-mapping"
import { DebugTracker } from "../../../lib/debug-tracker"
import {
  basicN8nWorkflow,
  complexN8nWorkflow,
  credentialsN8nWorkflow,
  unsupportedNodeN8nWorkflow,
  expressionsN8nWorkflow,
} from "../../fixtures/n8n-workflows"

// Mock the node mappings
jest.mock("../../../lib/mappings/node-mapping")

describe("n8nToMake", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Set up default mock implementation for getNodeMappings
    ;(getNodeMappings as jest.Mock).mockReturnValue({
      n8nToMake: {
        "n8n-nodes-base.httpRequest": {
          type: "http:ActionSendData",
          parameterMap: {
            url: "url",
            method: "method",
            body: "data",
            headers: "headers",
          },
        },
        "n8n-nodes-base.start": {
          type: "helper:TriggerApp",
          parameterMap: {},
        },
        "n8n-nodes-base.webhook": {
          type: "webhook:CustomWebhook",
          parameterMap: {
            path: "path",
            responseMode: "responseMode",
          },
        },
        "n8n-nodes-base.switch": {
          type: "builtin:BasicRouter",
          parameterMap: {},
        },
        "n8n-nodes-base.set": {
          type: "builtin:SetVariable",
          parameterMap: {
            values: "values",
          },
        },
      },
    })
  })

  it("should convert a basic n8n workflow to Make.com format", async () => {
    const debugTracker = new DebugTracker()
    const result = await n8nToMake(basicN8nWorkflow, debugTracker)

    expect(result.convertedWorkflow).toBeDefined()
    expect(result.convertedWorkflow.name).toBe(basicN8nWorkflow.name)
    expect(result.convertedWorkflow.flow).toBeInstanceOf(Array)

    // Check that the HTTP Request node was converted correctly
    const httpModule = result.convertedWorkflow.flow.find((module: any) => module.module === "http:ActionSendData")
    expect(httpModule).toBeDefined()
    expect(httpModule.mapper.url).toBe("https://example.com/api")
    expect(httpModule.mapper.method).toBe("GET")

    // Check logs
    expect(result.logs).toContainEqual({
      type: "info",
      message: expect.stringContaining("Conversion complete"),
    })
  })

  it("should convert a complex n8n workflow with switch node to Make.com router", async () => {
    const debugTracker = new DebugTracker()
    const result = await n8nToMake(complexN8nWorkflow, debugTracker)

    expect(result.convertedWorkflow).toBeDefined()
    expect(result.convertedWorkflow.flow).toBeInstanceOf(Array)

    // Check that the router was created
    const routerModule = result.convertedWorkflow.flow.find((module: any) => module.module === "builtin:BasicRouter")
    expect(routerModule).toBeDefined()
    expect(routerModule.routes).toBeInstanceOf(Array)
    expect(routerModule.routes.length).toBe(2)

    // Check that the routes have the correct conditions
    expect(routerModule.routes[0].condition).toEqual(
      expect.objectContaining({
        operator: "eq",
        right: "success",
      }),
    )
    expect(routerModule.routes[1].condition).toEqual(
      expect.objectContaining({
        operator: "eq",
        right: "error",
      }),
    )

    // Check that each route has the correct HTTP module
    const successHttpModule = routerModule.routes[0].flow.find((module: any) => module.module === "http:ActionSendData")
    expect(successHttpModule).toBeDefined()
    expect(successHttpModule.mapper.url).toBe("https://example.com/api/success")

    const errorHttpModule = routerModule.routes[1].flow.find((module: any) => module.module === "http:ActionSendData")
    expect(errorHttpModule).toBeDefined()
    expect(errorHttpModule.mapper.url).toBe("https://example.com/api/error")
  })

  it("should handle credentials in n8n nodes", async () => {
    const debugTracker = new DebugTracker()
    const result = await n8nToMake(credentialsN8nWorkflow, debugTracker)

    expect(result.convertedWorkflow).toBeDefined()

    // Check that the HTTP module has credentials
    const httpModule = result.convertedWorkflow.flow.find((module: any) => module.module === "http:ActionSendData")
    expect(httpModule).toBeDefined()
    expect(httpModule.parameters).toHaveProperty("__IMTCONN__httpBasicAuth")
  })

  it("should create stub modules for unsupported n8n nodes", async () => {
    // Mock the node mappings to not include the custom node
    ;(getNodeMappings as jest.Mock).mockReturnValue({
      n8nToMake: {
        "n8n-nodes-base.start": {
          type: "helper:TriggerApp",
          parameterMap: {},
        },
      },
    })

    const debugTracker = new DebugTracker()
    const result = await n8nToMake(unsupportedNodeN8nWorkflow, debugTracker)

    expect(result.convertedWorkflow).toBeDefined()

    // Check that a stub module was created
    const stubModule = result.convertedWorkflow.flow.find((module: any) => module.module === "helper:Note")
    expect(stubModule).toBeDefined()
    expect(stubModule.mapper).toHaveProperty("originalNodeType", "custom-nodes-base.customAction")

    // Check logs
    expect(result.logs).toContainEqual({
      type: "warning",
      message: expect.stringContaining("Could not find direct mapping for node type"),
    })
  })

  it("should convert n8n expressions to Make.com format", async () => {
    const debugTracker = new DebugTracker()
    const result = await n8nToMake(expressionsN8nWorkflow, debugTracker)

    expect(result.convertedWorkflow).toBeDefined()

    // Find the HTTP module
    const httpModule = result.convertedWorkflow.flow.find((module: any) => module.module === "http:ActionSendData")
    expect(httpModule).toBeDefined()

    // Check that the expression was converted correctly
    // n8n: "={{ 'https://example.com/api/' + $json.id }}"
    // Make.com: "https://example.com/api/{{$json.id}}"
    expect(httpModule.mapper.url).toContain("{{")
    expect(httpModule.mapper.url).not.toContain("={{")
  })

  it("should handle invalid n8n workflow structure", async () => {
    const invalidWorkflow = { name: "Invalid Workflow" } // Missing nodes and connections

    const debugTracker = new DebugTracker()
    const result = await n8nToMake(invalidWorkflow, debugTracker)

    expect(result.convertedWorkflow).toEqual({})
    expect(result.logs).toContainEqual({
      type: "error",
      message: expect.stringContaining("Invalid n8n workflow"),
    })
  })

  it("should respect preserveIds option", async () => {
    const debugTracker = new DebugTracker()
    const options = { preserveIds: true }

    const result = await n8nToMake(basicN8nWorkflow, debugTracker, options)

    expect(result.convertedWorkflow).toBeDefined()

    // Check that the module IDs match the original node IDs
    const httpModule = result.convertedWorkflow.flow.find((module: any) => module.module === "http:ActionSendData")
    expect(httpModule).toBeDefined()
    expect(httpModule.id.toString()).toBe("2") // ID from the original n8n node
  })

  it("should handle strictMode option", async () => {
    // Mock the node mappings to not include the HTTP node
    ;(getNodeMappings as jest.Mock).mockReturnValue({
      n8nToMake: {
        "n8n-nodes-base.start": {
          type: "helper:TriggerApp",
          parameterMap: {},
        },
      },
    })

    const debugTracker = new DebugTracker()

    // With strictMode = false, it should create a stub
    const resultNonStrict = await n8nToMake(basicN8nWorkflow, debugTracker, { strictMode: false })
    expect(resultNonStrict.convertedWorkflow).toBeDefined()
    expect(resultNonStrict.convertedWorkflow.flow.length).toBe(2)

    // With strictMode = true, it should fail
    const resultStrict = await n8nToMake(basicN8nWorkflow, debugTracker, { strictMode: true })
    expect(resultStrict.logs).toContainEqual({
      type: "error",
      message: expect.stringContaining("Strict mode enabled"),
    })
  })
})

