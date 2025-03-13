import type React from "react"
import dynamic from "next/dynamic"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-800 flex items-center justify-center text-slate-400">Loading editor...</div>
  ),
})

interface JsonViewerProps {
  json: string
  platform: string
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ json, platform }) => {
  if (json === "Error: Invalid JSON") {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          The converted JSON is invalid. Please try the conversion again or check the source workflow.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex-grow overflow-hidden border rounded-md bg-slate-950">
      <MonacoEditor
        height="100%"
        language="json"
        theme="vs-dark"
        value={json}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          automaticLayout: true,
          lineNumbers: "on",
          renderLineHighlight: "all",
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            verticalScrollbarSize: 14,
            horizontalScrollbarSize: 14,
          },
        }}
      />
    </div>
  )
}

