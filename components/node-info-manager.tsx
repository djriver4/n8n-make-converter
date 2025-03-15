"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, DownloadCloud, ExternalLink, Info, Upload, Check } from "lucide-react"
import { NodeInfoStore } from "@/lib/node-info-fetchers/node-info-store"
import { NodeInfo } from "@/lib/types/node-info"
import { getEnhancedNodeTypes, areMappingsEnhanced } from "@/lib/node-info-fetchers/update-node-mappings"

export function NodeInfoManager() {
  const [nodes, setNodes] = useState<Record<string, NodeInfo>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [enhancedNodes, setEnhancedNodes] = useState<string[]>([])
  const [isUsedForConversion, setIsUsedForConversion] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Initialize from the store
    const storedNodes = NodeInfoStore.getAllNodes()
    setNodes(storedNodes)
    setIsLoading(NodeInfoStore.isLoading())
    setError(NodeInfoStore.getError()?.message || null)
    
    const lastFetchTime = NodeInfoStore.getLastFetched()
    if (lastFetchTime) {
      setLastFetched(new Date(lastFetchTime).toLocaleString())
    }
    
    // Check which nodes are enhanced
    setEnhancedNodes(getEnhancedNodeTypes())
    setIsUsedForConversion(areMappingsEnhanced())
    
    // Set up interval to regularly check for enhanced nodes
    const intervalId = setInterval(() => {
      setEnhancedNodes(getEnhancedNodeTypes())
      setIsUsedForConversion(areMappingsEnhanced())
    }, 5000)
    
    // Auto-load local nodes if none are loaded
    if (Object.keys(storedNodes).length === 0) {
      // Use setTimeout to allow the component to render first
      setTimeout(async () => {
        try {
          await loadLocalNodes();
          // If still no nodes loaded, try fetching from GitHub
          if (Object.keys(nodes).length === 0) {
            console.log("No nodes loaded from local file, fetching from GitHub...");
            fetchNodes();
          }
        } catch (err) {
          console.error("Failed to load local nodes, falling back to GitHub:", err);
          fetchNodes();
        }
      }, 500)
    }
    
    return () => clearInterval(intervalId)
  }, [])

  const fetchNodes = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const fetchedNodes = await NodeInfoStore.fetchNodes(true)
      setNodes(fetchedNodes)
      setLastFetched(new Date().toLocaleString())
      
      // Update enhanced nodes
      setEnhancedNodes(getEnhancedNodeTypes())
      setIsUsedForConversion(areMappingsEnhanced())
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const importNodesFromFile = async (file: File) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Create a FileReader to read the file
      const reader = new FileReader()
      
      reader.onload = async (event) => {
        try {
          if (event.target?.result) {
            // Create a blob from the file data
            const blob = new Blob([event.target.result as ArrayBuffer], { type: 'application/json' })
            
            // Create a temporary URL for the blob
            const url = URL.createObjectURL(blob)
            
            // Load the nodes from the file
            const loadedNodes = await NodeInfoStore.loadNodesFromFile(url)
            
            // Update the state
            setNodes(loadedNodes)
            setLastFetched(new Date().toLocaleString())
            
            // Update enhanced nodes
            setEnhancedNodes(getEnhancedNodeTypes())
            setIsUsedForConversion(areMappingsEnhanced())
            
            // Clean up the temporary URL
            URL.revokeObjectURL(url)
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err))
        } finally {
          setIsLoading(false)
        }
      }
      
      reader.onerror = () => {
        setError("Error reading file")
        setIsLoading(false)
      }
      
      // Read the file as an array buffer
      reader.readAsArrayBuffer(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setIsLoading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        importNodesFromFile(file)
      } else {
        setError("Please select a JSON file")
      }
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const exportNodes = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nodes, null, 2))
      const downloadAnchorNode = document.createElement('a')
      downloadAnchorNode.setAttribute("href", dataStr)
      downloadAnchorNode.setAttribute("download", "n8n-node-info.json")
      document.body.appendChild(downloadAnchorNode)
      downloadAnchorNode.click()
      downloadAnchorNode.remove()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const loadLocalNodes = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Use the path relative to the public directory
      const localPath = '/nodes-n8n.json'
      console.log("Loading local nodes from:", localPath)
      const loadedNodes = await NodeInfoStore.loadNodesFromFile(localPath)
      
      if (Object.keys(loadedNodes).length === 0) {
        throw new Error("No nodes found in the local file. The file may be missing or empty.")
      }
      
      setNodes(loadedNodes)
      setLastFetched(new Date().toLocaleString())
      
      // Update enhanced nodes
      setEnhancedNodes(getEnhancedNodeTypes())
      setIsUsedForConversion(areMappingsEnhanced())
    } catch (err) {
      console.error("Error loading local nodes:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  // Check if a node is enhanced and used in conversion
  const isNodeEnhanced = (nodeType: string) => {
    return enhancedNodes.includes(nodeType);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>n8n Node Information</span>
          <div className="flex items-center gap-2">
            <Badge variant={Object.keys(nodes).length > 0 ? "secondary" : "outline"}>
              {Object.keys(nodes).length} Nodes
            </Badge>
            {isUsedForConversion && (
              <Badge variant="secondary" className="bg-green-600 text-white">
                <Check className="h-3 w-3 mr-1" /> Active
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Manage n8n node information fetched from GitHub to enhance the conversion process
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="nodes">Node List</TabsTrigger>
            <TabsTrigger value="details">Node Details</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-0 pt-4">
          {error && (
            <Alert variant="destructive" className="mx-6 mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <TabsContent value="overview" className="px-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Node Information Status</h3>
                  <div className="text-sm space-y-1">
                    <p><strong>Nodes Loaded:</strong> {Object.keys(nodes).length}</p>
                    <p><strong>Enhanced Nodes:</strong> {enhancedNodes.length}</p>
                    <p><strong>Last Fetched:</strong> {lastFetched || 'Never'}</p>
                    <p><strong>Status:</strong> {isLoading ? 'Fetching...' : (isUsedForConversion ? 'Active in Conversion' : (Object.keys(nodes).length > 0 ? 'Ready' : 'Not Loaded'))}</p>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">About Node Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Node information is fetched from the n8n GitHub repository or loaded from a local JSON file. This data enhances the conversion process
                    by providing more accurate mappings between n8n nodes and Make.com modules.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <Button 
                  onClick={fetchNodes} 
                  disabled={isLoading}
                  variant="default" 
                  className="gap-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
                  {isLoading ? "Fetching..." : "Fetch Nodes from GitHub"}
                </Button>
                
                <Button
                  onClick={loadLocalNodes}
                  disabled={isLoading}
                  variant="secondary"
                  className="gap-2"
                >
                  <Info className="h-4 w-4" />
                  Load Local Nodes JSON
                </Button>
                
                <Button
                  onClick={triggerFileInput}
                  disabled={isLoading}
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import Node JSON
                </Button>
                
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".json,application/json" 
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                
                <Button
                  onClick={exportNodes}
                  disabled={isLoading || Object.keys(nodes).length === 0}
                  variant="outline"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Export Node Data
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="nodes" className="px-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Node Type</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Properties</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(nodes).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No node information available. Click "Fetch Nodes from GitHub" to load node data.
                      </TableCell>
                    </TableRow>
                  ) : (
                    Object.entries(nodes).map(([nodeType, nodeInfo]) => (
                      <TableRow key={nodeType}>
                        <TableCell className="font-mono text-xs">{nodeType}</TableCell>
                        <TableCell>{nodeInfo.displayName}</TableCell>
                        <TableCell className="max-w-md truncate">{nodeInfo.description}</TableCell>
                        <TableCell>{nodeInfo.properties ? Object.keys(nodeInfo.properties).length : 0}</TableCell>
                        <TableCell>
                          {isNodeEnhanced(nodeType) ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              <Check className="h-3 w-3 mr-1" /> Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-500">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="px-6">
            <div className="space-y-4">
              <div className="flex justify-center items-center py-8">
                <div className="text-center space-y-2">
                  <Info className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="font-medium">Select a Node</h3>
                  <p className="text-sm text-muted-foreground">
                    Please select a node from the "Node List" tab to view detailed information.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Data sourced from the <a href="https://github.com/n8n-io/n8n" target="_blank" rel="noreferrer" className="underline">n8n GitHub repository</a>
        </p>
        {lastFetched && (
          <p className="text-xs text-muted-foreground">Last updated: {lastFetched}</p>
        )}
      </CardFooter>
    </Card>
  )
} 