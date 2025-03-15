"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlugins = registerPlugins;
const plugin_registry_1 = require("./plugin-registry");
const notion_plugin_1 = require("./notion-plugin");
const weather_plugin_1 = require("./weather-plugin");
const google_sheets_plugin_1 = require("./google-sheets-plugin");
const update_node_mappings_1 = require("../node-info-fetchers/update-node-mappings");
// Register all plugins
function registerPlugins() {
    // Register the Notion plugin
    plugin_registry_1.pluginRegistry.registerPlugin(new notion_plugin_1.NotionPlugin());
    // Register the Weather plugin
    plugin_registry_1.pluginRegistry.registerPlugin(new weather_plugin_1.WeatherPlugin());
    // Register the Google Sheets plugin
    plugin_registry_1.pluginRegistry.registerPlugin(new google_sheets_plugin_1.GoogleSheetsPlugin());
    // Add more plugins here as they are developed
    console.log("Plugins registered:", plugin_registry_1.pluginRegistry.getAllPlugins().length);
    // Enhance node mappings with local JSON file if available
    try {
        // Try to enhance node mappings in the background without blocking the UI
        setTimeout(() => {
            const localNodesPath = '/nodes-n8n.json';
            (0, update_node_mappings_1.enhanceNodeMappings)({
                useLocalFile: true,
                localFilePath: localNodesPath
            })
                .then(() => console.log("Node mappings enhanced with local data"))
                .catch(err => {
                console.warn("Error enhancing node mappings with local file:", err);
                // Fall back to GitHub if local file fails
                console.log("Falling back to GitHub for node data...");
                (0, update_node_mappings_1.enhanceNodeMappings)()
                    .then(() => console.log("Node mappings enhanced with GitHub data"))
                    .catch(err => console.warn("Error enhancing node mappings from GitHub:", err));
            });
        }, 1000);
    }
    catch (error) {
        console.warn("Failed to enhance node mappings:", error);
    }
    return {
    // Return any plugin APIs that might be needed elsewhere
    };
}
