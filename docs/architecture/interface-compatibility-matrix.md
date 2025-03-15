# Interface Compatibility Matrix

This document provides a detailed mapping between legacy and modern interfaces in the n8n-make-converter project. It serves as a reference for understanding how data is transformed between different interface versions.

## Primary Interface Mapping

### `ConversionResult` ↔ `WorkflowConversionResult`

| Property | Legacy (`ConversionResult`) | Modern (`WorkflowConversionResult`) | Transformation (Legacy → Modern) | Transformation (Modern → Legacy) |
|----------|------------------------------|-------------------------------------|----------------------------------|----------------------------------|
| `convertedWorkflow` | `N8nWorkflow \| MakeWorkflow \| any` | `N8nWorkflow \| MakeWorkflow` | Type assertion: `as (N8nWorkflow \| MakeWorkflow)` | Direct assignment |
| Parameter reviews | `parametersNeedingReview: string[]` | `paramsNeedingReview: ParameterReview[]` | Parse strings with regex and create structured objects | Convert objects to strings with template: `${nodeId} - ${parameters.join(', ')}: ${reason}` |
| Unmapped nodes | `unmappedNodes?: string[]` | `unmappedNodes: string[]` | Handle optional with default: `result.unmappedNodes \|\| []` | Direct assignment |
| Debug information | `debug?: Record<string, any>` | `debug: WorkflowDebugInfo` | Extract properties with type checking | Direct assignment (potential type issues) |
| Validation flag | `isValidInput?: boolean` | Not present | N/A | Derive from logs: `!logs.some(log => log.type === 'error' && log.message.includes('Invalid'))` |
| Function flag | `workflowHasFunction?: boolean` | Not present | N/A | Derive from parameters: `parametersNeedingReview.length > 0` |

## Nested Interface Mapping

### String Arrays ↔ `ParameterReview[]`

| Legacy Format | Modern Structure | Transformation Notes |
|---------------|------------------|---------------------|
| `"HTTP Request - url: Complex expression"` | `{ nodeId: "HTTP Request", parameters: ["url"], reason: "Complex expression" }` | Uses regex: `/^([^-]+) - ([^:]+): (.+)$/` |
| `"Multiple params - param1, param2: Needs review"` | `{ nodeId: "Multiple params", parameters: ["param1", "param2"], reason: "Needs review" }` | Handles comma-separated parameter lists |
| Malformed strings | `{ nodeId: "unknown", parameters: ["unknown"], reason: original_string }` | Fallback for unparseable strings |

### Unstructured Debug ↔ `WorkflowDebugInfo`

| Legacy Property | Modern Property | Transformation Notes |
|-----------------|-----------------|---------------------|
| `debug.mappedModules?` | `debug.mappedModules[]` | Check if array before copying |
| `debug.unmappedModules?` | `debug.unmappedModules[]` | Check if array before copying |
| `debug.mappedNodes?` | `debug.mappedNodes[]` | Check if array before copying |
| `debug.unmappedNodes?` | `debug.unmappedNodes[]` | Check if array before copying |
| Other properties | Not mapped | Ignored in transformation |

### `ConversionLog` Structure (Common to Both)

| Property | Type | Description | Notes |
|----------|------|-------------|-------|
| `type` | `"info" \| "warning" \| "error"` | Log severity | Used to derive `isValidInput` |
| `message` | `string` | Log content | Used in message matching for validation |
| `timestamp` | `string` | ISO timestamp | Generated during conversion |

## External Module Interface Variants

### `lib/converters/make-to-n8n.ts`

```typescript
interface ConversionResult {
  convertedWorkflow: N8nWorkflow | Record<string, never>;
  logs: Array<{
    type: "info" | "warning" | "error";
    message: string;
  }>;
  parametersNeedingReview: string[];
}
```

Missing properties compared to main definition:
- `unmappedNodes`
- `workflowHasFunction`
- `isValidInput`
- `debug`

Adaptation needed: Add missing properties with default values

### `lib/converters/n8n-to-make.ts`

```typescript
interface ConversionResult {
  convertedWorkflow: MakeWorkflow | Record<string, never>;
  logs: Array<{
    type: "info" | "warning" | "error";
    message: string;
  }>;
  parametersNeedingReview: string[];
}
```

Differences:
- `convertedWorkflow` is typed as `MakeWorkflow | Record<string, never>` instead of generic
- Missing same properties as make-to-n8n variant

### `lib/store/store.ts`

```typescript
interface ConversionResult {
  convertedWorkflow: any;
  logs: ConversionLog[];
  parametersNeedingReview: string[];
  workflowHasFunction?: boolean;
  debugData?: any;                      // Different name than main definition
  parameterReviewData?: Record<string, any>; // Additional property
}
```

Unique properties:
- `debugData` instead of `debug`
- `parameterReviewData` (not in main definition)

### `lib/converter.ts` (Legacy)

```typescript
interface ConversionResult {
  convertedWorkflow: any;
  logs: ConversionLog[];
  parametersNeedingReview: string[];
  workflowHasFunction?: boolean;
}
```

Simplest variant - missing several properties from the main definition.

## Edge Cases and Special Handling

### Handling Malformed Input

| Malformed Input | Handling Strategy | Code Implementation |
|-----------------|-------------------|---------------------|
| Missing `parametersNeedingReview` | Use empty array | `if (result.parametersNeedingReview) { ... }` |
| Non-parseable parameter strings | Create default object | `{ nodeId: 'unknown', parameters: ['unknown'], reason: paramStr }` |
| Missing `debug` | Create empty structure | Initialize default `WorkflowDebugInfo` |
| Non-array debug properties | Skip property copying | `if (Array.isArray(result.debug.mappedModules)) { ... }` |

### Type Coercion Requirements

| Property | Direction | Type Coercion | Code Example |
|----------|-----------|---------------|-------------|
| `convertedWorkflow` | Legacy → Modern | Type assertion | `result.convertedWorkflow as (N8nWorkflow \| MakeWorkflow)` |
| `logs` | Any direction with string logs | Object creation | `logs.map(log => typeof log === 'string' ? { type: 'info', message: log, timestamp: new Date().toISOString() } : log)` |
| `unmappedNodes` | Legacy → Modern | Default value | `result.unmappedNodes \|\| []` |

## Conclusion

This compatibility matrix provides a comprehensive reference for understanding how data is transformed between legacy and modern interfaces. Use this document when modifying adapter functions or when working with interface transformations in general.

For implementation details of the adapter functions, refer to the [`interface-adapters.ts`](../lib/utils/interface-adapters.ts) file.

---

**Note**: This matrix should be updated whenever changes are made to either the legacy or modern interfaces, or when the transformation logic in the adapter functions is modified. 