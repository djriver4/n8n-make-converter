export type ConversionPreset = {
  id: string
  name: string
  description: string
  settings: {
    preserveIds: boolean
    strictMode: boolean
    mappingAccuracy: number
    autoConvert: boolean
  }
}

// Default presets
export const DEFAULT_PRESETS: ConversionPreset[] = [
  {
    id: "balanced",
    name: "Balanced (Default)",
    description: "Standard conversion with balanced accuracy and compatibility",
    settings: {
      preserveIds: true,
      strictMode: false,
      mappingAccuracy: 75,
      autoConvert: true,
    },
  },
  {
    id: "strict",
    name: "Maximum Accuracy",
    description: "Prioritize accuracy over compatibility, may result in more unmapped nodes",
    settings: {
      preserveIds: true,
      strictMode: true,
      mappingAccuracy: 90,
      autoConvert: false,
    },
  },
  {
    id: "compatible",
    name: "Maximum Compatibility",
    description: "Prioritize converting all nodes, even with approximate mappings",
    settings: {
      preserveIds: false,
      strictMode: false,
      mappingAccuracy: 50,
      autoConvert: true,
    },
  },
]

export class PresetsManager {
  private static STORAGE_KEY = "conversion-presets"

  static getPresets(): ConversionPreset[] {
    if (typeof window === "undefined") return DEFAULT_PRESETS

    try {
      const storedPresets = localStorage.getItem(this.STORAGE_KEY)
      if (!storedPresets) return DEFAULT_PRESETS

      const userPresets = JSON.parse(storedPresets) as ConversionPreset[]
      return [...DEFAULT_PRESETS, ...userPresets.filter((p) => !DEFAULT_PRESETS.some((dp) => dp.id === p.id))]
    } catch (error) {
      console.error("Failed to load presets:", error)
      return DEFAULT_PRESETS
    }
  }

  static savePreset(preset: ConversionPreset): void {
    if (typeof window === "undefined") return

    try {
      const presets = this.getPresets()
      const existingIndex = presets.findIndex((p) => p.id === preset.id)

      if (existingIndex >= 0) {
        // Update existing preset
        presets[existingIndex] = preset
      } else {
        // Add new preset
        presets.push(preset)
      }

      // Filter out default presets before saving
      const userPresets = presets.filter((p) => !DEFAULT_PRESETS.some((dp) => dp.id === p.id))
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userPresets))
    } catch (error) {
      console.error("Failed to save preset:", error)
    }
  }

  static deletePreset(presetId: string): void {
    if (typeof window === "undefined") return

    try {
      // Don't allow deleting default presets
      if (DEFAULT_PRESETS.some((p) => p.id === presetId)) {
        console.warn("Cannot delete default preset")
        return
      }

      const presets = this.getPresets()
      const filteredPresets = presets.filter((p) => p.id !== presetId)

      // Filter out default presets before saving
      const userPresets = filteredPresets.filter((p) => !DEFAULT_PRESETS.some((dp) => dp.id === p.id))
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userPresets))
    } catch (error) {
      console.error("Failed to delete preset:", error)
    }
  }
}

