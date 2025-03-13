"use client"

import { useCallback } from "react"

export const useDownload = (json: string, platform: string) => {
  return useCallback(() => {
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `converted-workflow-${platform}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [json, platform])
}

