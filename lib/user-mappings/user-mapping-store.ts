import type { NodeMappingDefinition } from "../mappings/node-mapping"

export interface UserMapping {
  id: string
  name: string
  description?: string
  sourceType: string
  targetType: string
  direction: "n8nToMake" | "makeToN8n"
  parameterMap: Record<string, string> | string
  transformationCode?: string
  createdAt: number
  updatedAt: number
}

class UserMappingStore {
  private static STORAGE_KEY = "user-node-mappings"

  // Get all user-defined mappings
  static getMappings(): UserMapping[] {
    if (typeof window === "undefined") return []

    try {
      const storedMappings = localStorage.getItem(this.STORAGE_KEY)
      if (!storedMappings) return []

      return JSON.parse(storedMappings) as UserMapping[]
    } catch (error) {
      console.error("Failed to load user mappings:", error)
      return []
    }
  }

  // Get mappings for a specific direction
  static getMappingsForDirection(direction: "n8nToMake" | "makeToN8n"): Record<string, NodeMappingDefinition> {
    const mappings = this.getMappings().filter((m) => m.direction === direction)

    return mappings.reduce(
      (acc, mapping) => {
        // Parse parameter map if it's a string
        let parameterMap: Record<string, string> = {}
        if (typeof mapping.parameterMap === 'string') {
          try {
            parameterMap = JSON.parse(mapping.parameterMap)
          } catch (e) {
            console.error(`Failed to parse parameter map for ${mapping.name}:`, e)
            parameterMap = {}
          }
        } else {
          parameterMap = mapping.parameterMap
        }

        acc[mapping.sourceType] = {
          type: mapping.targetType,
          parameterMap: parameterMap,
          description: mapping.description,
          userDefined: true,
        }
        return acc
      },
      {} as Record<string, NodeMappingDefinition>,
    )
  }

  // Save a new mapping or update an existing one
  static saveMapping(mapping: Omit<UserMapping, "createdAt" | "updatedAt" | "id">): UserMapping {
    if (typeof window === "undefined") throw new Error("Cannot save mappings on the server side")

    const mappings = this.getMappings()

    // Create a new mapping with ID and timestamps
    const newMapping: UserMapping = {
      ...mapping,
      id: `user-mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // Add to mappings array
    mappings.push(newMapping)

    // Save to localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mappings))

    return newMapping
  }

  // Update an existing mapping
  static updateMapping(
    id: string,
    updates: Partial<Omit<UserMapping, "id" | "createdAt" | "updatedAt">>,
  ): UserMapping | null {
    if (typeof window === "undefined") throw new Error("Cannot update mappings on the server side")

    const mappings = this.getMappings()
    const mappingIndex = mappings.findIndex((m) => m.id === id)

    if (mappingIndex === -1) return null

    // Update the mapping
    const updatedMapping: UserMapping = {
      ...mappings[mappingIndex],
      ...updates,
      updatedAt: Date.now(),
    }

    mappings[mappingIndex] = updatedMapping

    // Save to localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mappings))

    return updatedMapping
  }

  // Delete a mapping
  static deleteMapping(id: string): boolean {
    if (typeof window === "undefined") throw new Error("Cannot delete mappings on the server side")

    const mappings = this.getMappings()
    const filteredMappings = mappings.filter((m) => m.id !== id)

    if (filteredMappings.length === mappings.length) {
      return false // No mapping was deleted
    }

    // Save to localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredMappings))

    return true
  }

  // Clear all mappings
  static clearMappings(): void {
    if (typeof window === "undefined") return

    localStorage.removeItem(this.STORAGE_KEY)
  }

  // Export mappings to JSON
  static exportMappings(): string {
    const mappings = this.getMappings()
    return JSON.stringify(mappings, null, 2)
  }

  // Import mappings from JSON
  static importMappings(json: string): boolean {
    try {
      const mappings = JSON.parse(json) as UserMapping[]

      // Validate mappings
      if (!Array.isArray(mappings)) {
        throw new Error("Invalid mappings format: expected an array")
      }

      // Basic validation of each mapping
      mappings.forEach((mapping) => {
        if (!mapping.sourceType || !mapping.targetType || !mapping.direction || !mapping.parameterMap) {
          throw new Error("Invalid mapping: missing required fields")
        }
      })

      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, json)

      return true
    } catch (error) {
      console.error("Failed to import mappings:", error)
      return false
    }
  }
}

export default UserMappingStore

