# Workflow Conversion Process

This document explains the workflow conversion process between n8n and Make.com platforms, with visual representations to illustrate the data flow and transformation steps.

## Overview

The workflow conversion process transforms automation workflows between n8n and Make.com formats while preserving functionality, connections, and parameter values.

## High-Level Conversion Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                   │     │                  │
│  Input Workflow  │────▶│  Node Mapping    │────▶│  Parameter        │────▶│  Connection      │
│  Validation      │     │  Transformation  │     │  Processing       │     │  Preservation    │
│                  │     │                  │     │                   │     │                  │
└──────────────────┘     └──────────────────┘     └───────────────────┘     └──────────────────┘
         │                                                                            │
         │                                                                            ▼
         │                                                              ┌──────────────────────┐
         │                                                              │                      │
         └──────────────────────────────────────────────────────────────▶  Result Generation   │
                                                                        │                      │
                                                                        └──────────────────────┘
```

## Detailed Conversion Steps

### 1. Input Workflow Validation

The process begins by validating the input workflow structure to ensure it's a valid n8n or Make.com workflow.

```
┌───────────────────────────────────────┐
│                                       │
│  Input Workflow                       │
│                                       │
│  ┌─────────────────┐                  │
│  │ Workflow Schema │                  │
│  │ Validation      │                  │
│  └─────────────────┘                  │
│           │                           │
│           ▼                           │
│  ┌─────────────────┐                  │
│  │ Node/Module     │                  │
│  │ Validation      │                  │
│  └─────────────────┘                  │
│           │                           │
│           ▼                           │
│  ┌─────────────────┐                  │
│  │ Connection      │                  │
│  │ Validation      │                  │
│  └─────────────────┘                  │
│                                       │
└───────────────────────────────────────┘
```

### 2. Node Mapping Transformation

Nodes (n8n) or modules (Make.com) are mapped between platforms using node mapping definitions.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Node Mapping Process                                   │
│                                                         │
│  ┌────────────────┐          ┌─────────────────────┐    │
│  │ Source Node    │          │ Node Mapping        │    │
│  │ or Module      │────────▶ │ Database            │    │
│  └────────────────┘          └─────────────────────┘    │
│                                       │                  │
│                                       ▼                  │
│                              ┌─────────────────────┐    │
│                              │ Mapping Lookup      │    │
│                              └─────────────────────┘    │
│                                       │                  │
│                                       ▼                  │
│  ┌────────────────┐          ┌─────────────────────┐    │
│  │ Target Node    │◀───────  │ Node Creation       │    │
│  │ or Module      │          │ & Transformation    │    │
│  └────────────────┘          └─────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3. Parameter Processing

Node parameters are transformed between platforms with proper expression handling.

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  Parameter Processing                                         │
│                                                               │
│  ┌─────────────────┐         ┌──────────────────────────┐    │
│  │ Source          │         │ Parameter Mapping        │    │
│  │ Parameters      │────────▶│ Definition               │    │
│  └─────────────────┘         └──────────────────────────┘    │
│                                        │                      │
│                                        ▼                      │
│                               ┌──────────────────────────┐    │
│                               │ Parameter                │    │
│                               │ Transformation           │    │
│                               └──────────────────────────┘    │
│                                        │                      │
│                                        ▼                      │
│  ┌─────────────────┐         ┌──────────────────────────┐    │
│  │ Transformed     │◀────────│ Expression               │    │
│  │ Parameters      │         │ Processing               │    │
│  └─────────────────┘         └──────────────────────────┘    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

#### Expression Transformation Process

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Expression Transformation                                  │
│                                                             │
│  ┌─────────────────┐        ┌─────────────────────────┐    │
│  │ Source          │        │ Expression              │    │
│  │ Expression      │───────▶│ Parser                  │    │
│  └─────────────────┘        └─────────────────────────┘    │
│                                       │                     │
│                                       ▼                     │
│                             ┌─────────────────────────┐    │
│                             │ AST Transformation      │    │
│                             └─────────────────────────┘    │
│                                       │                     │
│                                       ▼                     │
│  ┌─────────────────┐        ┌─────────────────────────┐    │
│  │ Target          │◀───────│ Expression              │    │
│  │ Expression      │        │ Generator               │    │
│  └─────────────────┘        └─────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. Connection Preservation

Connections between nodes are preserved in the transformed workflow.

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  Connection Preservation                                      │
│                                                               │
│  ┌─────────────────┐         ┌──────────────────────────┐    │
│  │ Source          │         │ Connection Mapping       │    │
│  │ Connections     │────────▶│ Logic                    │    │
│  └─────────────────┘         └──────────────────────────┘    │
│                                        │                      │
│                                        ▼                      │
│                               ┌──────────────────────────┐    │
│                               │ Source/Target ID         │    │
│                               │ Resolution               │    │
│                               └──────────────────────────┘    │
│                                        │                      │
│                                        ▼                      │
│  ┌─────────────────┐         ┌──────────────────────────┐    │
│  │ Target          │◀────────│ Connection Creation      │    │
│  │ Connections     │         │ in Target Format         │    │
│  └─────────────────┘         └──────────────────────────┘    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### 5. Result Generation

The conversion process finalizes by generating a complete result with warnings, logs, and the converted workflow.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Result Generation                                              │
│                                                                 │
│  ┌─────────────────┐          ┌──────────────────────────┐     │
│  │ Converted       │          │ Conversion Logs          │     │
│  │ Workflow        │          │ Generation               │     │
│  └─────────────────┘          └──────────────────────────┘     │
│         │                                │                      │
│         └────────────────┬───────────────┘                      │
│                          ▼                                      │
│                 ┌──────────────────────────┐                    │
│                 │ Parameters Needing       │                    │
│                 │ Review Identification    │                    │
│                 └──────────────────────────┘                    │
│                          │                                      │
│                          ▼                                      │
│                 ┌──────────────────────────┐                    │
│                 │ Unmapped Nodes           │                    │
│                 │ Tracking                 │                    │
│                 └──────────────────────────┘                    │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────┐    ┌──────────────────────────┐           │
│  │ Final           │◀───│ Debug Information        │           │
│  │ Result Object   │    │ (if enabled)             │           │
│  └─────────────────┘    └──────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Platform-Specific Differences

### n8n to Make.com

When converting from n8n to Make.com:

1. n8n **nodes** are converted to Make.com **modules**
2. n8n **connections** are converted to Make.com **routes**
3. n8n **expressions** (`{{ $json.data }}`) are converted to Make.com expressions (`{{1.data}}`)
4. n8n **node positions** are used to determine Make.com module layout

```
┌───────────────────────┐                        ┌───────────────────────┐
│                       │                        │                       │
│  n8n Workflow         │                        │  Make.com Workflow    │
│                       │                        │                       │
│  ┌───────┐   ┌───────┐│                        │  ┌───────┐   ┌───────┐│
│  │ Node1 │──▶│ Node2 ││   Conversion           │  │Module1│──▶│Module2││
│  └───────┘   └───────┘│   ==========>          │  └───────┘   └───────┘│
│       │                │                        │       │               │
│       ▼                │                        │       ▼               │
│  ┌───────┐            │                        │  ┌───────┐            │
│  │ Node3 │            │                        │  │Module3│            │
│  └───────┘            │                        │  └───────┘            │
│                       │                        │                       │
└───────────────────────┘                        └───────────────────────┘
```

### Make.com to n8n

When converting from Make.com to n8n:

1. Make.com **modules** are converted to n8n **nodes**
2. Make.com **routes** are converted to n8n **connections**
3. Make.com **expressions** (`{{1.data}}`) are converted to n8n expressions (`{{ $json.data }}`)
4. n8n node positions are calculated based on Make.com module order

## Example Conversion

Here's an example of a simple HTTP request workflow converted between platforms:

### n8n Workflow

```json
{
  "nodes": [
    {
      "id": "start",
      "type": "n8n-nodes-base.httpRequest",
      "position": [100, 100],
      "parameters": {
        "url": "https://api.example.com/data",
        "method": "GET"
      }
    },
    {
      "id": "process",
      "type": "n8n-nodes-base.function",
      "position": [300, 100],
      "parameters": {
        "functionCode": "return { data: $input.all()[0].json.results };"
      }
    }
  ],
  "connections": {
    "start": {
      "main": {
        "0": [
          {
            "node": "process",
            "type": "main",
            "index": 0
          }
        ]
      }
    }
  }
}
```

### Converted Make.com Workflow

```json
{
  "name": "Converted Workflow",
  "type": "scheduled",
  "modules": [
    {
      "id": 1,
      "name": "HTTP",
      "type": "http:request",
      "parameters": {
        "url": "https://api.example.com/data",
        "method": "GET"
      }
    },
    {
      "id": 2,
      "name": "Code",
      "type": "code:javascript",
      "parameters": {
        "code": "return { data: data[0].results };"
      }
    }
  ],
  "routes": [
    {
      "from": 1,
      "to": 2
    }
  ]
}
```

## Conclusion

The conversion process maintains the structure, logic, and functionality of workflows while translating between the n8n and Make.com formats. The system handles the complexities of different node types, parameter formats, expression syntax, and connection models to provide a seamless conversion experience. 