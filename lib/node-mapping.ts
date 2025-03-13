// Node mapping between n8n and Make.com
export const NODE_MAPPING = {
  // n8n to Make.com
  n8nToMake: {
    // Existing mappings...

    // Weather nodes
    "n8n-nodes-base.openWeatherMap": {
      module: "weather:ActionGetCurrentWeather",
      parameterMap: {
        cityName: "city",
        units: "units",
      },
    },

    // Google Sheets nodes
    "n8n-nodes-base.googleSheets": {
      module: "google-sheets:addRow",
      parameterMap: {
        sheetName: "sheetId",
        documentId: "spreadsheetId",
      },
    },

    // Router/Switch nodes
    "n8n-nodes-base.switch": {
      module: "builtin:BasicRouter",
      parameterMap: {},
    },
  },

  // Make.com to n8n
  makeToN8n: {
    // Existing mappings...

    // Weather modules
    "weather:ActionGetCurrentWeather": {
      type: "n8n-nodes-base.openWeatherMap",
      parameterMap: {
        city: "cityName",
        units: "units",
      },
    },

    // Google Sheets modules
    "google-sheets:addRow": {
      type: "n8n-nodes-base.googleSheets",
      parameterMap: {
        sheetId: "sheetName",
        spreadsheetId: "documentId",
      },
    },

    // Router modules
    "builtin:BasicRouter": {
      type: "n8n-nodes-base.switch",
      parameterMap: {},
    },
  },
}

