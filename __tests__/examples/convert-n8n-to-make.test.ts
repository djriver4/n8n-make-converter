import { n8nToMake } from "../../lib/converters/n8n-to-make"
import { DebugTracker } from "../../lib/debug-tracker"
import { describe, it, expect } from "@jest/globals"
import { ConversionLog, ParameterReview, ConversionResult } from "../../lib/workflow-converter"
import { MakeWorkflow } from "../../lib/node-mappings/node-types"

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
    const makeWorkflow = result.convertedWorkflow as MakeWorkflow
    expect(makeWorkflow.flow).toBeInstanceOf(Array)
    expect(makeWorkflow.flow?.length).toBe(1)

    // Get the converted HTTP module
    const httpModule = makeWorkflow.flow?.[0]
    expect(httpModule).toBeDefined()

    // Verify the module type
    expect(httpModule?.module).toBe("http:ActionSendData")

    // Verify the parameters were mapped correctly
    expect(httpModule?.mapper?.url).toBe("https://api.example.com/data")
    expect(httpModule?.mapper?.method).toBe("POST")
    expect(httpModule?.mapper?.headers).toEqual({
      "Content-Type": "application/json",
    })
    expect(httpModule?.mapper?.data).toEqual({
      data: "example",
      moreData: 123,
    })

    // Check the debug data - handle properties safely
    const debugData = debugTracker.getDebugReport()
    expect(debugData).toBeDefined()
    
    // Check nodes safely
    expect(debugData).toHaveProperty('nodes')
    
    // Check node with ID "1" if it exists
    if (debugData.nodes && debugData.nodes["1"]) {
      const nodeData = debugData.nodes["1"]
      expect(nodeData.success).toBe(true)
      expect(nodeData.sourceType).toBe("n8n-nodes-base.httpRequest")
      expect(nodeData.targetType).toBe("http:ActionSendData")
      
      // Check parameter mappings safely
      if (nodeData.parameterMappings && Array.isArray(nodeData.parameterMappings)) {
        const paramMappings = nodeData.parameterMappings
        
        // Use safer approach by checking if the array contains items with specific properties
        expect(paramMappings.some(mapping => 
          mapping.source === "url" && 
          mapping.target === "url" && 
          mapping.success === true
        )).toBe(true)
        
        expect(paramMappings.some(mapping => 
          mapping.source === "method" && 
          mapping.target === "method" && 
          mapping.success === true
        )).toBe(true)
      }
    }
    
    // Verify logs are in the correct format
    expect(result.logs).toBeInstanceOf(Array)
    result.logs.forEach((log: ConversionLog) => {
      expect(log).toHaveProperty('type')
      expect(['info', 'warning', 'error']).toContain(log.type)
      expect(log).toHaveProperty('message')
      expect(typeof log.message).toBe('string')
    })
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
    const makeWorkflow = result.convertedWorkflow as MakeWorkflow

    // Get the converted HTTP module
    const httpModule = makeWorkflow.flow?.[0]
    expect(httpModule).toBeDefined()

    // Verify expressions were converted correctly
    // n8n: "={{ 'https://api.example.com/users/' + $json.userId }}"
    // Make.com: "https://api.example.com/users/{{$json.userId}}"
    expect(httpModule?.mapper?.url).not.toContain("={{")
    expect(httpModule?.mapper?.url).toContain("{{")
    expect(httpModule?.mapper?.url).toContain("}}")

    // Check the Authorization header
    expect(httpModule?.mapper?.headers?.Authorization).toContain("Bearer")
    expect(httpModule?.mapper?.headers?.Authorization).toContain("{{")
    
    // Verify logs are in the correct format
    expect(result.logs).toBeInstanceOf(Array)
    result.logs.forEach((log: ConversionLog) => {
      expect(log).toHaveProperty('type')
      expect(['info', 'warning', 'error']).toContain(log.type)
      expect(log).toHaveProperty('message')
    })
    
    // Verify debug information is present if available
    if ('debug' in result) {
      expect(result.debug).toBeDefined()
    }
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
    const makeWorkflow = result.convertedWorkflow as MakeWorkflow
    expect(makeWorkflow.flow).toBeInstanceOf(Array)
    expect(makeWorkflow.flow?.length).toBe(1)

    // Get the stub module
    const stubModule = makeWorkflow.flow?.[0]
    expect(stubModule).toBeDefined()

    // Verify it's a stub
    expect(stubModule?.module).toBe("helper:Note")
    expect(stubModule?.mapper).toHaveProperty("originalNodeType", "custom-nodes-base.customAction")

    // Check the logs
    expect(result.logs).toContainEqual(
      expect.objectContaining({
        type: "warning",
        message: expect.stringContaining("Could not find direct mapping"),
      })
    )
    
    // Check for unmapped nodes if available
    const resultWithUnmappedNodes = result as unknown as ConversionResult & { unmappedNodes?: string[] }
    if (resultWithUnmappedNodes.unmappedNodes) {
      expect(Array.isArray(resultWithUnmappedNodes.unmappedNodes)).toBe(true)
      expect(resultWithUnmappedNodes.unmappedNodes).toContain("1")
    }
  })
})

