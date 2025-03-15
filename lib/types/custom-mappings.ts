/**
 * Custom mapping types for user-defined node mappings
 */

/**
 * Direction of the mapping between platforms
 */
export type MappingDirection = "n8nToMake" | "makeToN8n";

/**
 * User-defined mapping between node types
 */
export interface UserMapping {
  id: string;
  name: string;
  description?: string;
  sourceType: string;
  targetType: string;
  direction: MappingDirection;
  parameterMap: Record<string, string> | string;
  transformationCode?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Data for creating a new mapping
 */
export interface NewMappingData {
  name: string;
  description?: string;
  sourceType: string;
  targetType: string;
  direction: MappingDirection;
  parameterMap: Record<string, string> | string;
  transformationCode?: string;
} 