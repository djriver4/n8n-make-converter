"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Copy, Check, Download, X } from "lucide-react"

interface ActionButtonsProps {
  onCopy: () => void
  onDownload: () => void
  onClose: () => void
  copied: boolean
  disabled: boolean
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onCopy, onDownload, onClose, copied, disabled }) => {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onCopy} disabled={disabled}>
        {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
        {copied ? "Copied" : "Copy JSON"}
      </Button>
      <Button variant="outline" size="sm" onClick={onDownload} disabled={disabled}>
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
      <Button variant="outline" size="sm" onClick={onClose}>
        <X className="h-4 w-4 mr-2" />
        Close
      </Button>
    </div>
  )
}

