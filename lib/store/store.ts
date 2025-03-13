import { create } from "zustand"
import { persist } from "zustand/middleware"
import { detectPlatform } from "../platform-detector"
import { convertWorkflow } from "../converter"
import { sanitizeCredentials } from "../security/credential-handler"

type Log = {
  type: "info" | "warning" | "error"
  message: string
}

interface ConversionLog {
  type: "info" | "warning" | "error";
  message: string;
}

// Define the store state type
interface WorkflowState {
  // Source workflow data
  sourceJson: string
  parsedWorkflow: any | null
  sourcePlatform: "n8n" | "make" | null
  targetPlatform: "n8n" | "make" | null

  // Conversion results
  convertedJson: string
  conversionLogs: Log[]
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

  // Add these to the WorkflowState interface
  parameterReviewData: Record<string, any>
  isReviewing: boolean

  recentUploads: string[];

  // Actions
  setSourceJson: (json: string) => void
  setConvertedJson: (json: string) => void
  setSourcePlatform: (platform: "n8n" | "make" | null) => void
  setTargetPlatform: (platform: "n8n" | "make" | null) => void
  setActiveTab: (tab: "editor" | "logs" | "debug" | "analyze") => void
  setShowResults: (show: boolean) => void
  updateSettings: (settings: Partial<WorkflowState["settings"]>) => void
  resetWorkflow: () => void
  addLog: (log: Log) => void
  clearLogs: () => void
  setDebugData: (data: any) => void

  // Workflow operations
  parseWorkflow: (jsonString: string) => void
  convertWorkflow: () => Promise<void>
  uploadWorkflow: (json: any, platform: "n8n" | "make") => void
  setStubNodes: (nodes: any[]) => void

  // Add these to the actions
  setParameterReviewData: (data: Record<string, any>) => void
  setIsReviewing: (isReviewing: boolean) => void
  updateParameterReviewData: (
    nodeId: string,
    paramKey: string,
    value: any,
    action: "accept" | "reject" | "edit",
  ) => void

  setRecentUploads: (uploads: string[]) => void;
}

interface ConversionResult {
  convertedWorkflow: any;
  logs: ConversionLog[];
  parametersNeedingReview: string[];
  workflowHasFunction?: boolean;
  debugData?: any;
  parameterReviewData?: Record<string, any>;
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

      // Add these to the initial state
      parameterReviewData: {},
      isReviewing: false,

      recentUploads: [],

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
      addLog: (log) => set((state) => ({ conversionLogs: [...state.conversionLogs, log] })),
      clearLogs: () => set({ conversionLogs: [] }),
      setDebugData: (data) => set({ debugData: data }),

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
          const result = await convertWorkflow(
            state.parsedWorkflow,
            state.sourcePlatform,
            state.targetPlatform,
            state.settings,
          )

          if (!result || !result.convertedWorkflow) {
            throw new Error("Conversion failed: No converted workflow returned")
          }

          const { convertedWorkflow, logs, debugData, parameterReviewData } = result

          // Format the result
          const formattedJson = JSON.stringify(convertedWorkflow, null, 2)

          // Extract stub nodes from the converted workflow
          let stubNodes: any[] = []
          if (state.targetPlatform === "n8n" && convertedWorkflow.nodes) {
            stubNodes = convertedWorkflow.nodes.filter(
              (node: any) => node.type === "n8n-nodes-base.noOp" && node.parameters?.__stubInfo,
            )
          } else if (state.targetPlatform === "make" && convertedWorkflow.flow) {
            stubNodes = convertedWorkflow.flow.filter(
              (module: any) => module.module === "helper:Note" && module.mapper?.__stubInfo,
            )
          }

          // Update state
          set({
            convertedJson: formattedJson,
            conversionLogs: [{ type: "info", message: "Conversion completed successfully" }, ...(logs || [])],
            debugData: debugData || null,
            stubNodes,
            activeTab: stubNodes.length > 0 ? "debug" : (parameterReviewData && Object.keys(parameterReviewData).length > 0 ? "analyze" : "editor"),
            showResults: true,
            isConverting: false,
            parameterReviewData: parameterReviewData || {},
            isReviewing: Object.keys(parameterReviewData || {}).length > 0,
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
            activeTab: "logs",
          })
        }
      },

      // Upload workflow
      uploadWorkflow: (json, platform) => {
        const sanitizedJson = sanitizeCredentials(json)
        const jsonString = JSON.stringify(sanitizedJson, null, 2)

        set((state) => ({
          sourceJson: jsonString,
          parsedWorkflow: sanitizedJson,
          sourcePlatform: platform,
          targetPlatform: platform === "n8n" ? "make" : "n8n",
          convertedJson: "",
          conversionLogs: [],
          debugData: null,
          activeTab: "editor",
          recentUploads: [json.name, ...state.recentUploads].slice(0, 10),
        }))

        const state = get()
        if (state.settings.autoConvert) {
          setTimeout(() => {
            get().convertWorkflow()
          }, 100)
        }
      },
      // Add a function to update stub nodes
      setStubNodes: (nodes: any[]) => set({ stubNodes: nodes }),

      // Add these to the store actions
      setParameterReviewData: (data) => set({ parameterReviewData: data }),
      setIsReviewing: (isReviewing) => set({ isReviewing }),
      updateParameterReviewData: (nodeId, paramKey, value, action) =>
        set((state) => {
          const updatedData = { ...state.parameterReviewData }
          if (action === "accept" || action === "reject") {
            delete updatedData[nodeId].questionableParameters[paramKey]
          } else if (action === "edit") {
            updatedData[nodeId].questionableParameters[paramKey].value = value
          }
          return { parameterReviewData: updatedData }
        }),

      setRecentUploads: (uploads: string[]) => set({ recentUploads: uploads }),
    }),
    {
      name: "workflow-storage",
      // Only persist settings, not workflow data
      partialize: (state) => ({ settings: state.settings }),
    },
  ),
)

