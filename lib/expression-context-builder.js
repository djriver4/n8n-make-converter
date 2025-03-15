"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionContextBuilder = void 0;
/**
 * Utility class for building context objects for expression evaluation.
 * Creates standardized context objects for both n8n and Make.com workflows.
 */
class ExpressionContextBuilder {
    /**
     * Creates a new ExpressionContextBuilder instance
     */
    constructor() {
        this.context = {};
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
    withJsonData(data) {
        this.context.$json = Object.assign(Object.assign({}, this.context.$json), data);
        return this;
    }
    /**
     * Adds workflow metadata to the context
     *
     * @param metadata - The workflow metadata to add
     * @returns The builder instance for chaining
     */
    withWorkflowMetadata(metadata) {
        this.context.$workflow = Object.assign(Object.assign({}, this.context.$workflow), metadata);
        return this;
    }
    /**
     * Adds custom variables to the context
     *
     * @param key - The key for the custom variable
     * @param value - The value of the custom variable
     * @returns The builder instance for chaining
     */
    withCustomVariable(key, value) {
        this.context[key] = value;
        return this;
    }
    /**
     * Adds multiple custom variables to the context
     *
     * @param variables - The custom variables to add
     * @returns The builder instance for chaining
     */
    withCustomVariables(variables) {
        this.context = Object.assign(Object.assign({}, this.context), variables);
        return this;
    }
    /**
     * Creates a Make.com compatible context
     * This may include specific transformations needed for Make.com expressions
     *
     * @returns Context object compatible with Make.com expressions
     */
    buildMakeContext() {
        // You could add Make.com specific context transformations here
        return Object.assign({}, this.context);
    }
    /**
     * Creates an n8n compatible context
     * This may include specific transformations needed for n8n expressions
     *
     * @returns Context object compatible with n8n expressions
     */
    buildN8nContext() {
        // You could add n8n specific context transformations here
        return Object.assign(Object.assign({}, this.context), { 
            // Add any n8n specific context variables
            $node: {}, $parameters: {} // n8n uses $parameters for node parameters
         });
    }
    /**
     * Builds the generic context without platform-specific transformations
     *
     * @returns The built context object
     */
    build() {
        return Object.assign({}, this.context);
    }
    /**
     * Create a default context with minimal information
     *
     * @returns A default context
     */
    static createDefaultContext() {
        return new ExpressionContextBuilder().build();
    }
    /**
     * Create a context specific to an n8n workflow
     *
     * @param workflow - The n8n workflow object
     * @returns A context preloaded with workflow data
     */
    static fromN8nWorkflow(workflow) {
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
    static fromMakeWorkflow(workflow) {
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
exports.ExpressionContextBuilder = ExpressionContextBuilder;
