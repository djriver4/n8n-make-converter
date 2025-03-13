import { create } from "zustand"
import { persist } from "zustand/middleware"
import { detectPlatform } from "../lib/platform-detector"
import { convertWorkflow } from "../lib/converter"
import { sanitizeCredentials } from "../lib/security/credential-handler"

// Define the store state type
interface WorkflowState {
  // Source workflow data
  sourceJson: string
  parsedWorkflow: any | null
  sourcePlatform: "n8n" | "make" | null

  // Conversion results
  convertedJson: string
  targetPlatform: "n8n" | "make" | null
  conversionLogs: Array<{ type: "info" | "warning" | "error"; message: string }>
  debugData: any | null

  // UI state
  isConverting: boolean
  showResults: boolean
  activeTab: "editor" | "logs" | "debug" | "analyze"

  // Conversion settings
  settings: {
    preserveIds: boolean
    strictMode: boolean
    mappingAccuracy: number
    autoConvert: boolean
  }

  // Add this new property
  stubNodes: Array<any>

  // Actions
  setSourceJson: (json: string) => void
  setConvertedJson: (json: string) => void
  setSourcePlatform: (platform: "n8n" | "make" | null) => void
  setTargetPlatform: (platform: "n8n" | "make" | null) => void
  setActiveTab: (tab: "editor" | "logs" | "debug" | "analyze") => void
  setShowResults: (show: boolean) => void
  updateSettings: (settings: Partial<WorkflowState["settings"]>) => void
  resetWorkflow: () => void

  // Workflow operations
  parseWorkflow: (jsonString: string) => void
  convertWorkflow: () => Promise<void>
  uploadWorkflow: (json: any, platform: "n8n" | "make") => void
  setStubNodes: (nodes) => void
}

// Create the store
export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      // Initial state
      sourceJson: "",
      parsedWorkflow: null,
      sourcePlatform: null,
      convertedJson: "",
      targetPlatform: null,
      conversionLogs: [],
      debugData: null,
      isConverting: false,
      showResults: false,
      activeTab: "editor",

      // Default settings
      settings: {
        preserveIds: true,
        strictMode: false,
        mappingAccuracy: 75,
        autoConvert: true,
      },

      // Initialize the new property
      stubNodes: [],

      // Actions
      setSourceJson: (json) => set({ sourceJson: json }),
      setConvertedJson: (json) => set({ convertedJson: json }),
      setSourcePlatform: (platform) =>
        set({
          sourcePlatform: platform,
          targetPlatform: platform === "n8n" ? "make" : "n8n",
        }),
      setTargetPlatform: (platform) => set({ targetPlatform: platform }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setShowResults: (show) => set({ showResults: show }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        })),

      resetWorkflow: () =>
        set({
          sourceJson: "",
          parsedWorkflow: null,
          sourcePlatform: null,
          convertedJson: "",
          targetPlatform: null,
          conversionLogs: [],
          debugData: null,
          showResults: false,
          activeTab: "editor",
        }),

      // Parse workflow JSON and detect platform
      parseWorkflow: (jsonString) => {
        try {
          if (!jsonString.trim()) {
            set({
              parsedWorkflow: null,
              sourcePlatform: null,
              targetPlatform: null,
            })
            return
          }

          const json = JSON.parse(jsonString)

          // Sanitize credentials before storing
          const sanitizedJson = sanitizeCredentials(json)

          const platform = detectPlatform(sanitizedJson)

          set({
            parsedWorkflow: sanitizedJson,
            sourcePlatform: platform,
            targetPlatform: platform === "n8n" ? "make" : "n8n",
          })
        } catch (error) {
          set({
            parsedWorkflow: null,
            sourcePlatform: null,
            targetPlatform: null,
            conversionLogs: [
              {
                type: "error",
                message: "Failed to parse JSON: " + (error instanceof Error ? error.message : String(error)),
              },
            ],
          })
        }
      },

      // Convert workflow
      convertWorkflow: async () => {
        const state = get()

        // Validate inputs
        if (!state.sourceJson || !state.sourcePlatform || !state.targetPlatform || !state.parsedWorkflow) {
          set({
            conversionLogs: [
              {
                type: "error",
                message: "Missing required data for conversion. Please ensure you have a valid workflow.",
              },
            ],
            activeTab: "logs",
          })
          return
        }

        set({
          isConverting: true,
          conversionLogs: [{ type: "info", message: "Starting conversion..." }],
          activeTab: "logs",
        })

        try {
          // Perform the conversion
          const { convertedWorkflow, logs, debugData } = await convertWorkflow(
            state.parsedWorkflow,
            state.sourcePlatform,
            state.targetPlatform,
            state.settings,
          )

          // Format the result
          const formattedJson = JSON.stringify(convertedWorkflow, null, 2)

          // Extract stub nodes from the converted workflow
          let stubNodes = []
          if (state.targetPlatform === "n8n" && convertedWorkflow.nodes) {
            stubNodes = convertedWorkflow.nodes.filter(
              (node) => node.type === "n8n-nodes-base.noOp" && node.parameters?.__stubInfo,
            )
          } else if (state.targetPlatform === "make" && convertedWorkflow.flow) {
            stubNodes = convertedWorkflow.flow.filter(
              (module) => module.module === "helper:Note" && module.mapper?.__stubInfo,
            )
          }

          // Update state
          set({
            convertedJson: formattedJson,
            conversionLogs: [{ type: "info", message: "Conversion completed successfully" }, ...logs],
            debugData,
            stubNodes,
            activeTab: stubNodes.length > 0 ? "debug" : "editor", // Switch to debug tab if there are stub nodes
            showResults: true,
            isConverting: false,
          })
        } catch (error) {
          console.error("Conversion error:", error)

          set({
            conversionLogs: [
              {
                type: "error",
                message: error instanceof Error ? error.message : "Failed to convert workflow",
              },
            ],
            isConverting: false,
          })
        }
      },

      // Upload workflow
      uploadWorkflow: (json, platform) => {
        // Sanitize credentials before storing
        const sanitizedJson = sanitizeCredentials(json)

        const jsonString = JSON.stringify(sanitizedJson, null, 2)

        set({
          sourceJson: jsonString,
          parsedWorkflow: sanitizedJson,
          sourcePlatform: platform,
          targetPlatform: platform === "n8n" ? "make" : "n8n",
          convertedJson: "",
          conversionLogs: [],
          debugData: null,
          activeTab: "editor",
        })

        // Auto-convert if enabled
        const state = get()
        if (state.settings.autoConvert) {
          setTimeout(() => {
            get().convertWorkflow()
          }, 100)
        }
      },
      // Add a function to update stub nodes
      setStubNodes: (nodes) => set({ stubNodes: nodes }),
    }),
    {
      name: "workflow-storage",
      // Only persist settings, not workflow data
      partialize: (state) => ({ settings: state.settings }),
    },
  ),
)

