import { NodeMapper, NodeMappingError } from '../../../lib/node-mappings/node-mapper';
import { N8nNode, MakeModule } from '../../../lib/node-mappings/node-types';
import { NodeMappingDatabase } from '../../../lib/node-mappings/schema';

// Sample mapping database for testing
const testMappingDatabase: NodeMappingDatabase = {
  version: '1.0.0',
  lastUpdated: '2023-11-15',
  mappings: {
    httpRequest: {
      n8nNodeType: 'n8n-nodes-base.httpRequest',
      n8nDisplayName: 'HTTP Request',
      makeModuleId: 'http',
      makeModuleName: 'HTTP',
      n8nTypeCategory: 'Action',
      makeTypeCategory: 'App',
      description: 'Make a HTTP request and receive the response',
      operations: [
        {
          n8nName: 'GET',
          makeName: 'get',
          description: 'Make a GET request',
          parameters: [
            {
              n8nName: 'url',
              makeName: 'url',
              type: 'string',
              required: true,
              description: 'The URL to make the request to'
            },
            {
              n8nName: 'headers',
              makeName: 'headers',
              type: 'object',
              required: false,
              description: 'Request headers'
            }
          ]
        }
      ],
      credentials: [
        {
          n8nType: 'httpBasicAuth',
          makeType: 'basic',
          fields: [
            {
              n8nName: 'user',
              makeName: 'username',
              type: 'string'
            },
            {
              n8nName: 'password',
              makeName: 'password',
              type: 'string'
            }
          ]
        }
      ]
    }
  }
};

describe('NodeMapper', () => {
  let nodeMapper: NodeMapper;

  beforeEach(() => {
    // Create a new NodeMapper instance for each test
    nodeMapper = new NodeMapper(testMappingDatabase);
  });

  describe('getNodeMappingByN8nType', () => {
    it('should return the correct mapping for a valid n8n node type', () => {
      const mapping = nodeMapper.getNodeMappingByN8nType('n8n-nodes-base.httpRequest');
      expect(mapping).toBeDefined();
      expect(mapping?.n8nDisplayName).toBe('HTTP Request');
    });

    it('should return undefined for an invalid n8n node type', () => {
      const mapping = nodeMapper.getNodeMappingByN8nType('n8n-nodes-base.nonExistentNode');
      expect(mapping).toBeUndefined();
    });
  });

  describe('getNodeMappingByMakeId', () => {
    it('should return the correct mapping for a valid Make.com module ID', () => {
      const mapping = nodeMapper.getNodeMappingByMakeId('http');
      expect(mapping).toBeDefined();
      expect(mapping?.makeModuleName).toBe('HTTP');
    });

    it('should return undefined for an invalid Make.com module ID', () => {
      const mapping = nodeMapper.getNodeMappingByMakeId('nonExistentModule');
      expect(mapping).toBeUndefined();
    });
  });

  describe('mapN8nNodeToMake', () => {
    it('should convert an n8n HTTP Request GET node to a Make.com HTTP module', () => {
      const n8nNode: N8nNode = {
        id: '1',
        name: 'HTTP Request',
        type: 'n8n-nodes-base.httpRequest',
        position: [100, 200],
        parameters: {
          operation: 'GET',
          url: 'https://example.com/api',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      };

      const makeModule = nodeMapper.mapN8nNodeToMake(n8nNode);
      
      expect(makeModule).toBeDefined();
      expect(makeModule.type).toBe('http');
      expect(makeModule.name).toBe('HTTP Request');
      expect(makeModule.definition.type).toBe('get');
      expect(makeModule.definition.parameters?.url).toBe('https://example.com/api');
      expect(makeModule.definition.parameters?.headers).toEqual({
        'Content-Type': 'application/json'
      });
    });

    it('should throw an error for an unmapped n8n node type', () => {
      const n8nNode: N8nNode = {
        id: '1',
        name: 'Unknown Node',
        type: 'n8n-nodes-base.unknownNode',
        position: [100, 200],
        parameters: {}
      };

      expect(() => nodeMapper.mapN8nNodeToMake(n8nNode)).toThrow(NodeMappingError);
    });

    it('should throw an error for an unmapped operation', () => {
      const n8nNode: N8nNode = {
        id: '1',
        name: 'HTTP Request',
        type: 'n8n-nodes-base.httpRequest',
        position: [100, 200],
        parameters: {
          operation: 'UNKNOWN_METHOD',
          url: 'https://example.com/api'
        }
      };

      expect(() => nodeMapper.mapN8nNodeToMake(n8nNode)).toThrow(NodeMappingError);
    });
  });

  describe('mapMakeNodeToN8n', () => {
    it('should convert a Make.com HTTP module to an n8n HTTP Request node', () => {
      const makeModule: MakeModule = {
        id: 1,
        name: 'HTTP',
        type: 'http',
        bundleId: 'http',
        definition: {
          type: 'get',
          parameters: {
            url: 'https://example.com/api',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }
      };

      const n8nNode = nodeMapper.mapMakeNodeToN8n(makeModule);
      
      expect(n8nNode).toBeDefined();
      expect(n8nNode.type).toBe('n8n-nodes-base.httpRequest');
      expect(n8nNode.name).toBe('HTTP');
      expect(n8nNode.parameters?.operation).toBe('GET');
      expect(n8nNode.parameters?.url).toBe('https://example.com/api');
      expect(n8nNode.parameters?.headers).toEqual({
        'Content-Type': 'application/json'
      });
    });

    it('should throw an error for an unmapped Make.com module type', () => {
      const makeModule: MakeModule = {
        id: 1,
        name: 'Unknown Module',
        type: 'unknown-module',
        bundleId: 'unknown',
        definition: {
          type: 'default'
        }
      };

      expect(() => nodeMapper.mapMakeNodeToN8n(makeModule)).toThrow(NodeMappingError);
    });

    it('should throw an error for an unmapped operation', () => {
      const makeModule: MakeModule = {
        id: 1,
        name: 'HTTP',
        type: 'http',
        bundleId: 'http',
        definition: {
          type: 'unknown_method',
          parameters: {
            url: 'https://example.com/api'
          }
        }
      };

      expect(() => nodeMapper.mapMakeNodeToN8n(makeModule)).toThrow(NodeMappingError);
    });
  });
}); 