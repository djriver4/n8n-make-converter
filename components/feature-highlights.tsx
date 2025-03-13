"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUp, Code, Webhook, GitMerge, Download, AlertCircle } from "lucide-react"
import { useWorkflowStore } from "@/lib/store/store"
import { useEffect, useState } from "react"

interface FeatureHighlightsProps {
  show: boolean
}

export function FeatureHighlights({ show }: FeatureHighlightsProps) {
  const { sourceJson, convertedJson } = useWorkflowStore()
  const [shouldShowFeatures, setShouldShowFeatures] = useState(false)

  useEffect(() => {
    setShouldShowFeatures(!(sourceJson || convertedJson))
  }, [sourceJson, convertedJson])

  if (!show || !shouldShowFeatures) return null

  const features = [
    {
      icon: <FileUp className="h-8 w-8 text-blue-500" />,
      title: "File Upload & Conversion",
      description: "Automatically detect and convert workflows between n8n and Make.com",
    },
    {
      icon: <Code className="h-8 w-8 text-indigo-500" />,
      title: "Live Code Editor",
      description: "Edit JSON directly with syntax highlighting and validation",
    },
    {
      icon: <Webhook className="h-8 w-8 text-purple-500" />,
      title: "API Schema Parser",
      description: "Map API endpoints and credentials between platforms",
    },
    {
      icon: <GitMerge className="h-8 w-8 text-green-500" />,
      title: "Node Mapping",
      description: "Intelligent mapping of nodes and modules with fallback options",
    },
    {
      icon: <Download className="h-8 w-8 text-orange-500" />,
      title: "Download & Import",
      description: "Export converted workflows ready for direct import",
    },
    {
      icon: <AlertCircle className="h-8 w-8 text-red-500" />,
      title: "Conversion Logs",
      description: "Detailed logs of changes, warnings, and errors during conversion",
    },
  ]

  return (
    <section className={`py-12 ${show ? "" : "hidden"}`}>
      <h2 className="text-2xl font-bold text-center mb-8">Key Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="mb-2">{feature.icon}</div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

