export interface NodeMappingDefinition {
  type: string
  parameterMap: Record<string, string>
  description?: string
  version?: number
}

export interface ConverterPlugin {
  id: string
  name: string
  description: string
  version: string
  author?: string

  // Node mappings provided by this plugin
  getNodeMappings(): {
    n8nToMake: Record<string, NodeMappingDefinition>
    makeToN8n: Record<string, NodeMappingDefinition>
  }

  // Optional hooks into the conversion process
  beforeConversion?(workflow: any, direction: "n8nToMake" | "makeToN8n"): any
  afterNodeMapping?(sourceNode: any, targetNode: any, direction: "n8nToMake" | "makeToN8n"): any
  afterConversion?(workflow: any, direction: "n8nToMake" | "makeToN8n"): any
}

