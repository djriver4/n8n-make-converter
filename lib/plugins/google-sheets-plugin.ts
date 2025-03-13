import type { ConverterPlugin } from "./plugin-interface"

export class GoogleSheetsPlugin implements ConverterPlugin {
  id = "google-sheets-integration"
  name = "Google Sheets Integration"
  description = "Provides mappings for Google Sheets nodes and modules"
  version = "1.0.0"
  author = "n8n-make-converter"

  getNodeMappings() {
    return {
      n8nToMake: {
        "n8n-nodes-base.googleSheets": {
          type: "google-sheets:addRow",
          parameterMap: {
            sheetName: "sheetId",
            documentId: "spreadsheetId",
            operation: "operation",
          },
          description: "Google Sheets node for spreadsheet operations",
        },
      },
      makeToN8n: {
        "google-sheets:addRow": {
          type: "n8n-nodes-base.googleSheets",
          parameterMap: {
            sheetId: "sheetName",
            spreadsheetId: "documentId",
          },
          description: "Google Sheets module for adding rows",
        },
      },
    }
  }

  // Special handling for Google Sheets data
  afterNodeMapping(sourceNode: any, targetNode: any, direction: "n8nToMake" | "makeToN8n"): any {
    if (direction === "makeToN8n" && sourceNode.module === "google-sheets:addRow") {
      // Set default values for n8n Google Sheets node
      if (!targetNode.parameters) targetNode.parameters = {}

      targetNode.parameters.operation = "append"

      // Map sheet name and document ID
      if (sourceNode.mapper?.sheetId) {
        targetNode.parameters.sheetName = sourceNode.mapper.sheetId
      }

      if (sourceNode.mapper?.spreadsheetId) {
        targetNode.parameters.documentId = sourceNode.mapper.spreadsheetId.replace("/", "")
      }

      // Map values from Make.com format to n8n format
      if (sourceNode.mapper?.values) {
        const values = {}
        Object.entries(sourceNode.mapper.values).forEach(([key, value]) => {
          // Convert from Make.com's numeric keys to n8n's column names
          const columnName = String.fromCharCode(65 + Number.parseInt(key)) // 0 -> A, 1 -> B, etc.
          values[columnName] = value
        })
        targetNode.parameters.values = values
      }

      // Map options
      if (!targetNode.parameters.options) targetNode.parameters.options = {}

      if (sourceNode.mapper?.valueInputOption) {
        targetNode.parameters.options.valueInputMode =
          sourceNode.mapper.valueInputOption === "USER_ENTERED" ? "USER_ENTERED" : "RAW"
      }
    }

    if (direction === "n8nToMake" && sourceNode.type === "n8n-nodes-base.googleSheets") {
      // Set up Make.com Google Sheets module
      if (!targetNode.parameters) targetNode.parameters = {}
      if (!targetNode.mapper) targetNode.mapper = {}

      targetNode.parameters.__IMTCONN__ = 821060 // Default connection ID

      targetNode.mapper.from = "drive"
      targetNode.mapper.mode = "select"
      targetNode.mapper.includesHeaders = true
      targetNode.mapper.insertDataOption = "INSERT_ROWS"
      targetNode.mapper.valueInputOption = sourceNode.parameters?.options?.valueInputMode || "USER_ENTERED"
      targetNode.mapper.insertUnformatted = false

      // Map sheet name and document ID
      if (sourceNode.parameters?.sheetName) {
        targetNode.mapper.sheetId = sourceNode.parameters.sheetName
      }

      if (sourceNode.parameters?.documentId) {
        targetNode.mapper.spreadsheetId = `/${sourceNode.parameters.documentId}`
      }

      // Map values from n8n format to Make.com format
      if (sourceNode.parameters?.values) {
        const values = {}
        Object.entries(sourceNode.parameters.values).forEach(([key, value]) => {
          // Convert from n8n's column names to Make.com's numeric keys
          const numericKey = key.charCodeAt(0) - 65 // A -> 0, B -> 1, etc.
          values[numericKey.toString()] = value
        })
        targetNode.mapper.values = values
      }
    }

    return targetNode
  }
}

