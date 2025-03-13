/**
 * Test mocks for unit tests
 */

// Mock node info for testing
export const mockNodeInfo = {
  "n8n-nodes-base.httpRequest": {
    name: "HTTP Request",
    displayName: "HTTP Request",
    description: "Make HTTP requests",
    properties: {
      url: {
        type: "string",
        displayName: "URL",
        required: true
      },
      method: {
        type: "string",
        displayName: "Method",
        required: true,
        default: "GET"
      }
    }
  },
  "n8n-nodes-base.function": {
    name: "Function",
    displayName: "Function",
    description: "Execute custom JavaScript code",
    properties: {
      functionCode: {
        type: "string",
        displayName: "Function Code",
        required: true
      }
    }
  },
  "n8n-nodes-base.jsonParse": {
    name: "JSON Parse",
    displayName: "JSON Parse",
    description: "Parse a JSON string",
    properties: {
      property: {
        type: "string",
        displayName: "Property",
        required: true
      }
    }
  },
  "n8n-nodes-base.switch": {
    name: "Switch",
    displayName: "Switch",
    description: "Route workflow based on conditions",
    properties: {
      conditions: {
        type: "array",
        displayName: "Conditions",
        required: true
      }
    }
  },
  "n8n-nodes-base.gmail": {
    name: "Gmail",
    displayName: "Gmail",
    description: "Gmail operations",
    properties: {
      operation: {
        type: "string",
        displayName: "Operation",
        required: true
      }
    }
  },
  "n8n-nodes-base.googleSheets": {
    name: "Google Sheets",
    displayName: "Google Sheets",
    description: "Google Sheets operations",
    properties: {
      operation: {
        type: "string",
        displayName: "Operation",
        required: true
      }
    }
  },
  "n8n-nodes-base.openWeatherMap": {
    name: "Open Weather Map",
    displayName: "Open Weather Map",
    description: "Get weather data",
    properties: {
      cityName: {
        type: "string",
        displayName: "City Name",
        required: true
      },
      units: {
        type: "string",
        displayName: "Units",
        required: false,
        default: "metric"
      }
    }
  }
};

// Mock the node-info-fetchers module
jest.mock("../../lib/node-info-fetchers/local-node-loader", () => ({
  loadNodesFromFile: jest.fn().mockImplementation(() => Promise.resolve(mockNodeInfo))
}));

jest.mock("../../lib/node-info-fetchers/github-node-fetcher", () => ({
  fetchNodesFromGitHub: jest.fn().mockImplementation(() => Promise.resolve({}))
}));

jest.mock("../../lib/node-info-fetchers/update-node-mappings", () => {
  // Save the original module to use its exports
  const originalModule = jest.requireActual("../../lib/node-info-fetchers/update-node-mappings");
  
  return {
    ...originalModule,
    // Override the ensureMappingsEnhanced function
    ensureMappingsEnhanced: jest.fn().mockImplementation(() => Promise.resolve(true))
  };
}); 