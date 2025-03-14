import React, { useState } from 'react';
import { ConversionResult, ConversionLog } from '../lib/workflow-converter';
import { N8nWorkflow, MakeWorkflow, N8nNode, MakeModule } from '../lib/node-mappings/node-types';
import { PerformanceSummary } from '../lib/performance-logger';

interface ConversionResultsViewerProps {
  result: ConversionResult;
  performanceSummary?: PerformanceSummary;
  direction: 'n8nToMake' | 'makeToN8n';
}

const ConversionResultsViewer: React.FC<ConversionResultsViewerProps> = ({
  result,
  performanceSummary,
  direction
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'nodes' | 'issues' | 'performance'>('overview');
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  
  const workflow = result.convertedWorkflow;
  const isN8nWorkflow = 'nodes' in workflow;
  const nodes = isN8nWorkflow
    ? (workflow as N8nWorkflow).nodes
    : (workflow as MakeWorkflow).modules;
  
  const unmappedCount = result.unmappedNodes?.length || 0;
  const issuesCount = (result.parametersNeedingReview?.length || 0) + (result.logs?.filter((l: ConversionLog) => l.type === 'error' || l.type === 'warning').length || 0);
  
  // Determine source and target platform labels
  const sourcePlatform = direction === 'n8nToMake' ? 'n8n' : 'Make.com';
  const targetPlatform = direction === 'n8nToMake' ? 'Make.com' : 'n8n';
  
  return (
    <div className="conversion-results bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
        <h2 className="text-xl font-bold text-white">
          Conversion Results: {sourcePlatform} → {targetPlatform}
        </h2>
        <p className="text-blue-100">
          Workflow: {workflow.name}
        </p>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'nodes' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('nodes')}
        >
          Nodes/Modules
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'issues' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('issues')}
        >
          Issues {issuesCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{issuesCount}</span>}
        </button>
        {performanceSummary && (
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'performance' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
        )}
      </div>
      
      <div className="p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800">Nodes/Modules</h3>
                <p className="text-3xl font-bold">{nodes.length}</p>
                <p className="text-sm text-gray-600">Total nodes/modules in converted workflow</p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-amber-800">Unmapped</h3>
                <p className="text-3xl font-bold">{unmappedCount}</p>
                <p className="text-sm text-gray-600">Nodes/modules without direct mappings</p>
              </div>
              
              <div className={`${issuesCount > 0 ? 'bg-red-50' : 'bg-green-50'} p-4 rounded-lg`}>
                <h3 className="text-lg font-semibold">{issuesCount > 0 ? <span className="text-red-800">Issues</span> : <span className="text-green-800">Clean</span>}</h3>
                <p className="text-3xl font-bold">{issuesCount}</p>
                <p className="text-sm text-gray-600">Parameters needing manual review</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Conversion Summary</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>
                  This workflow conversion from <strong>{sourcePlatform}</strong> to <strong>{targetPlatform}</strong> contains:
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>{nodes.length} converted nodes/modules</li>
                  {isN8nWorkflow && (
                    <li>
                      {Object.keys((workflow as N8nWorkflow).connections).length} node connections
                    </li>
                  )}
                  {!isN8nWorkflow && (
                    <li>
                      {(workflow as MakeWorkflow).routes.length} module routes
                    </li>
                  )}
                  {unmappedCount > 0 && (
                    <li className="text-amber-600">
                      {unmappedCount} unmapped node types that need manual review
                    </li>
                  )}
                  {(result.parametersNeedingReview?.length || 0) > 0 && (
                    <li className="text-red-600">
                      {result.parametersNeedingReview?.length} parameters needing manual review
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Nodes/Modules Tab */}
        {activeTab === 'nodes' && (
          <div className="space-y-4">
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {nodes.map((node, index) => {
                    const isUnmapped = (result.unmappedNodes || []).includes(
                      isN8nWorkflow ? (node as N8nNode).type : (node as MakeModule).type
                    );
                    
                    const needsReview = (result.parametersNeedingReview || []).some((p: string) => 
                      p.includes(node.name) || p.includes(String(node.id))
                    );
                    
                    // Convert node.id to string to ensure type compatibility
                    const nodeIdString = String(node.id);
                    
                    return (
                      <React.Fragment key={nodeIdString}>
                        <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${needsReview ? 'bg-red-50' : ''} ${isUnmapped ? 'bg-amber-50' : ''}`}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{node.id}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{node.name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {isN8nWorkflow ? (node as N8nNode).type : (node as MakeModule).type}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {isUnmapped && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                Unmapped
                              </span>
                            )}
                            {needsReview && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Needs Review
                              </span>
                            )}
                            {!isUnmapped && !needsReview && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Converted
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => setExpandedNodeId(expandedNodeId === nodeIdString ? null : nodeIdString)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {expandedNodeId === nodeIdString ? 'Hide Details' : 'View Details'}
                            </button>
                          </td>
                        </tr>
                        
                        {/* Expanded details */}
                        {expandedNodeId === nodeIdString && (
                          <tr>
                            <td colSpan={5} className="px-4 py-3">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="text-lg font-medium mb-2">Parameters</h4>
                                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
                                  {JSON.stringify(node.parameters, null, 2)}
                                </pre>
                                
                                {isUnmapped && (
                                  <div className="mt-4 p-3 bg-amber-100 text-amber-800 rounded-lg">
                                    <p className="font-medium">Node Type Not Mapped</p>
                                    <p className="text-sm mt-1">
                                      This node type does not have a direct mapping to the target platform. 
                                      Consider replacing it with an equivalent node or custom implementation.
                                    </p>
                                  </div>
                                )}
                                
                                {needsReview && (
                                  <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg">
                                    <p className="font-medium">Parameters Need Review</p>
                                    <p className="text-sm mt-1">
                                      Some parameters in this node need manual review due to complex expressions 
                                      or platform-specific features.
                                    </p>
                                    <ul className="list-disc ml-6 mt-2 text-sm">
                                      {result.parametersNeedingReview?.filter((p: string) => 
                                        p.includes(node.name) || p.includes(String(node.id))
                                      ).map((issue: string, i: number) => (
                                        <li key={i}>{issue}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Issues Tab */}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            {/* Unmapped Nodes */}
            {(result.unmappedNodes?.length || 0) > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-amber-700">Unmapped Node Types</h3>
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Node Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommendation</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(result.unmappedNodes || []).map((nodeType: string, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{nodeType}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            Implement a custom mapping or find an equivalent node type in {targetPlatform}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Parameters Needing Review */}
            {(result.parametersNeedingReview?.length || 0) > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-red-700">Parameters Needing Review</h3>
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(result.parametersNeedingReview || []).map((param: string, index: number) => {
                        const parts = param.split(': ');
                        const paramPath = parts[0];
                        const reason = parts[1] || 'Complex expression or unsupported feature';
                        
                        return (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{paramPath}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{reason}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Error and Warning Logs */}
            {(result.logs?.filter((l: ConversionLog) => l.type === 'error' || l.type === 'warning').length || 0) > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Conversion Logs</h3>
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(result.logs || [])
                        .filter((log: ConversionLog) => log.type === 'error' || log.type === 'warning')
                        .map((log: ConversionLog, index: number) => (
                          <tr 
                            key={index} 
                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${log.type === 'error' ? 'bg-red-50' : 'bg-amber-50'}`}
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {log.type === 'error' ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Error
                                </span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                  Warning
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{log.message}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '-'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {issuesCount === 0 && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="mt-2 text-xl font-medium text-gray-900">No Issues Found</h3>
                <p className="mt-1 text-gray-500">
                  All nodes and parameters were successfully converted without any issues.
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Performance Tab */}
        {activeTab === 'performance' && performanceSummary && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800">Total Duration</h3>
                <p className="text-2xl font-bold">{performanceSummary.totalDuration}ms</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-purple-800">Nodes Processed</h3>
                <p className="text-2xl font-bold">{performanceSummary.nodesProcessed}</p>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-indigo-800">Avg. Node Processing</h3>
                <p className="text-2xl font-bold">{performanceSummary.averageNodeProcessingTime.toFixed(2)}ms</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-green-800">Peak Memory</h3>
                <p className="text-2xl font-bold">
                  {performanceSummary.peakMemoryUsage 
                    ? `${(performanceSummary.peakMemoryUsage / (1024 * 1024)).toFixed(2)} MB` 
                    : 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Operation Breakdown */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Operation Breakdown</h3>
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Duration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(performanceSummary.operationBreakdown).map(([type, data], index) => (
                      <tr key={type} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{type}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{data.count}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{data.totalDuration}ms</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{data.averageDuration.toFixed(2)}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Slowest Operations */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Slowest Operations</h3>
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {performanceSummary.slowestOperations.map((op, index) => (
                      <tr key={op.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{op.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{op.operationType}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{op.duration}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversionResultsViewer; 