"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Beaker, Code, RefreshCw } from "lucide-react"
import { FeatureFlags } from "@/lib/feature-management/feature-flags"
import { isDevelopmentMode } from "@/lib/utils/environment"

export function DevModeControls() {
  const [isDevelopment, setIsDevelopment] = useState(false)
  const [devFlags, setDevFlags] = useState({
    enableFullConversionInDevMode: false
  })
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")

  // Check if in development mode on mount
  useEffect(() => {
    const devMode = isDevelopmentMode()
    setIsDevelopment(devMode)
    
    if (devMode) {
      // Only load feature flags if in development mode
      setDevFlags({
        enableFullConversionInDevMode: FeatureFlags.getFlag('enableFullConversionInDevMode')
      })
    }
  }, [])

  // Handle toggle for a flag
  const toggleFlag = (flagName: keyof typeof devFlags) => {
    FeatureFlags.setFlag(flagName, !FeatureFlags.getFlag(flagName))
    setDevFlags({
      ...devFlags,
      [flagName]: FeatureFlags.getFlag(flagName)
    })
    
    // Show alert
    setAlertMessage(`${formatFlagName(flagName)} ${FeatureFlags.getFlag(flagName) ? 'enabled' : 'disabled'}`)
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 3000)
  }

  // If not in development mode, don't render anything
  if (!isDevelopment) {
    return null
  }

  return (
    <Card className="border-amber-300">
      <CardHeader className="bg-amber-50 dark:bg-amber-950/20">
        <div className="flex items-center gap-2">
          <Beaker className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-amber-700 dark:text-amber-400">Development Mode Controls</CardTitle>
        </div>
        <CardDescription>
          These controls are only visible in development mode
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {showAlert && (
          <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
            <AlertDescription>{alertMessage}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="conversion" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="conversion">Conversion Settings</TabsTrigger>
            <TabsTrigger value="debugging">Debugging</TabsTrigger>
          </TabsList>
          <TabsContent value="conversion" className="mt-4 space-y-4">
            <div className="flex flex-col gap-4">
              <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Enable Full Conversion</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Fully convert workflows even when no module mappings exist.
                      {devFlags.enableFullConversionInDevMode && (
                        <span className="font-bold"> (Active)</span>
                      )}
                    </p>
                  </div>
                  <Switch
                    id="enable-full-conversion"
                    checked={devFlags.enableFullConversionInDevMode}
                    onCheckedChange={() => toggleFlag("enableFullConversionInDevMode")}
                    className={devFlags.enableFullConversionInDevMode ? "bg-amber-600" : ""}
                  />
                </div>
                {devFlags.enableFullConversionInDevMode && (
                  <div className="mt-2 text-xs p-2 bg-amber-100 dark:bg-amber-900/40 rounded border border-amber-200 dark:border-amber-800">
                    <strong>Full Conversion Mode Active!</strong> Missing module mappings will be converted to placeholder nodes instead of failing.
                  </div>
                )}
              </div>
              
              {/* Additional dev settings can be added here */}
            </div>
          </TabsContent>
          
          <TabsContent value="debugging" className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-4">Debugging Tools</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Additional debugging tools will be added here in the future.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="bg-amber-50/50 dark:bg-amber-950/10">
        <div className="text-xs text-amber-600 dark:text-amber-400 italic">
          These settings will be reset when you refresh the page unless they're saved to localStorage
        </div>
      </CardFooter>
    </Card>
  )
}

// Helper to format flag names for display
function formatFlagName(key: string): string {
  // Convert camelCase to words with spaces and capitalize
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
} 