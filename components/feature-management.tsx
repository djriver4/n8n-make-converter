"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { FeatureFlags, type FeatureFlags as FeatureFlagsType } from "@/lib/feature-management/feature-flags"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"

export function FeatureManagement() {
  const [flags, setFlags] = useState<FeatureFlagsType>(FeatureFlags.getFlags())
  const [resetAlert, setResetAlert] = useState(false)

  // Update local state when flags change
  const updateFlags = () => {
    setFlags(FeatureFlags.getFlags())
  }

  // Handle toggle for a specific flag
  const toggleFlag = <K extends keyof FeatureFlagsType>(flagName: K) => {
    FeatureFlags.setFlag(flagName, !FeatureFlags.getFlag(flagName))
    updateFlags()
  }

  // Reset all flags to defaults
  const resetAllFlags = () => {
    FeatureFlags.resetFlags()
    updateFlags()
    setResetAlert(true)
    setTimeout(() => setResetAlert(false), 3000)
  }

  // Group flags by category
  const uiFlags = {
    showNodeInfoManager: flags.showNodeInfoManager,
    showCustomMappingsManager: flags.showCustomMappingsManager,
    showPreferences: flags.showPreferences,
  }

  const functionalityFlags = {
    enableGitHubFetching: flags.enableGitHubFetching, 
    enableLocalStorage: flags.enableLocalStorage,
  }

  const experimentalFlags = {
    experimentalFeatures: flags.experimentalFeatures,
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Management</CardTitle>
          <CardDescription>
            Enable or disable features in the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetAlert && (
            <Alert className="mb-4">
              <AlertDescription>All features have been reset to their default settings.</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="ui-components">
            <TabsList className="mb-4">
              <TabsTrigger value="ui-components">UI Components</TabsTrigger>
              <TabsTrigger value="functionality">Functionality</TabsTrigger>
              <TabsTrigger value="experimental">Experimental</TabsTrigger>
            </TabsList>

            <TabsContent value="ui-components" className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">UI Components</h3>
                <div className="space-y-4">
                  {Object.entries(uiFlags).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="flex flex-col space-y-1">
                        <span>{formatFlagName(key)}</span>
                        <span className="font-normal text-xs text-muted-foreground">{getFlagDescription(key)}</span>
                      </Label>
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={() => toggleFlag(key as keyof FeatureFlagsType)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="functionality" className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">Functionality</h3>
                <div className="space-y-4">
                  {Object.entries(functionalityFlags).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="flex flex-col space-y-1">
                        <span>{formatFlagName(key)}</span>
                        <span className="font-normal text-xs text-muted-foreground">{getFlagDescription(key)}</span>
                      </Label>
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={() => toggleFlag(key as keyof FeatureFlagsType)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="experimental" className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">Experimental Features</h3>
                <div className="space-y-4">
                  {Object.entries(experimentalFlags).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="flex flex-col space-y-1">
                        <span>{formatFlagName(key)}</span>
                        <span className="font-normal text-xs text-muted-foreground">{getFlagDescription(key)}</span>
                      </Label>
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={() => toggleFlag(key as keyof FeatureFlagsType)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={resetAllFlags} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Helper to format flag names for display
function formatFlagName(key: string): string {
  // Convert camelCase to words with spaces and capitalize
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
}

// Get description for each flag
function getFlagDescription(key: string): string {
  const descriptions: Record<string, string> = {
    showNodeInfoManager: "Show the Node Information panel in Settings",
    showCustomMappingsManager: "Show the Custom Mappings panel in Settings",
    showPreferences: "Show the Preferences panel in Settings",
    enableGitHubFetching: "Enable fetching node information from GitHub",
    enableLocalStorage: "Enable storing data in browser localStorage",
    experimentalFeatures: "Enable experimental features",
  }
  
  return descriptions[key] || "No description available"
} 