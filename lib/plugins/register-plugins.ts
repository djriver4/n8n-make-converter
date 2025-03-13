import { pluginRegistry } from "./plugin-registry"
import { NotionPlugin } from "./notion-plugin"
import { WeatherPlugin } from "./weather-plugin"
import { GoogleSheetsPlugin } from "./google-sheets-plugin"
import { enhanceNodeMappings } from "../node-info-fetchers/update-node-mappings"

// Register all plugins
export function registerPlugins() {
  // Register the Notion plugin
  pluginRegistry.registerPlugin(new NotionPlugin())

  // Register the Weather plugin
  pluginRegistry.registerPlugin(new WeatherPlugin())

  // Register the Google Sheets plugin
  pluginRegistry.registerPlugin(new GoogleSheetsPlugin())

  // Add more plugins here as they are developed

  console.log("Plugins registered:", pluginRegistry.getAllPlugins().length)

  // Enhance node mappings with local JSON file if available
  try {
    // Try to enhance node mappings in the background without blocking the UI
    setTimeout(() => {
      const localNodesPath = '/nodes-n8n.json'
      
      enhanceNodeMappings({
        useLocalFile: true,
        localFilePath: localNodesPath
      })
        .then(() => console.log("Node mappings enhanced with local data"))
        .catch(err => {
          console.warn("Error enhancing node mappings with local file:", err)
          
          // Fall back to GitHub if local file fails
          console.log("Falling back to GitHub for node data...")
          enhanceNodeMappings()
            .then(() => console.log("Node mappings enhanced with GitHub data"))
            .catch(err => console.warn("Error enhancing node mappings from GitHub:", err))
        })
    }, 1000)
  } catch (error) {
    console.warn("Failed to enhance node mappings:", error)
  }

  return {
    // Return any plugin APIs that might be needed elsewhere
  }
}

