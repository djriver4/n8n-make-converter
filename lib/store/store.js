"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWorkflowStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
const platform_detector_1 = require("../platform-detector");
const converter_1 = require("../converter");
const credential_handler_1 = require("../security/credential-handler");
// Create the store
exports.useWorkflowStore = (0, zustand_1.create)()((0, middleware_1.persist)((set, get) => ({
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
    setSourcePlatform: (platform) => set({
        sourcePlatform: platform,
        targetPlatform: platform === "n8n" ? "make" : "n8n",
    }),
    setTargetPlatform: (platform) => set({ targetPlatform: platform }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setShowResults: (show) => set({ showResults: show }),
    addLog: (log) => set((state) => ({ conversionLogs: [...state.conversionLogs, log] })),
    clearLogs: () => set({ conversionLogs: [] }),
    setDebugData: (data) => set({ debugData: data }),
    updateSettings: (newSettings) => set((state) => ({
        settings: Object.assign(Object.assign({}, state.settings), newSettings),
    })),
    resetWorkflow: () => set({
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
                });
                return;
            }
            const json = JSON.parse(jsonString);
            // Sanitize credentials before storing
            const sanitizedJson = (0, credential_handler_1.sanitizeCredentials)(json);
            const platform = (0, platform_detector_1.detectPlatform)(sanitizedJson);
            set({
                parsedWorkflow: sanitizedJson,
                sourcePlatform: platform,
                targetPlatform: platform === "n8n" ? "make" : "n8n",
            });
        }
        catch (error) {
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
            });
        }
    },
    // Convert workflow
    convertWorkflow: () => __awaiter(void 0, void 0, void 0, function* () {
        const state = get();
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
            });
            return;
        }
        set({
            isConverting: true,
            conversionLogs: [{ type: "info", message: "Starting conversion..." }],
            activeTab: "logs",
        });
        try {
            // Perform the conversion
            const result = yield (0, converter_1.convertWorkflow)(state.parsedWorkflow, state.sourcePlatform, state.targetPlatform, state.settings);
            if (!result || !result.convertedWorkflow) {
                throw new Error("Conversion failed: No converted workflow returned");
            }
            const { convertedWorkflow, logs, debugData, parameterReviewData } = result;
            // Format the result
            const formattedJson = JSON.stringify(convertedWorkflow, null, 2);
            // Extract stub nodes from the converted workflow
            let stubNodes = [];
            if (state.targetPlatform === "n8n" && convertedWorkflow.nodes) {
                stubNodes = convertedWorkflow.nodes.filter((node) => { var _a; return node.type === "n8n-nodes-base.noOp" && ((_a = node.parameters) === null || _a === void 0 ? void 0 : _a.__stubInfo); });
            }
            else if (state.targetPlatform === "make" && convertedWorkflow.flow) {
                stubNodes = convertedWorkflow.flow.filter((module) => { var _a; return module.module === "helper:Note" && ((_a = module.mapper) === null || _a === void 0 ? void 0 : _a.__stubInfo); });
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
            });
        }
        catch (error) {
            console.error("Conversion error:", error);
            set({
                conversionLogs: [
                    {
                        type: "error",
                        message: error instanceof Error ? error.message : "Failed to convert workflow",
                    },
                ],
                isConverting: false,
                activeTab: "logs",
            });
        }
    }),
    // Upload workflow
    uploadWorkflow: (json, platform) => {
        const sanitizedJson = (0, credential_handler_1.sanitizeCredentials)(json);
        const jsonString = JSON.stringify(sanitizedJson, null, 2);
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
        }));
        const state = get();
        if (state.settings.autoConvert) {
            setTimeout(() => {
                get().convertWorkflow();
            }, 100);
        }
    },
    // Add a function to update stub nodes
    setStubNodes: (nodes) => set({ stubNodes: nodes }),
    // Add these to the store actions
    setParameterReviewData: (data) => set({ parameterReviewData: data }),
    setIsReviewing: (isReviewing) => set({ isReviewing }),
    updateParameterReviewData: (nodeId, paramKey, value, action) => set((state) => {
        const updatedData = Object.assign({}, state.parameterReviewData);
        if (action === "accept" || action === "reject") {
            delete updatedData[nodeId].questionableParameters[paramKey];
        }
        else if (action === "edit") {
            updatedData[nodeId].questionableParameters[paramKey].value = value;
        }
        return { parameterReviewData: updatedData };
    }),
    setRecentUploads: (uploads) => set({ recentUploads: uploads }),
}), {
    name: "workflow-storage",
    // Only persist settings, not workflow data
    partialize: (state) => ({ settings: state.settings }),
}));
