"use client"

import { useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, AlertTriangle } from "lucide-react"
import { JsonViewer } from "./json-viewer"
import { MetadataDisplay } from "./metadata-display"
import { ActionButtons } from "./action-buttons"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { useDownload } from "@/hooks/use-download"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

interface ConversionResultPopupProps {
  isOpen: boolean
  onClose: () => void
  convertedJson: string
  sourcePlatform: string
  targetPlatform: string
  conversionTime?: number
  nodeCount?: number
}

export function ConversionResultPopup({
  isOpen,
  onClose,
  convertedJson,
  sourcePlatform,
  targetPlatform,
  conversionTime,
  nodeCount,
}: ConversionResultPopupProps) {
  const { copied, handleCopy } = useCopyToClipboard(convertedJson)
  const handleDownload = useDownload(convertedJson, targetPlatform)

  const { memoizedConvertedJson, error } = useMemo(() => {
    if (!convertedJson || convertedJson.trim() === "") {
      return { memoizedConvertedJson: "", error: "No JSON data available" }
    }

    try {
      const parsed = JSON.parse(convertedJson)
      return { memoizedConvertedJson: JSON.stringify(parsed, null, 2), error: null }
    } catch (error) {
      console.error("Error parsing JSON:", error)
      return { memoizedConvertedJson: "", error: "Invalid JSON data" }
    }
  }, [convertedJson])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex flex-col gap-1.5">
            <DialogTitle>Converted Workflow JSON</DialogTitle>
            <p className="text-sm text-muted-foreground">Ready to import into {targetPlatform}</p>
          </div>
          <Badge variant="outline" className="text-sm">
            {sourcePlatform} <ArrowRight className="mx-1 h-3 w-3" /> {targetPlatform}
          </Badge>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}. Please try the conversion again or check the source workflow.</AlertDescription>
          </Alert>
        ) : (
          <JsonViewer json={memoizedConvertedJson} platform={targetPlatform} />
        )}

        <DialogFooter className="flex justify-between items-center pt-4">
          <MetadataDisplay conversionTime={conversionTime} nodeCount={nodeCount} />
          <ActionButtons
            onCopy={handleCopy}
            onDownload={handleDownload}
            onClose={onClose}
            copied={copied}
            disabled={!!error}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

