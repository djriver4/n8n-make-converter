type WorkflowJson = Record<string, any>

export function detectPlatform(workflow: any): "n8n" | "make" | null {
  if (!workflow) return null

  // Check for Make.com specific properties
  if (
    (workflow.flow && Array.isArray(workflow.flow)) ||
    (workflow.name && workflow.flow && workflow.metadata?.zone?.includes("make.com"))
  ) {
    return "make"
  }

  // Check for n8n specific properties
  if (
    workflow.nodes &&
    Array.isArray(workflow.nodes) &&
    workflow.connections &&
    typeof workflow.connections === "object"
  ) {
    return "n8n"
  }

  return null
}

