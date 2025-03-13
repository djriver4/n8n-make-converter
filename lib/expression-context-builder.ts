import { ExpressionContext } from './expression-evaluator';

/**
 * Utility class for building context objects for expression evaluation.
 * Creates standardized context objects for both n8n and Make.com workflows.
 */
export class ExpressionContextBuilder {
  private context: ExpressionContext = {};

  /**
   * Creates a new ExpressionContextBuilder instance
   */
  constructor() {
    // Initialize with empty objects for common context categories
    this.context = {
      $json: {},
      $env: process.env, // Provide access to environment variables
      $workflow: {},
    };
  }

  /**
   * Adds JSON data (typically from previous nodes) to the context
   * 
   * @param data - The JSON data to add
   * @returns The builder instance for chaining
   */
  withJsonData(data: Record<string, any>): ExpressionContextBuilder {
    this.context.$json = {
      ...this.context.$json,
      ...data
    };
    return this;
  }

  /**
   * Adds workflow metadata to the context
   * 
   * @param metadata - The workflow metadata to add
   * @returns The builder instance for chaining
   */
  withWorkflowMetadata(metadata: Record<string, any>): ExpressionContextBuilder {
    this.context.$workflow = {
      ...this.context.$workflow,
      ...metadata
    };
    return this;
  }

  /**
   * Adds custom variables to the context
   * 
   * @param key - The key for the custom variable
   * @param value - The value of the custom variable
   * @returns The builder instance for chaining
   */
  withCustomVariable(key: string, value: any): ExpressionContextBuilder {
    this.context[key] = value;
    return this;
  }

  /**
   * Adds multiple custom variables to the context
   * 
   * @param variables - The custom variables to add
   * @returns The builder instance for chaining
   */
  withCustomVariables(variables: Record<string, any>): ExpressionContextBuilder {
    this.context = {
      ...this.context,
      ...variables
    };
    return this;
  }

  /**
   * Creates a Make.com compatible context
   * This may include specific transformations needed for Make.com expressions
   * 
   * @returns Context object compatible with Make.com expressions
   */
  buildMakeContext(): ExpressionContext {
    // You could add Make.com specific context transformations here
    return {
      ...this.context,
      // Add any Make.com specific context variables
    };
  }

  /**
   * Creates an n8n compatible context
   * This may include specific transformations needed for n8n expressions
   * 
   * @returns Context object compatible with n8n expressions
   */
  buildN8nContext(): ExpressionContext {
    // You could add n8n specific context transformations here
    return {
      ...this.context,
      // Add any n8n specific context variables
      $node: {}, // n8n uses $node for node specific data
      $parameters: {} // n8n uses $parameters for node parameters
    };
  }

  /**
   * Builds the generic context without platform-specific transformations
   * 
   * @returns The built context object
   */
  build(): ExpressionContext {
    return {
      ...this.context
    };
  }

  /**
   * Create a default context with minimal information
   * 
   * @returns A default context
   */
  static createDefaultContext(): ExpressionContext {
    return new ExpressionContextBuilder().build();
  }

  /**
   * Create a context specific to an n8n workflow
   * 
   * @param workflow - The n8n workflow object
   * @returns A context preloaded with workflow data
   */
  static fromN8nWorkflow(workflow: any): ExpressionContext {
    const builder = new ExpressionContextBuilder();
    
    if (workflow) {
      builder.withWorkflowMetadata({
        id: workflow.id || '',
        name: workflow.name || '',
        active: workflow.active || false
      });
    }
    
    return builder.buildN8nContext();
  }

  /**
   * Create a context specific to a Make.com workflow
   * 
   * @param workflow - The Make.com workflow object
   * @returns A context preloaded with workflow data
   */
  static fromMakeWorkflow(workflow: any): ExpressionContext {
    const builder = new ExpressionContextBuilder();
    
    if (workflow) {
      builder.withWorkflowMetadata({
        id: workflow.id || '',
        name: workflow.name || '',
        // Add any other relevant Make.com workflow metadata
      });
    }
    
    return builder.buildMakeContext();
  }
} 