import type React from "react"
interface MetadataDisplayProps {
  conversionTime?: number
  nodeCount?: number
}

export const MetadataDisplay: React.FC<MetadataDisplayProps> = ({ conversionTime, nodeCount }) => {
  return (
    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
      {conversionTime && <span>Conversion Time: {conversionTime.toFixed(2)}ms</span>}
      {nodeCount && <span>Nodes Converted: {nodeCount}</span>}
    </div>
  )
}

