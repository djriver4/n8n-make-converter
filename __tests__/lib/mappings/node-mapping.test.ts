import { getNodeMappings, baseNodeMapping } from "../../../lib/mappings/node-mapping"
import UserMappingStore from "../../../lib/user-mappings/user-mapping-store"

// Mock the UserMappingStore
jest.mock("../../../lib/user-mappings/user-mapping-store")

// Define a global window object for testing
Object.defineProperty(global, 'window', {
  value: {},
  writable: true,
});

describe("node-mapping", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Ensure window is defined for these tests
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
    });

    // Set up default mock implementations
    const userN8nToMake = {
      "custom-nodes-base.customNode": {
        type: "custom:CustomModule",
        parameterMap: {
          customParam: "customField",
        },
        description: "Custom node mapping",
        userDefined: true,
      }
    };

    const userMakeToN8n = {
      "custom:CustomModule": {
        type: "custom-nodes-base.customNode",
        parameterMap: {
          customField: "customParam",
        },
        description: "Custom module mapping",
        userDefined: true,
      }
    };

    // Mock the getMappingsForDirection method
    (UserMappingStore.getMappingsForDirection as jest.Mock).mockImplementation((direction) => {
      if (direction === "n8nToMake") {
        return userN8nToMake;
      } else {
        return userMakeToN8n;
      }
    });
  })

  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks();
  });

  describe("getNodeMappings", () => {
    it("should return base mappings when no user mappings exist", () => {
      // Mock empty user mappings
      (UserMappingStore.getMappingsForDirection as jest.Mock).mockReturnValue({})

      const mappings = getNodeMappings()

      // Check that the result contains the base mappings
      expect(Object.keys(mappings.n8nToMake)).toEqual(Object.keys(baseNodeMapping.n8nToMake))
      expect(Object.keys(mappings.makeToN8n)).toEqual(Object.keys(baseNodeMapping.makeToN8n))
    })

    it("should combine base mappings with user mappings", () => {
      // Add a custom mapping for testing
      const userN8nToMake = {
        "custom-nodes-base.customNode": {
          type: "custom:CustomModule",
          parameterMap: { customParam: "customField" },
          description: "Custom node mapping",
          userDefined: true,
        }
      };

      const userMakeToN8n = {
        "custom:CustomModule": {
          type: "custom-nodes-base.customNode",
          parameterMap: { customField: "customParam" },
          description: "Custom module mapping",
          userDefined: true,
        }
      };

      // Mock the user mapping getter
      (UserMappingStore.getMappingsForDirection as jest.Mock).mockImplementation((direction) => {
        return direction === "n8nToMake" ? userN8nToMake : userMakeToN8n;
      });

      const mappings = getNodeMappings()

      // Check for base mappings
      expect(mappings.n8nToMake["n8n-nodes-base.openWeatherMap"]).toBeDefined();
      
      // Check for user mappings - use type assertion to avoid TypeScript errors
      const n8nToMake = mappings.n8nToMake as Record<string, any>;
      expect(n8nToMake["custom-nodes-base.customNode"]).toBeDefined();
      expect(n8nToMake["custom-nodes-base.customNode"].type).toBe("custom:CustomModule");

      // Check Make to n8n direction
      expect(mappings.makeToN8n["weather:ActionGetCurrentWeather"]).toBeDefined();
      
      // Use type assertion for custom module
      const makeToN8n = mappings.makeToN8n as Record<string, any>;
      expect(makeToN8n["custom:CustomModule"]).toBeDefined();
      expect(makeToN8n["custom:CustomModule"].type).toBe("custom-nodes-base.customNode");
    })

    it("should prioritize user mappings over base mappings", () => {
      // Mock a user mapping that overrides a base mapping
      const userN8nToMake = {
        "n8n-nodes-base.openWeatherMap": {
          type: "custom:WeatherModule",
          parameterMap: { customParam: "customField" },
          description: "Custom weather mapping",
          userDefined: true,
        }
      };

      (UserMappingStore.getMappingsForDirection as jest.Mock).mockImplementation((direction) => {
        return direction === "n8nToMake" ? userN8nToMake : {};
      });

      const mappings = getNodeMappings()

      // Check that the user mapping overrides the base mapping
      expect(mappings.n8nToMake["n8n-nodes-base.openWeatherMap"].type).toBe("custom:WeatherModule");
    })

    it("should handle server-side rendering", () => {
      // Simulate server-side rendering by temporarily removing window
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      });

      const mappings = getNodeMappings()

      // Check that the result contains only the base mappings
      expect(Object.keys(mappings.n8nToMake)).toEqual(Object.keys(baseNodeMapping.n8nToMake));
      
      // Restore window
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      });
    })
  })

  describe("baseNodeMapping", () => {
    it("should contain mappings for common n8n nodes", () => {
      // Test for the existence of n8n node mappings using a more reliable approach
      const n8nNodeTypes = Object.keys(baseNodeMapping.n8nToMake);
      expect(n8nNodeTypes).toContain("n8n-nodes-base.openWeatherMap");
      expect(n8nNodeTypes).toContain("n8n-nodes-base.googleSheets");
      expect(n8nNodeTypes).toContain("n8n-nodes-base.switch");
      expect(n8nNodeTypes).toContain("n8n-nodes-base.gmail");
      expect(n8nNodeTypes).toContain("n8n-nodes-base.httpRequest");
    })

    it("should contain mappings for common Make.com modules", () => {
      // Test for the existence of Make.com module mappings
      const makeModuleTypes = Object.keys(baseNodeMapping.makeToN8n);
      expect(makeModuleTypes).toContain("weather:ActionGetCurrentWeather");
      expect(makeModuleTypes).toContain("google-sheets:addRow");
      expect(makeModuleTypes).toContain("builtin:BasicRouter");
      expect(makeModuleTypes).toContain("gmail:ActionSendEmail");
      expect(makeModuleTypes).toContain("http:ActionSendData");
    })

    it("should have consistent bidirectional mappings", () => {
      // Check that n8n -> Make -> n8n mappings are consistent
      for (const [n8nNodeType, makeMapping] of Object.entries(baseNodeMapping.n8nToMake)) {
        const makeModuleType = makeMapping.type

        // Check if there's a corresponding Make -> n8n mapping
        const makeToN8n = baseNodeMapping.makeToN8n as Record<string, any>;
        if (makeToN8n[makeModuleType]) {
          expect(makeToN8n[makeModuleType].type).toBe(n8nNodeType)
        }
      }
    })

    it("should have parameter mappings for each node type", () => {
      // Check n8n -> Make parameter mappings
      for (const [n8nNodeType, makeMapping] of Object.entries(baseNodeMapping.n8nToMake)) {
        expect(makeMapping).toHaveProperty("parameterMap")
        expect(makeMapping.parameterMap).toBeInstanceOf(Object)
      }

      // Check Make -> n8n parameter mappings
      for (const [makeModuleType, n8nMapping] of Object.entries(baseNodeMapping.makeToN8n)) {
        expect(n8nMapping).toHaveProperty("parameterMap")
        expect(n8nMapping.parameterMap).toBeInstanceOf(Object)
      }
    })
  })
})

