import { convertWorkflow } from "@/lib/converter"
import { basicN8nWorkflow, complexN8nWorkflow } from "../fixtures/n8n-workflows"
import { basicMakeWorkflow } from "../fixtures/make-workflows"
import { describe, it, expect } from "@jest/globals"
import { loadFixture, compareWorkflows } from '../utils/test-helpers'

// These tests perform actual conversions without mocking the converters
describe("Workflow Conversion Integration Tests", () => {
  it("should convert n8n workflow to Make.com and back", async () => {
    // Convert n8n to Make.com
    const n8nToMakeResult = await convertWorkflow(basicN8nWorkflow, "n8n", "make")

    expect(n8nToMakeResult.convertedWorkflow).toBeDefined()
    expect(n8nToMakeResult.convertedWorkflow.flow).toBeInstanceOf(Array)

    // Now convert back to n8n
    const makeToN8nResult = await convertWorkflow(n8nToMakeResult.convertedWorkflow, "make", "n8n")

    expect(makeToN8nResult.convertedWorkflow).toBeDefined()
    expect(makeToN8nResult.convertedWorkflow.nodes).toBeInstanceOf(Array)

    // Check that the round-trip conversion preserved the essential structure
    const originalHttpNode = basicN8nWorkflow.nodes.find((node: any) => node.type === "n8n-nodes-base.httpRequest")
    const roundTripHttpNode = makeToN8nResult.convertedWorkflow.nodes.find(
      (node: any) => node.type === "n8n-nodes-base.httpRequest",
    )

    expect(roundTripHttpNode).toBeDefined()
    expect(roundTripHttpNode?.parameters?.url).toBe(originalHttpNode?.parameters?.url)
    expect(roundTripHttpNode?.parameters?.method).toBe(originalHttpNode?.parameters?.method)
  })

  it("should convert Make.com workflow to n8n and back", async () => {
    // Convert Make.com to n8n
    const makeToN8nResult = await convertWorkflow(basicMakeWorkflow, "make", "n8n")

    expect(makeToN8nResult.convertedWorkflow).toBeDefined()
    expect(makeToN8nResult.convertedWorkflow.nodes).toBeInstanceOf(Array)

    // Now convert back to Make.com
    const n8nToMakeResult = await convertWorkflow(makeToN8nResult.convertedWorkflow, "n8n", "make")

    expect(n8nToMakeResult.convertedWorkflow).toBeDefined()
    expect(n8nToMakeResult.convertedWorkflow.flow).toBeInstanceOf(Array)

    // Check that the round-trip conversion preserved the essential structure
    const originalHttpModule = basicMakeWorkflow.flow.find((module: any) => module.module === "http:ActionSendData")
    const roundTripHttpModule = n8nToMakeResult.convertedWorkflow.flow.find(
      (module: any) => module.module === "http:ActionSendData",
    )

    expect(roundTripHttpModule).toBeDefined()
    expect(roundTripHttpModule?.mapper?.url).toBe(originalHttpModule?.mapper?.url)
    expect(roundTripHttpModule?.mapper?.method).toBe(originalHttpModule?.mapper?.method)
  })

  it("should handle complex workflows with multiple nodes and connections", async () => {
    // Convert complex n8n workflow to Make.com
    const n8nToMakeResult = await convertWorkflow(complexN8nWorkflow, "n8n", "make")

    expect(n8nToMakeResult.convertedWorkflow).toBeDefined()
    expect(n8nToMakeResult.convertedWorkflow.flow).toBeInstanceOf(Array)

    // Check that the router was created
    const routerModule = n8nToMakeResult.convertedWorkflow.flow.find(
      (module: any) => module.module === "builtin:BasicRouter",
    )
    expect(routerModule).toBeDefined()
    expect(routerModule.routes).toBeInstanceOf(Array)
    expect(routerModule.routes.length).toBe(2)

    // Now convert back to n8n
    const makeToN8nResult = await convertWorkflow(n8nToMakeResult.convertedWorkflow, "make", "n8n")

    expect(makeToN8nResult.convertedWorkflow).toBeDefined()
    expect(makeToN8nResult.convertedWorkflow.nodes).toBeInstanceOf(Array)

    // Check that the switch node was created
    const switchNode = makeToN8nResult.convertedWorkflow.nodes.find((node: any) => node.type === "n8n-nodes-base.switch")
    expect(switchNode).toBeDefined()
    expect(switchNode.parameters.rules).toBeDefined()
    expect(switchNode.parameters.rules.conditions).toBeInstanceOf(Array)
  })

  it("should handle edge cases and provide appropriate error logs", async () => {
    // Test with an empty workflow
    const emptyResult = await convertWorkflow(null, "n8n", "make")

    expect(emptyResult.convertedWorkflow).toEqual({})
    expect(emptyResult.logs).toContainEqual({
      type: "error",
      message: "Source workflow is empty",
    })

    // Test with an invalid workflow structure
    const invalidResult = await convertWorkflow(
      { name: "Invalid Workflow" }, // Missing required properties
      "n8n",
      "make"
    )

    expect(invalidResult.convertedWorkflow).toEqual({})
    expect(invalidResult.logs).toContainEqual({
      type: "error",
      message: expect.stringContaining("Invalid n8n workflow"),
    })
  })
})

