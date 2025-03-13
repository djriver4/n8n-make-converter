import type { ConverterPlugin } from "./plugin-interface"

export class WeatherPlugin implements ConverterPlugin {
  id = "weather-integration"
  name = "Weather Integration"
  description = "Provides mappings for weather nodes and modules"
  version = "1.0.0"
  author = "n8n-make-converter"

  getNodeMappings() {
    return {
      n8nToMake: {
        "n8n-nodes-base.openWeatherMap": {
          type: "weather:ActionGetCurrentWeather",
          parameterMap: {
            cityName: "city",
            units: "units",
            apiKey: "apiKey",
          },
          description: "OpenWeatherMap node for weather data",
        },
      },
      makeToN8n: {
        "weather:ActionGetCurrentWeather": {
          type: "n8n-nodes-base.openWeatherMap",
          parameterMap: {
            city: "cityName",
            units: "units",
            apiKey: "apiKey",
          },
          description: "Weather module for current weather data",
        },
      },
    }
  }

  // Special handling for weather data
  afterNodeMapping(sourceNode: any, targetNode: any, direction: "n8nToMake" | "makeToN8n"): any {
    if (direction === "makeToN8n" && sourceNode.module === "weather:ActionGetCurrentWeather") {
      // Set default values for n8n OpenWeatherMap node
      if (!targetNode.parameters) targetNode.parameters = {}

      targetNode.parameters.resource = "currentWeather"
      targetNode.parameters.authentication = "apiKey"
      targetNode.parameters.units = "metric"

      // Map city name
      if (sourceNode.mapper?.city) {
        targetNode.parameters.cityName = sourceNode.mapper.city
      }
    }

    if (direction === "n8nToMake" && sourceNode.type === "n8n-nodes-base.openWeatherMap") {
      // Set up Make.com weather module
      if (!targetNode.mapper) targetNode.mapper = {}

      targetNode.mapper.type = "name"

      // Map city name
      if (sourceNode.parameters?.cityName) {
        targetNode.mapper.city = sourceNode.parameters.cityName
      }
    }

    return targetNode
  }
}

