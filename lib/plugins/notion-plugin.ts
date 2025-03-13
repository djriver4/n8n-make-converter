import type { ConverterPlugin } from "./plugin-interface"

export class NotionPlugin implements ConverterPlugin {
  id = "notion-integration"
  name = "Notion Integration"
  description = "Provides mappings for Notion nodes and modules"
  version = "1.0.0"
  author = "n8n-make-converter"

  getNodeMappings() {
    return {
      n8nToMake: {
        "n8n-nodes-base.notion": {
          type: "notion",
          parameterMap: {
            resource: "resource",
            operation: "operation",
            databaseId: "database",
            pageId: "page",
            title: "title",
            properties: "properties",
          },
          description: "Notion node for database and page operations",
        },
        "n8n-nodes-base.notionTrigger": {
          type: "notion:watchDatabaseItems",
          parameterMap: {
            databaseId: "database",
            limit: "limit",
            event: "select",
          },
          description: "Notion trigger for watching database changes",
        },
      },
      makeToN8n: {
        notion: {
          type: "n8n-nodes-base.notion",
          parameterMap: {
            resource: "resource",
            operation: "operation",
            database: "databaseId",
            page: "pageId",
            title: "title",
            properties: "properties",
          },
          description: "Notion module for database and page operations",
        },
        "notion:watchDatabaseItems": {
          type: "n8n-nodes-base.notionTrigger",
          parameterMap: {
            database: "databaseId",
            limit: "limit",
            select: "event",
          },
          description: "Notion trigger module for watching database changes",
        },
      },
    }
  }

  // Optional hook example
  afterNodeMapping(sourceNode: any, targetNode: any, direction: "n8nToMake" | "makeToN8n"): any {
    // Special handling for Notion database properties
    if (direction === "n8nToMake" && sourceNode.type === "n8n-nodes-base.notion" && sourceNode.parameters?.properties) {
      // Convert n8n property format to Make.com format
      if (!targetNode.mapper) targetNode.mapper = {}

      targetNode.mapper.properties = Object.entries(sourceNode.parameters.properties).map(([key, value]) => {
        return {
          name: key,
          value: value,
        }
      })
    }

    return targetNode
  }
}

