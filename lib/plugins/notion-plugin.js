"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotionPlugin = void 0;
class NotionPlugin {
    constructor() {
        this.id = "notion-integration";
        this.name = "Notion Integration";
        this.description = "Provides mappings for Notion nodes and modules";
        this.version = "1.0.0";
        this.author = "n8n-make-converter";
    }
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
        };
    }
    // Optional hook example
    afterNodeMapping(sourceNode, targetNode, direction) {
        var _a;
        // Special handling for Notion database properties
        if (direction === "n8nToMake" && sourceNode.type === "n8n-nodes-base.notion" && ((_a = sourceNode.parameters) === null || _a === void 0 ? void 0 : _a.properties)) {
            // Convert n8n property format to Make.com format
            if (!targetNode.mapper)
                targetNode.mapper = {};
            targetNode.mapper.properties = Object.entries(sourceNode.parameters.properties).map(([key, value]) => {
                return {
                    name: key,
                    value: value,
                };
            });
        }
        return targetNode;
    }
}
exports.NotionPlugin = NotionPlugin;
