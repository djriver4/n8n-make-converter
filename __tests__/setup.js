// Jest setup file
jest.setTimeout(30000); // Increase timeout for all tests

// Add custom matchers
expect.extend({
  toMatchWorkflowStructure(received, expected) {
    // Custom matcher for workflow structure validation
    const receivedHasNodes = 'nodes' in received;
    const receivedHasFlow = 'flow' in received;
    const expectedHasNodes = 'nodes' in expected;
    const expectedHasFlow = 'flow' in expected;
    
    // Check if both have the same structure (n8n or Make)
    const sameStructure = 
      (receivedHasNodes && expectedHasNodes) || 
      (receivedHasFlow && expectedHasFlow);
    
    if (!sameStructure) {
      return {
        message: () => `Expected workflow structure to match. 
          Received: ${receivedHasNodes ? 'n8n' : 'Make'} structure
          Expected: ${expectedHasNodes ? 'n8n' : 'Make'} structure`,
        pass: false
      };
    }
    
    // For n8n workflows
    if (receivedHasNodes) {
      const receivedNodeCount = received.nodes.length;
      const expectedNodeCount = expected.nodes.length;
      
      if (receivedNodeCount !== expectedNodeCount) {
        return {
          message: () => `Expected ${expectedNodeCount} nodes but received ${receivedNodeCount} nodes`,
          pass: false
        };
      }
      
      // Check if connections exist
      if (!received.connections || !expected.connections) {
        return {
          message: () => `Connections object missing in workflow`,
          pass: false
        };
      }
    }
    
    // For Make workflows
    if (receivedHasFlow) {
      const receivedModuleCount = received.flow.length;
      const expectedModuleCount = expected.flow.length;
      
      if (receivedModuleCount !== expectedModuleCount) {
        return {
          message: () => `Expected ${expectedModuleCount} modules but received ${receivedModuleCount} modules`,
          pass: false
        };
      }
    }
    
    return {
      message: () => `Workflow structures match`,
      pass: true
    };
  }
});

// Setup file for Jest tests

// Mock fetch for tests
if (!global.fetch) {
  global.fetch = jest.fn().mockImplementation(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
    })
  );
}

// Mock file system operations if needed
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('{}'),
  promises: {
    readFile: jest.fn().mockResolvedValue('{}')
  }
}));

// Try to import the test mocks - this might not work if TS is not transpiled
try {
  require('./utils/test-mocks');
} catch (e) {
  console.warn('Could not load test-mocks, continuing without them:', e.message);
} 