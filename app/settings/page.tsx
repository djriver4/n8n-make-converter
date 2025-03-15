"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NodeInfoManager } from "@/components/node-info-manager"
import { CustomMappingsManager } from "@/components/custom-mappings-manager"
// Feature Management has been disabled
// import { FeatureManagement } from "@/components/feature-management"
import { FeatureFlags } from "@/lib/feature-management/feature-flags"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function SettingsPage() {
  const [flags, setFlags] = useState({
    showNodeInfoManager: true,
    showCustomMappingsManager: true,
    showPreferences: true
  })

  useEffect(() => {
    // Set the default flags - Feature Management UI has been disabled
    // but we'll continue to respect the feature flags
    const isNodeInfoDisabled = FeatureFlags.getFlag('showNodeInfoManager') === false;
    
    // Load feature flags
    setFlags({
      showNodeInfoManager: !isNodeInfoDisabled,
      showCustomMappingsManager: FeatureFlags.getFlag('showCustomMappingsManager'),
      showPreferences: FeatureFlags.getFlag('showPreferences')
    })

    // Listen for local storage changes (in case another tab changes flags)
    const handleStorageChange = () => {
      setFlags({
        showNodeInfoManager: FeatureFlags.getFlag('showNodeInfoManager'),
        showCustomMappingsManager: FeatureFlags.getFlag('showCustomMappingsManager'),
        showPreferences: FeatureFlags.getFlag('showPreferences')
      })
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Default tab selection - choose the first visible tab
  const getDefaultTab = () => {
    if (flags.showCustomMappingsManager) return "mappings";
    if (flags.showPreferences) return "preferences";
    if (flags.showNodeInfoManager) return "node-info";
    return "mappings"; // Fallback
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/" passHref>
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Configure and manage your workflow converter settings and data sources.
          </p>
        </header>

        <Tabs defaultValue={getDefaultTab()} className="w-full">
          <TabsList className="mb-6">
            {flags.showNodeInfoManager && (
              <TabsTrigger value="node-info">Node Information</TabsTrigger>
            )}
            {flags.showCustomMappingsManager && (
              <TabsTrigger value="mappings">Custom Mappings</TabsTrigger>
            )}
            {flags.showPreferences && (
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            )}
            {/* Feature Management UI has been disabled */}
          </TabsList>
          
          {flags.showNodeInfoManager && (
            <TabsContent value="node-info" className="space-y-6">
              <NodeInfoManager />
            </TabsContent>
          )}
          
          {flags.showCustomMappingsManager && (
            <TabsContent value="mappings" className="space-y-6">
              <CustomMappingsManager />
            </TabsContent>
          )}
          
          {flags.showPreferences && (
            <TabsContent value="preferences" className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Application Preferences</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Configure your preference settings for the workflow converter.
                  (Coming soon)
                </p>
              </div>
            </TabsContent>
          )}

          {/* Feature Management UI has been disabled */}
        </Tabs>
      </div>
    </main>
  )
} 