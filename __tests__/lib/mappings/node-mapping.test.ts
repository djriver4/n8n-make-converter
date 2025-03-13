import { getNodeMappings, baseNodeMapping } from "../../../lib/mappings/node-mapping"
import UserMappingStore from "../../../lib/user-mappings/user-mapping-store"

// Mock the UserMappingStore
jest.mock("../../../lib/user-mappings/user-mapping-store")

describe("node-mapping", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Set up default mock implementations
    ;(UserMappingStore.getMappingsForDirection as jest.Mock).mockImplementation((direction) => {
      if (direction === "n8nToMake") {
        return {
          "custom-nodes-base.customNode": {
            type: "custom:CustomModule",
            parameterMap: {
              customParam: "customField",
            },
            description: "Custom node mapping",
            userDefined: true,
          },
        }
      } else {
        return {
          "custom:CustomModule": {
            type: "custom-nodes-base.customNode",
            parameterMap: {
              customField: "customParam",
            },
            description: "Custom module mapping",
            userDefined: true,
          },
        }
      }
    })
  })

  describe("getNodeMappings", () => {
    it("should return base mappings when no user mappings exist", () => {
      // Mock empty user mappings
      ;(UserMappingStore.getMappingsForDirection as jest.Mock).mockReturnValue({})

      const mappings = getNodeMappings()

      // Check that the result contains the base mappings
      expect(mappings.n8nToMake).toEqual(baseNodeMapping.n8nToMake)
      expect(mappings.makeToN8n).toEqual(baseNodeMapping.makeToN8n)
    })

    it("should combine base mappings with user mappings", () => {
      const mappings = getNodeMappings()

      // Check that the result contains both base and user mappings
      expect(mappings.n8nToMake).toHaveProperty("n8n-nodes-base.openWeatherMap")
      expect(mappings.n8nToMake).toHaveProperty("custom-nodes-base.customNode")

      expect(mappings.makeToN8n).toHaveProperty("weather:ActionGetCurrentWeather")
      expect(mappings.makeToN8n).toHaveProperty("custom:CustomModule")
    })

    it("should prioritize user mappings over base mappings", () => {
      // Mock a user mapping that overrides a base mapping
      ;(UserMappingStore.getMappingsForDirection as jest.Mock).mockImplementation((direction) => {
        if (direction === "n8nToMake") {
          return {
            "n8n-nodes-base.openWeatherMap": {
              type: "custom:WeatherModule",
              parameterMap: {
                customParam: "customField",
              },
              description: "Custom weather mapping",
              userDefined: true,
            },
          }
        } else {
          return {}
        }
      })

      const mappings = getNodeMappings()

      // Check that the user mapping overrides the base mapping
      expect(mappings.n8nToMake["n8n-nodes-base.openWeatherMap"].type).toBe("custom:WeatherModule")
    })

    it("should handle server-side rendering", () => {
      // Simulate server-side rendering by temporarily removing window
      const originalWindow = global.window
      // Use a safer approach to handle window
      const windowBackup = { ...global };
      (global as any).window = undefined;

      const mappings = getNodeMappings()

      // Check that the result contains only the base mappings
      expect(mappings.n8nToMake).toEqual(baseNodeMapping.n8nToMake)
      
      // Restore global
      Object.assign(global, windowBackup);
    })
  })

  describe("baseNodeMapping", () => {
    it("should contain mappings for common n8n nodes", () => {
      expect(baseNodeMapping.n8nToMake).toHaveProperty("n8n-nodes-base.openWeatherMap")
      expect(baseNodeMapping.n8nToMake).toHaveProperty("n8n-nodes-base.googleSheets")
      expect(baseNodeMapping.n8nToMake).toHaveProperty("n8n-nodes-base.switch")
      expect(baseNodeMapping.n8nToMake).toHaveProperty("n8n-nodes-base.gmail")
      expect(baseNodeMapping.n8nToMake).toHaveProperty("n8n-nodes-base.httpRequest")
    })

    it("should contain mappings for common Make.com modules", () => {
      expect(baseNodeMapping.makeToN8n).toHaveProperty("weather:ActionGetCurrentWeather")
      expect(baseNodeMapping.makeToN8n).toHaveProperty("google-sheets:addRow")
      expect(baseNodeMapping.makeToN8n).toHaveProperty("builtin:BasicRouter")
      expect(baseNodeMapping.makeToN8n).toHaveProperty("gmail:ActionSendEmail")
      expect(baseNodeMapping.makeToN8n).toHaveProperty("http:ActionSendData")
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

