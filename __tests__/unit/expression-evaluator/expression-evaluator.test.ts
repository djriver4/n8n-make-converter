import { 
  evaluateExpression, 
  isExpression, 
  extractExpressionContent,
  processValueWithPossibleExpression,
  processObjectWithExpressions,
  ExpressionContext
} from '../../../lib/expression-evaluator';

describe('Expression Evaluator', () => {
  describe('isExpression', () => {
    it('should identify n8n expressions', () => {
      expect(isExpression('={{ $json.data }}')).toBe(true);
    });

    it('should identify Make.com expressions', () => {
      expect(isExpression('{{$json.data}}')).toBe(true);
    });

    it('should return false for non-expression strings', () => {
      expect(isExpression('plain text')).toBe(false);
      expect(isExpression('text with { brackets }')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isExpression(123)).toBe(false);
      expect(isExpression(null)).toBe(false);
      expect(isExpression(undefined)).toBe(false);
      expect(isExpression({})).toBe(false);
      expect(isExpression([])).toBe(false);
    });
  });

  describe('extractExpressionContent', () => {
    it('should extract content from n8n expressions', () => {
      expect(extractExpressionContent('={{ $json.data }}')).toBe('$json.data');
    });

    it('should extract content from Make.com expressions', () => {
      expect(extractExpressionContent('{{$json.data}}')).toBe('$json.data');
    });

    it('should return the original string if not an expression', () => {
      expect(extractExpressionContent('plain text')).toBe('plain text');
    });

    it('should handle empty or invalid inputs', () => {
      expect(extractExpressionContent('')).toBe('');
      expect(extractExpressionContent(null as any)).toBe('');
      expect(extractExpressionContent(undefined as any)).toBe('');
    });
  });

  describe('evaluateExpression', () => {
    const context: ExpressionContext = {
      $json: {
        firstName: 'John',
        lastName: 'Doe',
        age: 30,
        value: 'processed',
        data: {
          items: [1, 2, 3]
        }
      },
      $env: {
        API_URL: 'https://api.example.com'
      },
      $workflow: {
        id: 'workflow-123',
        name: 'Test Workflow'
      }
    };

    it('should evaluate simple variable access expressions', () => {
      expect(evaluateExpression('={{ $json.firstName }}', context)).toBe('John');
      expect(evaluateExpression('{{$json.firstName}}', context)).toBe('John');
    });

    it('should evaluate environment variables', () => {
      expect(evaluateExpression('={{ $env.API_URL }}', context)).toBe('https://api.example.com');
    });

    it('should evaluate workflow metadata', () => {
      expect(evaluateExpression('={{ $workflow.name }}', context)).toBe('Test Workflow');
    });

    it('should evaluate simple arithmetic expressions', () => {
      expect(evaluateExpression('={{ 1 + 2 }}', context)).toBe(3);
    });

    it('should handle invalid expressions gracefully', () => {
      expect(evaluateExpression('={{ invalid expression }}', context)).toBeNull();
    });

    it('should return null for empty expressions', () => {
      expect(evaluateExpression('', context)).toBeNull();
      expect(evaluateExpression('={{}}', context)).toBeNull();
    });
  });

  describe('processValueWithPossibleExpression', () => {
    const context: ExpressionContext = {
      $json: {
        firstName: 'John',
        lastName: 'Doe',
        value: 'processed'
      }
    };

    it('should process expression values', () => {
      expect(processValueWithPossibleExpression('={{ $json.value }}', context)).toBe('processed');
    });

    it('should pass through non-expression values', () => {
      expect(processValueWithPossibleExpression('regular text', context)).toBe('regular text');
      expect(processValueWithPossibleExpression(123, context)).toBe(123);
      expect(processValueWithPossibleExpression(null, context)).toBeNull();
      expect(processValueWithPossibleExpression(undefined, context)).toBeUndefined();
    });
  });

  describe('processObjectWithExpressions', () => {
    const context: ExpressionContext = {
      $json: {
        firstName: 'John',
        lastName: 'Doe'
      }
    };

    it('should process expressions in objects', () => {
      const input = {
        name: '={{ $json.firstName }}',
        description: 'Regular text',
        nested: {
          value: '={{ $json.lastName }}'
        }
      };

      const expected = {
        name: 'John',
        description: 'Regular text',
        nested: {
          value: 'Doe'
        }
      };

      expect(processObjectWithExpressions(input, context)).toEqual(expected);
    });

    it('should process expressions in arrays', () => {
      const input = [
        '={{ $json.firstName }}',
        'Regular text',
        {
          value: '={{ $json.lastName }}'
        }
      ];

      const expected = [
        'John',
        'Regular text',
        {
          value: 'Doe'
        }
      ];

      expect(processObjectWithExpressions(input, context)).toEqual(expected);
    });

    it('should handle null and undefined values', () => {
      expect(processObjectWithExpressions(null, context)).toBeNull();
      expect(processObjectWithExpressions(undefined, context)).toBeUndefined();
    });
  });
}); 