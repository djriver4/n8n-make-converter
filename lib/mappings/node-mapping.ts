import UserMappingStore from "../user-mappings/user-mapping-store"

// Base node mappings between n8n and Make.com
export const BASE_NODE_MAPPING = {
  // n8n to Make.com
  n8nToMake: {
    "n8n-nodes-base.openWeatherMap": {
      type: "weather:ActionGetCurrentWeather",
      parameterMap: {
        cityName: "city",
        units: "units",
      },
    },
    "n8n-nodes-base.googleSheets": {
      type: "google-sheets:addRow",
      parameterMap: {
        sheetName: "sheetId",
        documentId: "spreadsheetId",
      },
    },
    "n8n-nodes-base.switch": {
      type: "builtin:BasicRouter",
      parameterMap: {},
    },
    "n8n-nodes-base.gmail": {
      type: "gmail:ActionSendEmail",
      parameterMap: {
        to: "to",
        subject: "subject",
        message: "text",
      },
    },
    "n8n-nodes-base.httpRequest": {
      type: "http:ActionSendData",
      parameterMap: {
        url: "url",
        method: "method",
        headers: "headers",
        body: "data",
      },
    },
  },

  // Make.com to n8n
  makeToN8n: {
    "weather:ActionGetCurrentWeather": {
      type: "n8n-nodes-base.openWeatherMap",
      parameterMap: {
        city: "cityName",
        units: "units",
      },
    },
    "google-sheets:addRow": {
      type: "n8n-nodes-base.googleSheets",
      parameterMap: {
        sheetId: "sheetName",
        spreadsheetId: "documentId",
      },
    },
    "builtin:BasicRouter": {
      type: "n8n-nodes-base.switch",
      parameterMap: {},
    },
    "gmail:ActionSendEmail": {
      type: "n8n-nodes-base.gmail",
      parameterMap: {
        to: "to",
        subject: "subject",
        text: "message",
      },
    },
    "http:ActionSendData": {
      type: "n8n-nodes-base.httpRequest",
      parameterMap: {
        url: "url",
        method: "method",
        headers: "headers",
        data: "body",
      },
    },
  },
}

// Function to get combined mappings (base + user-defined)
export function getNodeMappings() {
  // Get user-defined mappings
  const userN8nToMake = typeof window !== "undefined" ? UserMappingStore.getMappingsForDirection("n8nToMake") : {}

  const userMakeToN8n = typeof window !== "undefined" ? UserMappingStore.getMappingsForDirection("makeToN8n") : {}

  // Combine base and user mappings, with user mappings taking precedence
  return {
    n8nToMake: { ...BASE_NODE_MAPPING.n8nToMake, ...userN8nToMake },
    makeToN8n: { ...BASE_NODE_MAPPING.makeToN8n, ...userMakeToN8n },
  }
}

// Export the base mappings for reference
export const baseNodeMapping = BASE_NODE_MAPPING
export const nodeMapping = getNodeMappings()

