"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUploadStore } from "@/lib/store/upload-store"
import { UploadNotification } from "./upload-notification"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

export function FileManager() {
  const { files, dismissFile } = useUploadStore()
  const [isOpen, setIsOpen] = useState(false)

  const recentFiles = files.slice(0, 3) // Get the 3 most recent files

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full transition-all duration-300 ease-in-out">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Recent Uploads</CardTitle>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              {isOpen ? (
                <ChevronUp className="h-4 w-4 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              )}
              <span className="sr-only">Toggle Recent Uploads</span>
            </Button>
          </CollapsibleTrigger>
        </CardHeader>

        {/* Condensed view */}
        {!isOpen && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              {recentFiles.map((file) => (
                <div key={file.id} className="text-sm text-muted-foreground truncate">
                  {file.name}
                </div>
              ))}
              {files.length > 3 && <div className="text-sm text-muted-foreground">+{files.length - 3} more</div>}
            </div>
          </CardContent>
        )}

        {/* Expanded view */}
        <CollapsibleContent className="transition-all duration-300 ease-in-out">
          <CardContent className="pt-0">
            <ScrollArea className="h-[300px]">
              {files.length === 0 ? (
                <p className="text-center text-muted-foreground">No files uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {files.map((file) => (
                    <UploadNotification
                      key={file.id}
                      fileName={file.name}
                      status={file.status}
                      progress={file.progress}
                      error={file.error}
                      platform={file.platform}
                      onDismiss={() => dismissFile(file.id)}
                      showDismiss={true}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

