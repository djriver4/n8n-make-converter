import { useWorkflowStore } from "@/lib/store/store"

export function ConversionLogs() {
  const logs = useWorkflowStore((state) => state.conversionLogs)

  // Panel removed as requested
  return null
}

