"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download, Upload, Edit, Trash2, Save, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { UserMapping, NewMappingData, MappingDirection } from "@/lib/types/custom-mappings"

// Import UserMappingStore
const UserMappingStore = typeof window !== 'undefined' 
  ? require("@/lib/user-mappings/user-mapping-store").default 
  : null;

export function CustomMappingsManager() {
  const { toast } = useToast()
  const [mappings, setMappings] = useState<UserMapping[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingMapping, setEditingMapping] = useState<UserMapping | null>(null)
  const [newMapping, setNewMapping] = useState<NewMappingData>({
    name: "",
    description: "",
    sourceType: "",
    targetType: "",
    direction: "n8nToMake",
    parameterMap: {},
    transformationCode: ""
  })
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importData, setImportData] = useState("")
  const [importError, setImportError] = useState("")
  
  // Direction options for the select dropdown
  const directionOptions = [
    { value: "n8nToMake", label: "n8n → Make" },
    { value: "makeToN8n", label: "Make → n8n" }
  ]

  // Load mappings from store on component mount
  useEffect(() => {
    if (UserMappingStore) {
      loadMappings()
    }
  }, [])

  // Load mappings from UserMappingStore
  const loadMappings = () => {
    setIsLoading(true)
    try {
      const userMappings = UserMappingStore.getMappings()
      setMappings(userMappings)
    } catch (error) {
      console.error("Failed to load mappings:", error)
      toast({
        title: "Error loading mappings",
        description: error instanceof Error ? error.message : "Failed to load custom mappings",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter mappings based on search term
  const filteredMappings = mappings.filter(mapping => 
    mapping.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.sourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapping.targetType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle creating a new mapping
  const handleCreateMapping = () => {
    try {
      // Validate mapping
      if (!newMapping.name || !newMapping.sourceType || !newMapping.targetType) {
        throw new Error("Name, Source Type, and Target Type are required")
      }

      // Parse parameter map if it's a string
      let parameterMap = newMapping.parameterMap
      if (typeof parameterMap === 'string') {
        try {
          parameterMap = JSON.parse(parameterMap)
        } catch (e) {
          throw new Error("Parameter map must be valid JSON")
        }
      }

      // Create mapping with UserMappingStore
      const mappingToCreate = {
        ...newMapping,
        parameterMap,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      
      UserMappingStore.createMapping(mappingToCreate)
      
      // Refresh mappings
      loadMappings()
      
      // Reset form
      setNewMapping({
        name: "",
        description: "",
        sourceType: "",
        targetType: "",
        direction: "n8nToMake",
        parameterMap: {},
        transformationCode: ""
      })
      
      // Show success toast
      toast({
        title: "Mapping created",
        description: `Mapping "${mappingToCreate.name}" has been created successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error creating mapping",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    }
  }

  // Handle updating an existing mapping
  const handleUpdateMapping = () => {
    try {
      if (!editingMapping || !editingMapping.id) {
        throw new Error("No mapping selected for update")
      }
      
      // Parse parameter map if it's a string
      let parameterMap = editingMapping.parameterMap
      if (typeof parameterMap === 'string') {
        try {
          parameterMap = JSON.parse(parameterMap)
        } catch (e) {
          throw new Error("Parameter map must be valid JSON")
        }
      }
      
      // Update mapping
      const mappingToUpdate = {
        ...editingMapping,
        parameterMap,
        updatedAt: Date.now()
      }
      
      UserMappingStore.updateMapping(editingMapping.id, mappingToUpdate)
      
      // Refresh mappings
      loadMappings()
      
      // Clear editing state
      setEditingMapping(null)
      
      // Show success toast
      toast({
        title: "Mapping updated",
        description: `Mapping "${mappingToUpdate.name}" has been updated successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error updating mapping",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    }
  }

  // Handle deleting a mapping
  const handleDeleteMapping = (id: string) => {
    try {
      // Get mapping for toast message
      const mapping = mappings.find(m => m.id === id)
      if (!mapping) {
        throw new Error("Mapping not found")
      }
      
      // Delete mapping
      UserMappingStore.deleteMapping(id)
      
      // Refresh mappings
      loadMappings()
      
      // Show success toast
      toast({
        title: "Mapping deleted",
        description: `Mapping "${mapping.name}" has been deleted.`,
      })
    } catch (error) {
      toast({
        title: "Error deleting mapping",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    }
  }

  // Handle exporting mappings
  const handleExportMappings = () => {
    try {
      const exportData = UserMappingStore.exportMappings()
      
      // Create a Blob with the data
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      
      // Create a download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `custom-mappings-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)
      
      toast({
        title: "Mappings exported",
        description: `${exportData.length} mappings have been exported.`,
      })
    } catch (error) {
      toast({
        title: "Error exporting mappings",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    }
  }

  // Handle importing mappings
  const handleImportMappings = () => {
    try {
      setImportError("")
      
      // Parse the import data
      let data
      try {
        data = JSON.parse(importData)
      } catch (e) {
        throw new Error("Invalid JSON format")
      }
      
      // Import the mappings
      const importedCount = UserMappingStore.importMappings(data)
      
      // Refresh mappings
      loadMappings()
      
      // Close dialog and reset form
      setImportDialogOpen(false)
      setImportData("")
      
      // Show success toast
      toast({
        title: "Mappings imported",
        description: `${importedCount} mappings have been imported successfully.`,
      })
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unknown error occurred")
    }
  }

  // Render parameter map for display
  const renderParameterMap = (parameterMap: Record<string, string> | string | undefined) => {
    if (!parameterMap) return "No parameters"
    
    if (typeof parameterMap === "string") {
      try {
        parameterMap = JSON.parse(parameterMap) as Record<string, string>
      } catch (e) {
        return parameterMap
      }
    }
    
    // Display as key-value pairs
    return Object.entries(parameterMap).map(([key, value]) => (
      <div key={key} className="text-xs">
        <span className="font-semibold">{key}:</span> {value?.toString()}
      </div>
    ))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Custom Node Mappings</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleExportMappings} disabled={mappings.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import Mappings</DialogTitle>
                    <DialogDescription>
                      Paste a JSON array of mappings to import them into your collection.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Paste JSON here..."
                      rows={10}
                    />
                    {importError && (
                      <Alert variant="destructive">
                        <AlertDescription>{importError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleImportMappings}>Import</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <CardDescription>
            Create and manage custom mappings between n8n nodes and Make.com modules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search mappings..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Mapping
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Mapping</DialogTitle>
                  <DialogDescription>
                    Define a custom mapping between an n8n node and a Make.com module
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input
                      id="name"
                      value={newMapping.name}
                      onChange={(e) => setNewMapping({...newMapping, name: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">Description</Label>
                    <Input
                      id="description"
                      value={newMapping.description || ""}
                      onChange={(e) => setNewMapping({...newMapping, description: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="direction" className="text-right">Direction</Label>
                    <Select
                      value={newMapping.direction}
                      onValueChange={(value: MappingDirection) => setNewMapping({...newMapping, direction: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a direction" />
                      </SelectTrigger>
                      <SelectContent>
                        {directionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="sourceType" className="text-right">Source Type</Label>
                    <Input
                      id="sourceType"
                      value={newMapping.sourceType}
                      onChange={(e) => setNewMapping({...newMapping, sourceType: e.target.value})}
                      placeholder={newMapping.direction === "n8nToMake" ? "n8n node type" : "Make module type"}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="targetType" className="text-right">Target Type</Label>
                    <Input
                      id="targetType"
                      value={newMapping.targetType}
                      onChange={(e) => setNewMapping({...newMapping, targetType: e.target.value})}
                      placeholder={newMapping.direction === "n8nToMake" ? "Make module type" : "n8n node type"}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="parameterMap" className="text-right pt-2">Parameter Map</Label>
                    <Textarea
                      id="parameterMap"
                      value={typeof newMapping.parameterMap === 'object' ? JSON.stringify(newMapping.parameterMap, null, 2) : newMapping.parameterMap}
                      onChange={(e) => setNewMapping({...newMapping, parameterMap: e.target.value})}
                      placeholder='{"sourceParam": "targetParam"}'
                      className="col-span-3 font-mono text-sm"
                      rows={5}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="transformationCode" className="text-right pt-2">Transformation Code</Label>
                    <Textarea
                      id="transformationCode"
                      value={newMapping.transformationCode || ""}
                      onChange={(e) => setNewMapping({...newMapping, transformationCode: e.target.value})}
                      placeholder="// Optional JavaScript transformation code"
                      className="col-span-3 font-mono text-sm"
                      rows={5}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreateMapping}>Create Mapping</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading mappings...</div>
          ) : mappings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No custom mappings found. Create your first mapping to get started.
            </div>
          ) : filteredMappings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No mappings found matching your search.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Source Type</TableHead>
                  <TableHead>Target Type</TableHead>
                  <TableHead>Parameter Map</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">
                      {mapping.name}
                      {mapping.description && (
                        <p className="text-xs text-muted-foreground mt-1">{mapping.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={mapping.direction === "n8nToMake" ? "default" : "secondary"}>
                        {mapping.direction === "n8nToMake" ? "n8n → Make" : "Make → n8n"}
                      </Badge>
                    </TableCell>
                    <TableCell>{mapping.sourceType}</TableCell>
                    <TableCell>{mapping.targetType}</TableCell>
                    <TableCell>
                      <div className="max-h-20 overflow-y-auto">
                        {renderParameterMap(mapping.parameterMap)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setEditingMapping({...mapping})}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>Edit Mapping</DialogTitle>
                              <DialogDescription>
                                Update the mapping between an n8n node and a Make.com module
                              </DialogDescription>
                            </DialogHeader>
                            {editingMapping && (
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-name" className="text-right">Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={editingMapping.name}
                                    onChange={(e) => setEditingMapping({...editingMapping, name: e.target.value})}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-description" className="text-right">Description</Label>
                                  <Input
                                    id="edit-description"
                                    value={editingMapping.description || ""}
                                    onChange={(e) => setEditingMapping({...editingMapping, description: e.target.value})}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-direction" className="text-right">Direction</Label>
                                  <Select
                                    value={editingMapping.direction}
                                    onValueChange={(value: MappingDirection) => setEditingMapping({...editingMapping, direction: value})}
                                  >
                                    <SelectTrigger className="col-span-3">
                                      <SelectValue placeholder="Select a direction" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {directionOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-sourceType" className="text-right">Source Type</Label>
                                  <Input
                                    id="edit-sourceType"
                                    value={editingMapping.sourceType}
                                    onChange={(e) => setEditingMapping({...editingMapping, sourceType: e.target.value})}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="edit-targetType" className="text-right">Target Type</Label>
                                  <Input
                                    id="edit-targetType"
                                    value={editingMapping.targetType}
                                    onChange={(e) => setEditingMapping({...editingMapping, targetType: e.target.value})}
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                  <Label htmlFor="edit-parameterMap" className="text-right pt-2">Parameter Map</Label>
                                  <Textarea
                                    id="edit-parameterMap"
                                    value={typeof editingMapping.parameterMap === 'object' ? JSON.stringify(editingMapping.parameterMap, null, 2) : editingMapping.parameterMap}
                                    onChange={(e) => setEditingMapping({...editingMapping, parameterMap: e.target.value})}
                                    className="col-span-3 font-mono text-sm"
                                    rows={5}
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                  <Label htmlFor="edit-transformationCode" className="text-right pt-2">Transformation Code</Label>
                                  <Textarea
                                    id="edit-transformationCode"
                                    value={editingMapping.transformationCode || ""}
                                    onChange={(e) => setEditingMapping({...editingMapping, transformationCode: e.target.value})}
                                    className="col-span-3 font-mono text-sm"
                                    rows={5}
                                  />
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button variant="ghost" onClick={() => setEditingMapping(null)}>Cancel</Button>
                              <Button type="submit" onClick={handleUpdateMapping}>Update Mapping</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete the mapping "${mapping.name}"?`)) {
                              handleDeleteMapping(mapping.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 