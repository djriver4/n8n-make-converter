"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, RefreshCw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { PresetsSelector } from "./presets-selector"
import { useWorkflowStore } from "@/lib/store/store"
import type { ConversionPreset } from "@/lib/presets-manager"

export function ConversionPanel() {
  // Get settings from store
  const { settings, updateSettings } = useWorkflowStore()

  // Local state for UI
  const [activeTab, setActiveTab] = useState("general")

  // Reset settings to defaults
  const resetToDefaults = () => {
    updateSettings({
      autoConvert: true,
      preserveIds: true,
      strictMode: false,
      mappingAccuracy: 75,
    })
  }

  // Handle preset selection
  const handlePresetSelect = (preset: ConversionPreset) => {
    updateSettings(preset.settings)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Conversion Settings</h2>
      </div>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-convert">Auto Convert</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">Automatically convert on file upload</p>
            </div>
            <Switch
              id="auto-convert"
              checked={settings.autoConvert}
              onCheckedChange={(checked) => updateSettings({ autoConvert: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="preserve-ids">Preserve IDs</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">Keep original node/module IDs when possible</p>
            </div>
            <Switch
              id="preserve-ids"
              checked={settings.preserveIds}
              onCheckedChange={(checked) => updateSettings({ preserveIds: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="strict-mode">Strict Mode</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fail conversion if exact mapping not found</p>
            </div>
            <Switch
              id="strict-mode"
              checked={settings.strictMode}
              onCheckedChange={(checked) => updateSettings({ strictMode: checked })}
            />
          </div>
        </TabsContent>
        <TabsContent value="advanced" className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="mapping-accuracy">Mapping Accuracy</Label>
              <span className="text-sm text-slate-500 dark:text-slate-400">{settings.mappingAccuracy}%</span>
            </div>
            <Slider
              id="mapping-accuracy"
              min={50}
              max={100}
              step={5}
              value={[settings.mappingAccuracy]}
              onValueChange={(value) => updateSettings({ mappingAccuracy: value[0] })}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Higher values require more exact matches between nodes
            </p>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={resetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </TabsContent>
        <TabsContent value="presets" className="space-y-4">
          <PresetsSelector onPresetSelect={handlePresetSelect} currentSettings={settings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

