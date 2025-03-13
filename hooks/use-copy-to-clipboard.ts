"use client"

import { useState, useCallback } from "react"

export const useCopyToClipboard = (text: string) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  return { copied, handleCopy }
}

