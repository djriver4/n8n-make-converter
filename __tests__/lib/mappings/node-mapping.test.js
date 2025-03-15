"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

const node_mapping_1 = require("../../../lib/mappings/node-mapping");

// Define mock values
const mockUserN8nToMake = {
  "custom-nodes-base.customNode": {
    type: "custom:CustomModule",
    parameterMap: {
      customParam: "customField",
    },
    description: "Custom node mapping",
    userDefined: true,
  },
  "n8n-nodes-base.openWeatherMap": {
    type: "custom:WeatherModule",
    parameterMap: { customParam: "customField" },
    description: "Custom weather mapping",
    userDefined: true,
  }
};

const mockUserMakeToN8n = {
  "custom:CustomModule": {
    type: "custom-nodes-base.customNode",
    parameterMap: {
      customField: "customParam",
    },
    description: "Custom module mapping",
    userDefined: true,
  }
};

// Mock the user-mapping-store module
jest.mock("../../../lib/user-mappings/user-mapping-store", () => ({
  __esModule: true,
  default: {
    getMappingsForDirection: jest.fn((direction) => {
      if (direction === "n8nToMake") {
        return mockUserN8nToMake;
      } else if (direction === "makeToN8n") {
        return mockUserMakeToN8n; 
      }
      return {};
    }),
  }
}));

// Define a global window object for testing
Object.defineProperty(global, 'window', {
  value: {},
  writable: true,
});

describe("node-mapping", () => {
  describe("baseNodeMapping", () => {
    it("should contain mappings for common n8n nodes", () => {
      // Test for the existence of n8n node mappings
      const n8nNodeTypes = Object.keys(node_mapping_1.baseNodeMapping.n8nToMake);
      expect(n8nNodeTypes).toContain("n8n-nodes-base.openWeatherMap");
      expect(n8nNodeTypes).toContain("n8n-nodes-base.googleSheets");
      expect(n8nNodeTypes).toContain("n8n-nodes-base.switch");
      expect(n8nNodeTypes).toContain("n8n-nodes-base.gmail");
      expect(n8nNodeTypes).toContain("n8n-nodes-base.httpRequest");
    });

    it("should contain mappings for common Make.com modules", () => {
      // Test for the existence of Make.com module mappings
      const makeModuleTypes = Object.keys(node_mapping_1.baseNodeMapping.makeToN8n);
      expect(makeModuleTypes).toContain("weather:ActionGetCurrentWeather");
      expect(makeModuleTypes).toContain("google-sheets:addRow");
      expect(makeModuleTypes).toContain("builtin:BasicRouter");
      expect(makeModuleTypes).toContain("gmail:ActionSendEmail");
      expect(makeModuleTypes).toContain("http:ActionSendData");
    });

    it("should have consistent bidirectional mappings", () => {
      // Check that n8n -> Make -> n8n mappings are consistent
      for (const [n8nNodeType, makeMapping] of Object.entries(node_mapping_1.baseNodeMapping.n8nToMake)) {
        const makeModuleType = makeMapping.type;
        // Check if there's a corresponding Make -> n8n mapping
        const makeToN8n = node_mapping_1.baseNodeMapping.makeToN8n;
        if (makeToN8n[makeModuleType]) {
          expect(makeToN8n[makeModuleType].type).toBe(n8nNodeType);
        }
      }
    });

    it("should have parameter mappings for each node type", () => {
      // Check n8n -> Make parameter mappings
      for (const [n8nNodeType, makeMapping] of Object.entries(node_mapping_1.baseNodeMapping.n8nToMake)) {
        expect(makeMapping).toHaveProperty("parameterMap");
        expect(makeMapping.parameterMap).toBeInstanceOf(Object);
      }
      // Check Make -> n8n parameter mappings
      for (const [makeModuleType, n8nMapping] of Object.entries(node_mapping_1.baseNodeMapping.makeToN8n)) {
        expect(n8nMapping).toHaveProperty("parameterMap");
        expect(n8nMapping.parameterMap).toBeInstanceOf(Object);
      }
    });
  });

  describe("getNodeMappings", () => {
    it("should handle server-side rendering", () => {
      // Simulate server-side rendering by temporarily removing window
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      });
      const mappings = (0, node_mapping_1.getNodeMappings)();
      // Check that the result contains only the base mappings
      expect(Object.keys(mappings.n8nToMake)).toEqual(Object.keys(node_mapping_1.baseNodeMapping.n8nToMake));
      // Restore window
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });
    });
  });
});
