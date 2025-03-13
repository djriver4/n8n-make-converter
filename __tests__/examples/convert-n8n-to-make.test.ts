import { n8nToMake } from "../../lib/converters/n8n-to-make"
import { DebugTracker } from "../../lib/debug-tracker"
import { describe, it, expect } from "@jest/globals"

describe("convertN8nToMake Example", () => {
  it("should convert an HTTP Request node correctly", async () => {
    // Create a simple n8n workflow with an HTTP Request node
    const n8nWorkflow = {
      name: "HTTP Request Example",
      nodes: [
        {
          id: "1",
          name: "HTTP Request",
          type: "n8n-nodes-base.httpRequest",
          position: [300, 300],
          parameters: {
            url: "https://api.example.com/data",
            method: "POST",
            authentication: "none",
            headers: {
              "Content-Type": "application/json",
            },
            body: {
              data: "example",
              moreData: 123,
            },
            options: {
              redirect: {
                follow: true,
                maxRedirects: 5,
              },
            },
          },
        },
      ],
      connections: {},
    }

    // Create a debug tracker to capture conversion details
    const debugTracker = new DebugTracker()

    // Perform the conversion
    const result = await n8nToMake(n8nWorkflow, debugTracker)

    // Verify the conversion was successful
    expect(result.convertedWorkflow).toBeDefined()
    expect(result.convertedWorkflow.flow).toBeInstanceOf(Array)
    expect(result.convertedWorkflow.flow.length).toBe(1)

    // Get the converted HTTP module
    const httpModule = result.convertedWorkflow.flow[0]

    // Verify the module type
    expect(httpModule.module).toBe("http:ActionSendData")

    // Verify the parameters were mapped correctly
    expect(httpModule.mapper.url).toBe("https://api.example.com/data")
    expect(httpModule.mapper.method).toBe("POST")
    expect(httpModule.mapper.headers).toEqual({
      "Content-Type": "application/json",
    })
    expect(httpModule.mapper.data).toEqual({
      data: "example",
      moreData: 123,
    })

    // Check the debug data
    const debugData = debugTracker.getDebugReport()
    expect(debugData.nodes).toHaveProperty("1")
    expect(debugData.nodes["1"].success).toBe(true)
    expect(debugData.nodes["1"].sourceType).toBe("n8n-nodes-base.httpRequest")
    expect(debugData.nodes["1"].targetType).toBe("http:ActionSendData")

    // Check that parameter mappings were tracked
    const paramMappings = debugData.nodes["1"].parameterMappings
    expect(paramMappings).toContainEqual(
      expect.objectContaining({
        source: "url",
        target: "url",
        success: true,
      }),
    )
    expect(paramMappings).toContainEqual(
      expect.objectContaining({
        source: "method",
        target: "method",
        success: true,
      }),
    )
  })

  it("should handle complex expressions in n8n nodes", async () => {
    // Create an n8n workflow with expressions
    const n8nWorkflow = {
      name: "Expressions Example",
      nodes: [
        {
          id: "1",
          name: "HTTP Request",
          type: "n8n-nodes-base.httpRequest",
          position: [300, 300],
          parameters: {
            url: "={{ 'https://api.example.com/users/' + $json.userId }}",
            method: "GET",
            headers: {
              Authorization: "={{ 'Bearer ' + $credentials.apiKey }}",
            },
          },
        },
      ],
      connections: {},
    }

    // Create a debug tracker
    const debugTracker = new DebugTracker()

    // Perform the conversion
    const result = await n8nToMake(n8nWorkflow, debugTracker)

    // Verify the conversion was successful
    expect(result.convertedWorkflow).toBeDefined()

    // Get the converted HTTP module
    const httpModule = result.convertedWorkflow.flow[0]

    // Verify expressions were converted correctly
    // n8n: "={{ 'https://api.example.com/users/' + $json.userId }}"
    // Make.com: "https://api.example.com/users/{{$json.userId}}"
    expect(httpModule.mapper.url).not.toContain("={{")
    expect(httpModule.mapper.url).toContain("{{")
    expect(httpModule.mapper.url).toContain("}}")

    // Check the Authorization header
    expect(httpModule.mapper.headers.Authorization).toContain("Bearer")
    expect(httpModule.mapper.headers.Authorization).toContain("{{")
  })

  it("should create stub modules for unsupported node types", async () => {
    // Create an n8n workflow with a custom node type
    const n8nWorkflow = {
      name: "Custom Node Example",
      nodes: [
        {
          id: "1",
          name: "Custom Action",
          type: "custom-nodes-base.customAction",
          position: [300, 300],
          parameters: {
            customField: "custom value",
          },
        },
      ],
      connections: {},
    }

    // Create a debug tracker
    const debugTracker = new DebugTracker()

    // Perform the conversion
    const result = await n8nToMake(n8nWorkflow, debugTracker)

    // Verify the conversion created a stub
    expect(result.convertedWorkflow).toBeDefined()
    expect(result.convertedWorkflow.flow).toBeInstanceOf(Array)
    expect(result.convertedWorkflow.flow.length).toBe(1)

    // Get the stub module
    const stubModule = result.convertedWorkflow.flow[0]

    // Verify it's a stub
    expect(stubModule.module).toBe("helper:Note")
    expect(stubModule.mapper).toHaveProperty("originalNodeType", "custom-nodes-base.customAction")

    // Check the logs
    expect(result.logs).toContainEqual({
      type: "warning",
      message: expect.stringContaining("Could not find direct mapping"),
    })
  })
})