describe('End-to-End Workflow Conversion', () => {
  describe('n8n to Make Conversion', () => {
    let n8nWorkflow: any;
    
    beforeAll(() => {
      n8nWorkflow = loadFixture('n8n', 'sample-workflow');
    });
    
    test('should convert n8n workflow to Make format', async () => {
      const result = await convertWorkflow(n8nWorkflow, 'n8n', 'make');
      
      // Verify the basic structure is correct
      expect(result.convertedWorkflow).toBeDefined();
      expect(result.convertedWorkflow.flow).toBeDefined();
      expect(Array.isArray(result.convertedWorkflow.flow)).toBe(true);
      
      // Verify workflow structure matches expectation
      const expectedMakeWorkflow = loadFixture('make', 'expected-workflow');
      // Use compareWorkflows utility instead of custom matcher
      const comparison = compareWorkflows(result.convertedWorkflow, expectedMakeWorkflow);
      console.log('N8N to Make comparison differences:', comparison.differences);
      expect(comparison.matches).toBe(true);
      
      // Check conversion logs
      expect(result.logs).toBeDefined();
      expect(Array.isArray(result.logs)).toBe(true);
      
      // Debug data is not part of the public interface
      // No need to check for it
    });
    
    test('should identify parameters that need review', async () => {
      const result = await convertWorkflow(n8nWorkflow, 'n8n', 'make');
      
      // Debug output to help identify the problem
      console.log('TEST: Conversion result:', {
        logs: result.logs,
        parametersNeedingReview: result.parametersNeedingReview,
        workflowHasFunction: n8nWorkflow.nodes.some((node: any) => node.type === 'n8n-nodes-base.function')
      });
      
      // Verify parameters needing review are present
      expect(result.parametersNeedingReview).toBeDefined();
      
      // There should be some parameters that need review in the Function node
      expect(result.parametersNeedingReview.length).toBeGreaterThan(0);
    });
  });
  
  describe('Make to n8n Conversion', () => {
    let makeWorkflow: any;
    
    beforeAll(() => {
      makeWorkflow = loadFixture('make', 'sample-workflow');
    });
    
    test('should convert Make workflow to n8n format', async () => {
      const result = await convertWorkflow(makeWorkflow, 'make', 'n8n');
      
      // Verify the basic structure is correct
      expect(result.convertedWorkflow).toBeDefined();
      expect(result.convertedWorkflow.nodes).toBeDefined();
      expect(Array.isArray(result.convertedWorkflow.nodes)).toBe(true);
      
      // Verify workflow structure matches expectation
      const expectedN8nWorkflow = loadFixture('n8n', 'expected-make-to-n8n');
      // Use compareWorkflows utility instead of custom matcher
      const comparison = compareWorkflows(result.convertedWorkflow, expectedN8nWorkflow);
      console.log('Make to N8N comparison differences:', comparison.differences);
      expect(comparison.matches).toBe(true);
      
      // Check conversion logs
      expect(result.logs).toBeDefined();
      expect(Array.isArray(result.logs)).toBe(true);
      
      // Debug data is not part of the public interface
      // No need to check for it
    });
    
    test('should identify parameters that need review', async () => {
      const result = await convertWorkflow(makeWorkflow, 'make', 'n8n');
      
      // Verify parameters needing review are present
      expect(result.parametersNeedingReview).toBeDefined();
      
      // There should be some parameters that need review in the Tools node
      expect(result.parametersNeedingReview.length).toBeGreaterThan(0);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle invalid workflows gracefully', async () => {
      const invalidWorkflow = { invalid: 'structure' };
      
      const result = await convertWorkflow(invalidWorkflow, 'n8n', 'make');
      
      // Verify error is reported in logs
      expect(result.logs).toBeDefined();
      expect(result.logs.length).toBeGreaterThan(0);
      expect(result.logs[0].type).toBe('error');
      
      // Verify empty converted workflow
      expect(result.convertedWorkflow).toEqual({});
    });
    
    test('should handle unsupported conversion paths', async () => {
      const workflow = loadFixture('n8n', 'sample-workflow');
      
      // @ts-ignore - Testing an invalid path
      const result = await convertWorkflow(workflow, 'n8n', 'unsupported');
      
      // Verify error is reported in logs
      expect(result.logs).toBeDefined();
      expect(result.logs.length).toBeGreaterThan(0);
      expect(result.logs.some((log: any) => 
        (typeof log === 'object' && log.type === 'error' && log.message && log.message.includes('Unsupported conversion path'))
      )).toBe(true);
    });
  });
});

