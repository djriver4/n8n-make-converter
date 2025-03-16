"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Upload, FileUp, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { detectPlatform } from "@/lib/platform-detector"
import { useWorkflowStore } from "@/lib/store/store"
import { useUploadStore } from "@/lib/store/upload-store"
import { optimizeWorkflow } from "@/lib/performance/workflow-optimizer"
import { v4 as uuidv4 } from "uuid"
import { UploadNotification } from "./upload-notification"
import { ConversionPanel } from "./conversion-panel"
import { isDevelopmentMode } from "@/lib/utils/environment"
import { FeatureFlags } from "@/lib/feature-management/feature-flags"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [".json", ".workflow"]

export function FileUploader() {
  const [isUploading, setIsUploading] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { uploadWorkflow } = useWorkflowStore()
  const { addFile, updateFile, files } = useUploadStore()
  const [isDevMode, setIsDevMode] = useState(false)
  
  useEffect(() => {
    const devMode = isDevelopmentMode()
    setIsDevMode(devMode)
    
    if (devMode) {
      const fullConversionEnabled = FeatureFlags.getFlag('enableFullConversionInDevMode')
      console.log('[DevMode] Development mode active:', devMode)
      console.log('[DevMode] Full conversion enabled:', fullConversionEnabled)
    }
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (!selectedFile) return

      const fileId = uuidv4()

      addFile({
        id: fileId,
        name: selectedFile.name,
        status: "pending",
        progress: 0,
        size: selectedFile.size,
      })

      // Validate file type
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase()
      if (!ALLOWED_FILE_TYPES.includes(`.${fileExtension}`)) {
        updateFile(fileId, {
          status: "error",
          error: `Invalid file type. Allowed types are: ${ALLOWED_FILE_TYPES.join(", ")}`,
        })
        return
      }

      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        updateFile(fileId, {
          status: "error",
          error: `File size exceeds the maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        })
        return
      }

      setIsUploading(true)
      updateFile(fileId, { status: "uploading", progress: 10 })

      try {
        const text = await selectedFile.text()
        updateFile(fileId, { progress: 30 })

        let json
        try {
          json = JSON.parse(text)
          updateFile(fileId, { progress: 50 })
        } catch (parseError) {
          throw new Error("Invalid JSON file. Please check the file format.")
        }

        // Detect platform
        const platform = detectPlatform(json)
        if (!platform) {
          throw new Error("Unable to detect platform. Please ensure this is a valid n8n or Make.com workflow file.")
        }
        updateFile(fileId, { progress: 70, platform })

        // Log development mode status when processing a file
        if (isDevMode) {
          console.log('[DevMode] Processing workflow file in development mode')
          console.log('[DevMode] Full conversion enabled:', FeatureFlags.getFlag('enableFullConversionInDevMode'))
        }

        // Additional validation for Make.com workflows
        if (platform === "make" && json.flow && Array.isArray(json.flow)) {
          // Check for modules with undefined type properties
          const invalidModules = json.flow.filter((module: any) => module.type === undefined)
          if (invalidModules.length > 0) {
            throw new Error(`Invalid Make.com workflow: Found ${invalidModules.length} module(s) with undefined type properties. Please fix the workflow file.`)
          }
        }

        // Optimize large workflows for performance
        const optimizedJson = optimizeWorkflow(json)
        updateFile(fileId, { progress: 90 })

        // Upload to the workflow store
        uploadWorkflow(optimizedJson, platform)

        // Update file status to success
        updateFile(fileId, {
          status: "success",
          progress: 100,
          uploadedAt: new Date(),
        })
      } catch (error) {
        updateFile(fileId, {
          status: "error",
          error: error instanceof Error ? error.message : "Failed to process file",
        })
      } finally {
        setIsUploading(false)
      }
    },
    [addFile, updateFile, uploadWorkflow, isDevMode],
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Workflow
        </CardTitle>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 px-0">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Open conversion settings</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <ConversionPanel />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <FileUp className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-600 dark:text-slate-400">Drag & drop your JSON file or click to browse</p>
            <input
              id="file-upload"
              type="file"
              accept={ALLOWED_FILE_TYPES.join(",")}
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => document.getElementById("file-upload")?.click()}
            disabled={isUploading}
          >
            Select File
          </Button>

          {/* Show the most recent upload notification */}
          {files.length > 0 && (
            <UploadNotification
              fileName={files[0].name}
              status={files[0].status}
              progress={files[0].progress}
              error={files[0].error}
              platform={files[0].platform}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

