"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Copy, Check, ArrowRight, FileDown } from "lucide-react"
import { useWorkflowStore } from "@/lib/store/store"

// Dynamically import the Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-400">Loading editor...</div>
  ),
})

type ConversionResultsProps = {
  onClose: () => void
}

export function ConversionResults({ onClose }: ConversionResultsProps) {
  const { convertedJson, sourcePlatform, targetPlatform } = useWorkflowStore()

  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(convertedJson)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([convertedJson], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `converted-workflow-${targetPlatform}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Editor options
  const editorOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    automaticLayout: true,
    readOnly: true,
  }

  if (!convertedJson || !sourcePlatform || !targetPlatform) {
    return null // or return a loading state or error message
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between w-full">
            <span>Converted Workflow JSON</span>
            <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium bg-slate-100 dark:bg-slate-800">
              {sourcePlatform}
              <ArrowRight className="h-3 w-3 mx-2" />
              {targetPlatform}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Your workflow has been converted. Review the results below. Ready to import into make
          </DialogDescription>
        </DialogHeader>

        <Card className="flex-1 flex flex-col mt-4">
          <CardContent className="p-0 flex-1">
            <div className="h-full border rounded-md overflow-hidden">
              <MonacoEditor
                height="100%"
                language="json"
                theme="vs-dark"
                value={convertedJson}
                options={editorOptions}
              />
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copied" : "Copy JSON"}
            </Button>
            <Button onClick={handleDownload}>
              <FileDown className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

