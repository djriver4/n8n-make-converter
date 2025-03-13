import 'jest';

declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Custom matcher to check if a workflow structure matches the expected structure
       */
      toMatchWorkflowStructure(expected: any): R;
    }
  }
} 