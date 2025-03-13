"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2, Download, Upload, Edit } from "lucide-react"
import UserMappingStore, { type UserMapping } from "@/lib/user-mappings/user-mapping-store"
import { baseNodeMapping } from "@/lib/mappings/node-mapping"

export function MappingManager() {
  const [mappings, setMappings] = useState<UserMapping[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("n8nToMake")
  const [importJson, setImportJson] = useState("")
  const [importError, setImportError] = useState("")
  const [currentMapping, setCurrentMapping] = useState<Partial<UserMapping>>({
    name: "",
    description: "",
    sourceType: "",
    targetType: "",
    direction: "n8nToMake",
    parameterMap: {},
  })
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null)
  const [parameterPairs, setParameterPairs] = useState<Array<{ source: string; target: string }>>([
    { source: "", target: "" },
  ])

  // Load mappings on mount
  useEffect(() => {
    setMappings(UserMappingStore.getMappings())
  }, [])

  // Filter mappings by direction
  const filteredMappings = mappings.filter((m) => m.direction === activeTab)

  // Handle adding a new mapping
  const handleAddMapping = () => {
    // Convert parameter pairs to parameter map
    const parameterMap: Record<string, string> = {}
    parameterPairs.forEach((pair) => {
      if (pair.source && pair.target) {
        parameterMap[pair.source] = pair.target
      }
    })

    // Create the new mapping
    const newMapping = UserMappingStore.saveMapping({
      name: currentMapping.name || "Unnamed Mapping",
      description: currentMapping.description,
      sourceType: currentMapping.sourceType || "",
      targetType: currentMapping.targetType || "",
      direction: currentMapping.direction as "n8nToMake" | "makeToN8n",
      parameterMap,
    })

    // Update state
    setMappings(UserMappingStore.getMappings())
    setShowAddDialog(false)
    resetForm()
  }

  // Handle editing a mapping
  const handleEditMapping = () => {
    if (!editingMappingId) return

    // Convert parameter pairs to parameter map
    const parameterMap: Record<string, string> = {}
    parameterPairs.forEach((pair) => {
      if (pair.source && pair.target) {
        parameterMap[pair.source] = pair.target
      }
    })

    // Update the mapping
    UserMappingStore.updateMapping(editingMappingId, {
      name: currentMapping.name,
      description: currentMapping.description,
      sourceType: currentMapping.sourceType,
      targetType: currentMapping.targetType,
      parameterMap,
    })

    // Update state
    setMappings(UserMappingStore.getMappings())
    setShowEditDialog(false)
    setEditingMappingId(null)
    resetForm()
  }

  // Handle deleting a mapping
  const handleDeleteMapping = (id: string) => {
    if (confirm("Are you sure you want to delete this mapping?")) {
      UserMappingStore.deleteMapping(id)
      setMappings(UserMappingStore.getMappings())
    }
  }

  // Handle importing mappings
  const handleImportMappings = () => {
    setImportError("")

    if (!importJson.trim()) {
      setImportError("Please enter valid JSON")
      return
    }

    const success = UserMappingStore.importMappings(importJson)

    if (success) {
      setMappings(UserMappingStore.getMappings())
      setShowImportDialog(false)
      setImportJson("")
    } else {
      setImportError("Failed to import mappings. Please check the JSON format.")
    }
  }

  // Handle exporting mappings
  const handleExportMappings = () => {
    const json = UserMappingStore.exportMappings()

    // Create a download link
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "user-mappings.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Reset the form
  const resetForm = () => {
    setCurrentMapping({
      name: "",
      description: "",
      sourceType: "",
      targetType: "",
      direction: "n8nToMake",
      parameterMap: {},
    })
    setParameterPairs([{ source: "", target: "" }])
  }

  // Open the edit dialog for a mapping
  const openEditDialog = (mapping: UserMapping) => {
    setCurrentMapping({
      name: mapping.name,
      description: mapping.description,
      sourceType: mapping.sourceType,
      targetType: mapping.targetType,
      direction: mapping.direction,
      parameterMap: mapping.parameterMap,
    })

    // Convert parameter map to pairs
    const pairs = Object.entries(mapping.parameterMap).map(([source, target]) => ({
      source,
      target,
    }))

    // Ensure at least one empty pair for adding new parameters
    if (pairs.length === 0) {
      pairs.push({ source: "", target: "" })
    }

    setParameterPairs(pairs)
    setEditingMappingId(mapping.id)
    setShowEditDialog(true)
  }

  // Add a new parameter pair
  const addParameterPair = () => {
    setParameterPairs([...parameterPairs, { source: "", target: "" }])
  }

  // Update a parameter pair
  const updateParameterPair = (index: number, field: "source" | "target", value: string) => {
    const newPairs = [...parameterPairs]
    newPairs[index][field] = value
    setParameterPairs(newPairs)
  }

  // Remove a parameter pair
  const removeParameterPair = (index: number) => {
    if (parameterPairs.length <= 1) return
    const newPairs = [...parameterPairs]
    newPairs.splice(index, 1)
    setParameterPairs(newPairs)
  }

  // Get base mappings for reference
  const getBaseMappings = () => {
    return activeTab === "n8nToMake" ? baseNodeMapping.n8nToMake : baseNodeMapping.makeToN8n
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Node Mapping Manager</CardTitle>
        <CardDescription>Create and manage custom mappings between n8n nodes and Make.com modules</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="border-b px-4">
            <TabsList className="h-10">
              <TabsTrigger value="n8nToMake">n8n → Make.com</TabsTrigger>
              <TabsTrigger value="makeToN8n">Make.com → n8n</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4 flex justify-between items-center">
            <div>
              <span className="text-sm text-muted-foreground">
                {filteredMappings.length} custom {filteredMappings.length === 1 ? "mapping" : "mappings"} defined
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportMappings} disabled={mappings.length === 0}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Mapping
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[calc(100%-8rem)] px-4 pb-4">
            {filteredMappings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Source Type</TableHead>
                    <TableHead>Target Type</TableHead>
                    <TableHead>Parameters</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMappings.map((mapping) => (
                    <TableRow key={mapping.id}>
                      <TableCell>
                        <div className="font-medium">{mapping.name}</div>
                        {mapping.description && (
                          <div className="text-xs text-muted-foreground">{mapping.description}</div>
                        )}
                      </TableCell>
                      <TableCell>{mapping.sourceType}</TableCell>
                      <TableCell>{mapping.targetType}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(mapping.parameterMap).map((key) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key} → {mapping.parameterMap[key]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(mapping)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMapping(mapping.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No custom mappings defined for this direction.
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Your First Mapping
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </Tabs>
      </CardContent>

      {/* Add Mapping Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Custom Mapping</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mapping-name">Mapping Name</Label>
                <Input
                  id="mapping-name"
                  value={currentMapping.name}
                  onChange={(e) => setCurrentMapping({ ...currentMapping, name: e.target.value })}
                  placeholder="e.g., Custom Gmail Mapping"
                />
              </div>
              <div>
                <Label htmlFor="mapping-direction">Direction</Label>
                <Select
                  value={currentMapping.direction}
                  onValueChange={(value) =>
                    setCurrentMapping({ ...currentMapping, direction: value as "n8nToMake" | "makeToN8n" })
                  }
                >
                  <SelectTrigger id="mapping-direction">
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="n8nToMake">n8n → Make.com</SelectItem>
                    <SelectItem value="makeToN8n">Make.com → n8n</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="mapping-description">Description (Optional)</Label>
              <Textarea
                id="mapping-description"
                value={currentMapping.description || ""}
                onChange={(e) => setCurrentMapping({ ...currentMapping, description: e.target.value })}
                placeholder="Describe what this mapping does"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="source-type">
                  {currentMapping.direction === "n8nToMake" ? "n8n Node Type" : "Make.com Module Type"}
                </Label>
                <Input
                  id="source-type"
                  value={currentMapping.sourceType}
                  onChange={(e) => setCurrentMapping({ ...currentMapping, sourceType: e.target.value })}
                  placeholder={
                    currentMapping.direction === "n8nToMake"
                      ? "e.g., n8n-nodes-base.gmail"
                      : "e.g., gmail:ActionSendEmail"
                  }
                />
              </div>
              <div>
                <Label htmlFor="target-type">
                  {currentMapping.direction === "n8nToMake" ? "Make.com Module Type" : "n8n Node Type"}
                </Label>
                <Input
                  id="target-type"
                  value={currentMapping.targetType}
                  onChange={(e) => setCurrentMapping({ ...currentMapping, targetType: e.target.value })}
                  placeholder={
                    currentMapping.direction === "n8nToMake"
                      ? "e.g., gmail:ActionSendEmail"
                      : "e.g., n8n-nodes-base.gmail"
                  }
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Parameter Mapping</Label>
                <Button variant="outline" size="sm" onClick={addParameterPair}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Parameter
                </Button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {parameterPairs.map((pair, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={pair.source}
                      onChange={(e) => updateParameterPair(index, "source", e.target.value)}
                      placeholder={currentMapping.direction === "n8nToMake" ? "n8n parameter" : "Make.com parameter"}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground">→</span>
                    <Input
                      value={pair.target}
                      onChange={(e) => updateParameterPair(index, "target", e.target.value)}
                      placeholder={currentMapping.direction === "n8nToMake" ? "Make.com parameter" : "n8n parameter"}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParameterPair(index)}
                      disabled={parameterPairs.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMapping}
              disabled={!currentMapping.name || !currentMapping.sourceType || !currentMapping.targetType}
            >
              Add Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Mapping Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Mapping</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-mapping-name">Mapping Name</Label>
                <Input
                  id="edit-mapping-name"
                  value={currentMapping.name}
                  onChange={(e) => setCurrentMapping({ ...currentMapping, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-mapping-direction">Direction</Label>
                <Input
                  id="edit-mapping-direction"
                  value={currentMapping.direction === "n8nToMake" ? "n8n → Make.com" : "Make.com → n8n"}
                  disabled
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-mapping-description">Description (Optional)</Label>
              <Textarea
                id="edit-mapping-description"
                value={currentMapping.description || ""}
                onChange={(e) => setCurrentMapping({ ...currentMapping, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-source-type">
                  {currentMapping.direction === "n8nToMake" ? "n8n Node Type" : "Make.com Module Type"}
                </Label>
                <Input
                  id="edit-source-type"
                  value={currentMapping.sourceType}
                  onChange={(e) => setCurrentMapping({ ...currentMapping, sourceType: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-target-type">
                  {currentMapping.direction === "n8nToMake" ? "Make.com Module Type" : "n8n Node Type"}
                </Label>
                <Input
                  id="edit-target-type"
                  value={currentMapping.targetType}
                  onChange={(e) => setCurrentMapping({ ...currentMapping, targetType: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Parameter Mapping</Label>
                <Button variant="outline" size="sm" onClick={addParameterPair}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Parameter
                </Button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {parameterPairs.map((pair, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={pair.source}
                      onChange={(e) => updateParameterPair(index, "source", e.target.value)}
                      placeholder={currentMapping.direction === "n8nToMake" ? "n8n parameter" : "Make.com parameter"}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground">→</span>
                    <Input
                      value={pair.target}
                      onChange={(e) => updateParameterPair(index, "target", e.target.value)}
                      placeholder={currentMapping.direction === "n8nToMake" ? "Make.com parameter" : "n8n parameter"}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParameterPair(index)}
                      disabled={parameterPairs.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditMapping}
              disabled={!currentMapping.name || !currentMapping.sourceType || !currentMapping.targetType}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Mappings Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Mappings</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="import-json">Paste JSON</Label>
              <Textarea
                id="import-json"
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste exported mappings JSON here"
                rows={10}
              />
              {importError && <p className="text-sm text-red-500 mt-1">{importError}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportMappings} disabled={!importJson.trim()}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