describe('Workflow Conversion', () => {
  describe('n8n to Make Conversion', () => {
    let n8nWorkflow: any;
    
    beforeAll(() => {
      n8nWorkflow = loadFixture('n8n', 'sample-workflow');
    });
    
    test('should convert n8n workflow to Make format', async () => {
      const result = await convertWorkflow(n8nWorkflow, 'n8n', 'make');
      
      // Check that conversion was successful
      expect(result.convertedWorkflow).toBeDefined();
      expect(result.logs.length).toBeGreaterThan(0);
      
      // Check basic structure
      expect(result.convertedWorkflow).toHaveProperty('flow');
      expect(result.convertedWorkflow).toHaveProperty('metadata');
      expect(Array.isArray(result.convertedWorkflow.flow)).toBe(true);
      
      // Check that all nodes were converted
      expect(result.convertedWorkflow.flow.length).toBe(n8nWorkflow.nodes.length);
      
      // Check that node names were preserved
      const nodeNames = n8nWorkflow.nodes.map((node: any) => node.name);
      const moduleNames = result.convertedWorkflow.flow.map((module: any) => module.name);
      expect(moduleNames.sort()).toEqual(nodeNames.sort());
    });
    
    test('should identify parameters needing review', async () => {
      const result = await convertWorkflow(n8nWorkflow, 'n8n', 'make');
      
      // Check that parameters needing review were identified
      expect(result.parametersNeedingReview).toBeDefined();
      
      // In our sample workflow, we have expression parameters that should be flagged
      const expressionParams = n8nWorkflow.nodes
        .filter((node: any) => node.parameters)
        .flatMap((node: any) => {
          return Object.entries(node.parameters)
            .filter(([_, value]) => typeof value === 'string' && String(value).includes('=$'))
            .map(([key]) => `Node: ${node.name}, Parameter: ${key}`);
        });
      
      // Check that all expression parameters were identified
      expressionParams.forEach((param: string) => {
        expect(result.parametersNeedingReview).toContain(param);
      });
    });
    
    test('should generate conversion logs', async () => {
      const result = await convertWorkflow(n8nWorkflow, 'n8n', 'make');
      
      // Check that logs were generated
      expect(result.logs).toBeDefined();
      expect(result.logs.length).toBeGreaterThan(0);
      
      // Check for specific log messages
      expect(result.logs.some((log: any) => 
        (typeof log === 'string' && log.includes('Converting n8n workflow to Make format')) ||
        (typeof log === 'object' && log.message && log.message.includes('Converting n8n workflow to Make format'))
      )).toBe(true);
      expect(result.logs.some((log: any) => 
        (typeof log === 'string' && log.includes('Converted')) ||
        (typeof log === 'object' && log.message && log.message.includes('Converted'))
      )).toBe(true);
    });
  });
  
  describe('Make to n8n Conversion', () => {
    let makeWorkflow: any;
    
    beforeAll(() => {
      makeWorkflow = loadFixture('make', 'sample-workflow');
    });
    
    test('should convert Make workflow to n8n format', async () => {
      const result = await convertWorkflow(makeWorkflow, 'make', 'n8n');
      
      // Check that conversion was successful
      expect(result.convertedWorkflow).toBeDefined();
      expect(result.logs.length).toBeGreaterThan(0);
      
      // Check basic structure
      expect(result.convertedWorkflow).toHaveProperty('nodes');
      expect(result.convertedWorkflow).toHaveProperty('connections');
      expect(Array.isArray(result.convertedWorkflow.nodes)).toBe(true);
      
      // Check that all modules were converted
      expect(result.convertedWorkflow.nodes.length).toBe(makeWorkflow.flow.length);
      
      // Check that module names were preserved
      const moduleNames = makeWorkflow.flow.map((module: any) => module.name);
      const nodeNames = result.convertedWorkflow.nodes.map((node: any) => node.name);
      expect(nodeNames.sort()).toEqual(moduleNames.sort());
    });
    
    test('should identify parameters needing review', async () => {
      const result = await convertWorkflow(makeWorkflow, 'make', 'n8n');
      
      // Check that parameters needing review were identified
      expect(result.parametersNeedingReview).toBeDefined();
      
      // In our sample workflow, we have expression parameters that should be flagged
      const expressionParams = makeWorkflow.flow
        .filter((module: any) => module.mapper)
        .flatMap((module: any) => {
          return Object.entries(module.mapper)
            .filter(([_, value]) => typeof value === 'string' && String(value).includes('{{'))
            .map(([key]) => `Module: ${module.name}, Parameter: ${key}`);
        });
      
      // Check that all expression parameters were identified
      expressionParams.forEach((param: string) => {
        expect(result.parametersNeedingReview).toContain(param);
      });
    });
    
    test('should generate conversion logs', async () => {
      const result = await convertWorkflow(makeWorkflow, 'make', 'n8n');
      
      // Check that logs were generated
      expect(result.logs).toBeDefined();
      expect(result.logs.length).toBeGreaterThan(0);
      
      // Check for specific log messages
      expect(result.logs.some((log: any) => 
        (typeof log === 'string' && log.includes('Converting Make workflow to n8n format')) ||
        (typeof log === 'object' && log.message && log.message.includes('Converting Make workflow to n8n format'))
      )).toBe(true);
      expect(result.logs.some((log: any) => 
        typeof log === 'string' && log.includes('Converted') || 
        (typeof log === 'object' && log.message && log.message.includes('Converted'))
      )).toBe(true);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle null workflow gracefully', async () => {
      const result = await convertWorkflow(null as any, 'n8n', 'make');
      
      // Check that error was handled
      expect(result.convertedWorkflow).toEqual({});
      expect(result.logs.some((log: any) => 
        (typeof log === 'string' && log.includes('Error: No workflow provided')) ||
        (typeof log === 'object' && log.message && log.message.includes('Source workflow is empty'))
      )).toBe(true);
      expect(result.parametersNeedingReview).toEqual([]);
    });
    
    test('should handle same source and target platform', async () => {
      const workflow = loadFixture('n8n', 'sample-workflow');
      const result = await convertWorkflow(workflow, 'n8n', 'n8n');
      
      // Check that warning was generated
      expect(result.convertedWorkflow).toEqual(workflow);
      expect(result.logs.some((log: any) => 
        (typeof log === 'string' && log.includes('Warning: Source and target platforms are the same, no conversion needed')) ||
        (typeof log === 'object' && log.message && log.message.includes('Warning: Source and target platforms are the same, no conversion needed'))
      )).toBe(true);
      expect(result.parametersNeedingReview).toEqual([]);
    });
    
    test('should handle unsupported conversion path', async () => {
      // @ts-ignore - Testing invalid input
      const result = await convertWorkflow({}, 'unknown', 'make');
      
      // Check that error was handled
      expect(result.convertedWorkflow).toEqual({});
      expect(result.logs.some((log: any) => 
        (typeof log === 'string' && log.includes('Error: Unsupported conversion path')) ||
        (typeof log === 'object' && log.message && log.message.includes('Error: Unsupported conversion path'))
      )).toBe(true);
      expect(result.parametersNeedingReview).toEqual([]);
    });
  });
});

