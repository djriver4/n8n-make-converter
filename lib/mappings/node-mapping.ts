import UserMappingStore from "../user-mappings/user-mapping-store"

// Define the NodeMappingDefinition interface
export interface NodeMappingDefinition {
  type: string;
  parameterMap: Record<string, string>;
  description?: string;
  userDefined?: boolean;
  displayName?: string;
}

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
      description: "Fetch current weather data from OpenWeather API",
      displayName: "Open Weather Map"
    },
    "n8n-nodes-base.googleSheets": {
      type: "google-sheets:addRow",
      parameterMap: {
        sheetName: "sheetId",
        documentId: "spreadsheetId",
        ranges: "range",
        data: "values",
      },
      description: "Interact with Google Sheets",
      displayName: "Google Sheets"
    },
    "n8n-nodes-base.switch": {
      type: "builtin:BasicRouter",
      parameterMap: {
        conditions: "routeParams",
        mode: "routingMode"
      },
      description: "Route workflows based on conditions",
      displayName: "Router"
    },
    "n8n-nodes-base.function": {
      type: "tools",
      parameterMap: {
        functionCode: "code"
      },
      description: "Execute custom JavaScript code",
      displayName: "Function"
    },
    "n8n-nodes-base.jsonParse": {
      type: "json",
      parameterMap: {
        property: "parsedObject"
      },
      description: "Parse JSON data",
      displayName: "JSON Parse"
    },
    "n8n-nodes-base.gmail": {
      type: "gmail:ActionSendEmail",
      parameterMap: {
        to: "to",
        subject: "subject",
        message: "text",
        cc: "cc",
        bcc: "bcc",
        attachments: "attachments"
      },
      description: "Send emails via Gmail",
      displayName: "Gmail"
    },
    "n8n-nodes-base.httpRequest": {
      type: "http:ActionSendData",
      parameterMap: {
        url: "url",
        method: "method",
        headers: "headers",
        body: "data",
        timeout: "timeout",
        responseFormat: "parseResponse"
      },
      description: "Make HTTP requests to external services",
      displayName: "HTTP Request"
    },
    "n8n-nodes-base.slack": {
      type: "slack:ActionSendMessage",
      parameterMap: {
        channel: "channel",
        text: "text",
        attachments: "attachments",
        otherOptions: "options"
      },
      description: "Send messages to Slack channels",
      displayName: "Slack"
    },
    "n8n-nodes-base.trello": {
      type: "trello:ActionCreateCard",
      parameterMap: {
        boardId: "board",
        listId: "list",
        cardName: "name",
        cardDescription: "desc",
        labels: "labels"
      },
      description: "Create and manage Trello cards",
      displayName: "Trello"
    },
    "n8n-nodes-base.jira": {
      type: "jira:ActionCreateIssue",
      parameterMap: {
        projectKey: "projectKey",
        issueType: "issueType",
        summary: "summary",
        description: "description",
        priority: "priority"
      },
      description: "Create and manage Jira issues",
      displayName: "Jira"
    }
  },

  // Make.com to n8n
  makeToN8n: {
    "weather:ActionGetCurrentWeather": {
      type: "n8n-nodes-base.openWeatherMap",
      parameterMap: {
        city: "cityName",
        units: "units",
      },
      description: "Fetch weather information",
      displayName: "Open Weather Map"
    },
    "google-sheets:addRow": {
      type: "n8n-nodes-base.googleSheets",
      parameterMap: {
        sheetId: "sheetName",
        spreadsheetId: "documentId",
        range: "ranges",
        values: "data"
      },
      description: "Work with Google Sheets",
      displayName: "Google Sheets"
    },
    "builtin:BasicRouter": {
      type: "n8n-nodes-base.switch",
      parameterMap: {
        routeParams: "conditions",
        routingMode: "mode"
      },
      description: "Route workflow execution based on conditions",
      displayName: "Router"
    },
    "tools": {
      type: "n8n-nodes-base.function",
      parameterMap: {
        code: "functionCode"
      },
      description: "Execute custom JavaScript code",
      displayName: "Function"
    },
    "json": {
      type: "n8n-nodes-base.jsonParse",
      parameterMap: {
        parsedObject: "property"
      },
      description: "Parse JSON data",
      displayName: "JSON Parse"
    },
    "gmail:ActionSendEmail": {
      type: "n8n-nodes-base.gmail",
      parameterMap: {
        to: "to",
        subject: "subject",
        text: "message",
        cc: "cc",
        bcc: "bcc",
        attachments: "attachments"
      },
      description: "Send emails via Gmail",
      displayName: "Gmail"
    },
    "http:ActionSendData": {
      type: "n8n-nodes-base.httpRequest",
      parameterMap: {
        url: "url",
        method: "method",
        headers: "headers",
        data: "body",
        timeout: "timeout",
        parseResponse: "responseFormat"
      },
      description: "Make HTTP requests",
      displayName: "HTTP Request"
    },
    "slack:ActionSendMessage": {
      type: "n8n-nodes-base.slack",
      parameterMap: {
        channel: "channel",
        text: "text",
        attachments: "attachments",
        options: "otherOptions"
      },
      description: "Send messages to Slack",
      displayName: "Slack"
    },
    "trello:ActionCreateCard": {
      type: "n8n-nodes-base.trello",
      parameterMap: {
        board: "boardId",
        list: "listId",
        name: "cardName",
        desc: "cardDescription",
        labels: "labels"
      },
      description: "Work with Trello cards",
      displayName: "Trello"
    },
    "jira:ActionCreateIssue": {
      type: "n8n-nodes-base.jira",
      parameterMap: {
        projectKey: "projectKey",
        issueType: "issueType",
        summary: "summary",
        description: "description",
        priority: "priority"
      },
      description: "Create and manage Jira issues",
      displayName: "Jira"
    }
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

