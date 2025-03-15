import { NextResponse } from 'next/server';

// Define basic node mappings that will be accessible via API
const nodeMapping = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  mappings: {
    // HTTP node mapping (both directions)
    httpRequest: {
      sourceNodeType: 'n8n-nodes-base.httpRequest',
      targetNodeType: 'http',
      sourceParameterPaths: {
        url: ['url'],
        method: ['method'],
        authentication: ['authentication'],
        headers: ['headers'],
        queryParameters: ['query'],
        body: ['body']
      },
      targetParameterPaths: {
        URL: ['url'],
        method: ['method'],
        headers: ['headers']
      }
    },
    http: {
      sourceNodeType: 'http',
      targetNodeType: 'n8n-nodes-base.httpRequest',
      sourceParameterPaths: {
        URL: ['url'],
        method: ['method'],
        headers: ['headers']
      },
      targetParameterPaths: {
        url: ['URL'],
        method: ['method'],
        headers: ['headers']
      }
    },
    // Set node mapping (both directions)
    set: {
      sourceNodeType: 'n8n-nodes-base.set',
      targetNodeType: 'setVariable',
      sourceParameterPaths: {
        values: ['values']
      },
      targetParameterPaths: {
        values: ['values']
      }
    },
    setVariable: {
      sourceNodeType: 'setVariable',
      targetNodeType: 'n8n-nodes-base.set',
      sourceParameterPaths: {
        values: ['values']
      },
      targetParameterPaths: {
        values: ['values']
      }
    },
    // Manual trigger to webhook/http
    manualTrigger: {
      sourceNodeType: 'n8n-nodes-base.manualTrigger',
      targetNodeType: 'webhook',
      sourceParameterPaths: {},
      targetParameterPaths: {}
    },
    // Scheduler/timer
    scheduler: {
      sourceNodeType: 'scheduler',
      targetNodeType: 'n8n-nodes-base.schedule',
      sourceParameterPaths: {},
      targetParameterPaths: {}
    },
    // JSON/code
    json: {
      sourceNodeType: 'json',
      targetNodeType: 'n8n-nodes-base.code',
      sourceParameterPaths: {
        code: ['functionCode']
      },
      targetParameterPaths: {
        functionCode: ['code']
      }
    },
    // Function node
    function: {
      sourceNodeType: 'n8n-nodes-base.function',
      targetNodeType: 'tools',
      sourceParameterPaths: {
        functionCode: ['code']
      },
      targetParameterPaths: {
        code: ['functionCode']
      }
    },
    tools: {
      sourceNodeType: 'tools',
      targetNodeType: 'n8n-nodes-base.function',
      sourceParameterPaths: {
        code: ['functionCode']
      },
      targetParameterPaths: {
        functionCode: ['code']
      }
    },
    // Router/Switch
    router: {
      sourceNodeType: 'router',
      targetNodeType: 'n8n-nodes-base.switch',
      sourceParameterPaths: {
        conditions: ['conditions']
      },
      targetParameterPaths: {
        conditions: ['conditions']
      }
    },
    switch: {
      sourceNodeType: 'n8n-nodes-base.switch',
      targetNodeType: 'router',
      sourceParameterPaths: {
        conditions: ['conditions']
      },
      targetParameterPaths: {
        conditions: ['conditions']
      }
    },
    // helper:Note mapping (for comments and documentation)
    helperNote: {
      sourceNodeType: 'helper:Note',
      targetNodeType: 'n8n-nodes-base.noOp',
      sourceParameterPaths: {
        content: ['notes']
      },
      targetParameterPaths: {
        notes: ['content']
      }
    },
    // builtin:BasicRouter mapping (for switch/router functionality)
    basicRouter: {
      sourceNodeType: 'builtin:BasicRouter',
      targetNodeType: 'n8n-nodes-base.switch',
      sourceParameterPaths: {
        conditions: ['rules'],
        routes: ['output']
      },
      targetParameterPaths: {
        rules: ['conditions'],
        output: ['routes']
      }
    },
    // webhooks mapping (for webhook functionality)
    webhooks: {
      sourceNodeType: 'webhooks',
      targetNodeType: 'n8n-nodes-base.webhook',
      sourceParameterPaths: {
        method: ['httpMethod'],
        url: ['path'],
        responseType: ['responseMode'],
        responseData: ['responseData']
      },
      targetParameterPaths: {
        httpMethod: ['method'],
        path: ['url'],
        responseMode: ['responseType'],
        responseData: ['responseData']
      }
    },
    // Custom Webhook mapping 
    customWebhook: {
      sourceNodeType: 'webhooks:CustomWebhook',
      targetNodeType: 'n8n-nodes-base.webhook',
      sourceParameterPaths: {
        method: ['httpMethod'],
        url: ['path'],
        responseType: ['responseMode'],
        responseData: ['responseData']
      },
      targetParameterPaths: {
        httpMethod: ['method'],
        path: ['url'],
        responseMode: ['responseType'],
        responseData: ['responseData']
      }
    },
    // Generic placeholder for unmapped nodes
    placeholder: {
      sourceNodeType: 'placeholder',
      targetNodeType: 'n8n-nodes-base.noOp',
      sourceParameterPaths: {},
      targetParameterPaths: {}
    }
  }
};

export async function GET() {
  // Return the node mappings as JSON
  return NextResponse.json(nodeMapping);
} 