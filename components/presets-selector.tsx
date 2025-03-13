"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Save } from "lucide-react"
import { type ConversionPreset, PresetsManager, DEFAULT_PRESETS } from "@/lib/presets-manager"

type PresetsSelectorProps = {
  onPresetSelect: (preset: ConversionPreset) => void
  currentSettings: {
    preserveIds: boolean
    strictMode: boolean
    mappingAccuracy: number
    autoConvert: boolean
  }
}

export function PresetsSelector({ onPresetSelect, currentSettings }: PresetsSelectorProps) {
  const [presets, setPresets] = useState<ConversionPreset[]>(DEFAULT_PRESETS)
  const [selectedPresetId, setSelectedPresetId] = useState<string>("balanced")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newPreset, setNewPreset] = useState<Partial<ConversionPreset>>({
    name: "",
    description: "",
    settings: { ...currentSettings },
  })

  // Load presets on mount
  useEffect(() => {
    setPresets(PresetsManager.getPresets())
  }, [])

  // Handle preset selection
  const handlePresetChange = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      setSelectedPresetId(presetId)
      onPresetSelect(preset)
    }
  }

  // Open save dialog with current settings
  const handleOpenSaveDialog = () => {
    setNewPreset({
      name: "",
      description: "",
      settings: { ...currentSettings },
    })
    setShowSaveDialog(true)
  }

  // Save new preset
  const handleSavePreset = () => {
    if (!newPreset.name) return

    const preset: ConversionPreset = {
      id: `custom-${Date.now()}`,
      name: newPreset.name,
      description: newPreset.description || "",
      settings: newPreset.settings as ConversionPreset["settings"],
    }

    PresetsManager.savePreset(preset)
    setPresets(PresetsManager.getPresets())
    setSelectedPresetId(preset.id)
    onPresetSelect(preset)
    setShowSaveDialog(false)
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Conversion Presets</CardTitle>
          <CardDescription>Select a preset or save your current settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Select value={selectedPresetId} onValueChange={handlePresetChange}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a preset" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleOpenSaveDialog}
              title="Save current settings as preset"
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>

          {selectedPresetId && (
            <div className="mt-3 text-sm text-muted-foreground">
              {presets.find((p) => p.id === selectedPresetId)?.description}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Preset</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={newPreset.name || ""}
                onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                placeholder="My Custom Preset"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preset-description">Description</Label>
              <Textarea
                id="preset-description"
                value={newPreset.description || ""}
                onChange={(e) => setNewPreset({ ...newPreset, description: e.target.value })}
                placeholder="Describe your preset settings"
                rows={3}
              />
            </div>

            <div className="space-y-4 pt-2">
              <h4 className="text-sm font-medium">Settings Preview</h4>

              <div className="flex items-center justify-between">
                <Label htmlFor="preserve-ids">Preserve IDs</Label>
                <Switch
                  id="preserve-ids"
                  checked={newPreset.settings?.preserveIds || false}
                  onCheckedChange={(checked) =>
                    setNewPreset({
                      ...newPreset,
                      settings: { ...(newPreset.settings || {}), preserveIds: checked },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="strict-mode">Strict Mode</Label>
                <Switch
                  id="strict-mode"
                  checked={newPreset.settings?.strictMode || false}
                  onCheckedChange={(checked) =>
                    setNewPreset({
                      ...newPreset,
                      settings: { ...(newPreset.settings || {}), strictMode: checked },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="mapping-accuracy">Mapping Accuracy</Label>
                  <span className="text-sm text-muted-foreground">{newPreset.settings?.mappingAccuracy || 75}%</span>
                </div>
                <Slider
                  id="mapping-accuracy"
                  min={50}
                  max={100}
                  step={5}
                  value={[newPreset.settings?.mappingAccuracy || 75]}
                  onValueChange={(value) =>
                    setNewPreset({
                      ...newPreset,
                      settings: { ...(newPreset.settings || {}), mappingAccuracy: value[0] },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-convert">Auto Convert</Label>
                <Switch
                  id="auto-convert"
                  checked={newPreset.settings?.autoConvert || false}
                  onCheckedChange={(checked) =>
                    setNewPreset({
                      ...newPreset,
                      settings: { ...(newPreset.settings || {}), autoConvert: checked },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={!newPreset.name}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

