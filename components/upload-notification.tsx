"use client"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Loader2, X } from "lucide-react"
import type { UploadStatus } from "@/lib/store/upload-store"
import { cn } from "@/lib/utils"

interface UploadNotificationProps {
  fileName: string
  status: UploadStatus
  progress: number
  error?: string
  platform?: "n8n" | "make"
  onDismiss?: () => void
  showDismiss?: boolean
}

export function UploadNotification({
  fileName,
  status,
  progress,
  error,
  platform,
  onDismiss,
  showDismiss = false,
}: UploadNotificationProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border relative",
        status === "error" && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
        status === "success" && "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
        (status === "uploading" || status === "pending") &&
          "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",
      )}
    >
      <div className="flex items-center gap-3">
        {status === "error" && <AlertCircle className="h-5 w-5 text-red-600" />}
        {status === "success" && <CheckCircle className="h-5 w-5 text-green-600" />}
        {(status === "uploading" || status === "pending") && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{fileName}</p>
            {platform && (
              <Badge variant="outline" className="text-xs">
                {platform}
              </Badge>
            )}
          </div>

          {status === "error" && error && <p className="text-sm text-red-600 mt-1">{error}</p>}

          {(status === "uploading" || status === "pending") && (
            <div className="mt-2">
              <Progress value={progress} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1">{progress}% uploaded</p>
            </div>
          )}
        </div>

        {showDismiss && (
          <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

