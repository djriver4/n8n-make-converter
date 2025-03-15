"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NodeInfoManager } from "@/components/node-info-manager"
import { CustomMappingsManager } from "@/components/custom-mappings-manager"

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Configure and manage your workflow converter settings and data sources.
          </p>
        </header>

        <Tabs defaultValue="node-info" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="node-info">Node Information</TabsTrigger>
            <TabsTrigger value="mappings">Custom Mappings</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          <TabsContent value="node-info" className="space-y-6">
            <NodeInfoManager />
          </TabsContent>
          
          <TabsContent value="mappings" className="space-y-6">
            <CustomMappingsManager />
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Application Preferences</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Configure your preference settings for the workflow converter.
                (Coming soon)
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
} 