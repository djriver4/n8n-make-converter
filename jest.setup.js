// Import any global setup for Jest tests here
import '@testing-library/jest-dom';

// Add custom matchers
import { toMatchWorkflowStructure } from './__tests__/utils/test-helpers';

expect.extend({
  toMatchWorkflowStructure,
}); 