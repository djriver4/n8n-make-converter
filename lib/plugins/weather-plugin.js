"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherPlugin = void 0;
class WeatherPlugin {
    constructor() {
        this.id = "weather-integration";
        this.name = "Weather Integration";
        this.description = "Provides mappings for weather nodes and modules";
        this.version = "1.0.0";
        this.author = "n8n-make-converter";
    }
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
        };
    }
    // Special handling for weather data
    afterNodeMapping(sourceNode, targetNode, direction) {
        var _a, _b;
        if (direction === "makeToN8n" && sourceNode.module === "weather:ActionGetCurrentWeather") {
            // Set default values for n8n OpenWeatherMap node
            if (!targetNode.parameters)
                targetNode.parameters = {};
            targetNode.parameters.resource = "currentWeather";
            targetNode.parameters.authentication = "apiKey";
            targetNode.parameters.units = "metric";
            // Map city name
            if ((_a = sourceNode.mapper) === null || _a === void 0 ? void 0 : _a.city) {
                targetNode.parameters.cityName = sourceNode.mapper.city;
            }
        }
        if (direction === "n8nToMake" && sourceNode.type === "n8n-nodes-base.openWeatherMap") {
            // Set up Make.com weather module
            if (!targetNode.mapper)
                targetNode.mapper = {};
            targetNode.mapper.type = "name";
            // Map city name
            if ((_b = sourceNode.parameters) === null || _b === void 0 ? void 0 : _b.cityName) {
                targetNode.mapper.city = sourceNode.parameters.cityName;
            }
        }
        return targetNode;
    }
}
exports.WeatherPlugin = WeatherPlugin;
