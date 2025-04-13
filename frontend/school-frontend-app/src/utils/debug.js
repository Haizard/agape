/**
 * Debug Tools Index
 * 
 * Main entry point for the debugging framework.
 */

import debugLogger from './debugLogger';
import reactTracer from './reactTracer';
import routerDebugger from './routerDebugger';
import routerDiagnostics from './routerDiagnostics';
import react18Diagnostics from './react18Diagnostics';
import diagnosticReport from './diagnosticReport';
import debugInit from './debugInit';

// Export all debugging tools
export {
  debugLogger,
  reactTracer,
  routerDebugger,
  routerDiagnostics,
  react18Diagnostics,
  diagnosticReport,
  debugInit,
};

// Export key components and functions
export const {
  withComponentTracing,
  traceAllComponents,
  traceRouterComponents,
  useTraceRender,
  useTraceState,
} = reactTracer;

export const {
  useRouterDebugger,
  RouterErrorBoundary,
  analyzeRouterConfig,
} = routerDebugger;

export const {
  patchReactRouter,
  diagnoseRouterIssues,
} = routerDiagnostics;

export const {
  patchReactDOM,
  diagnoseReact18Issues,
} = react18Diagnostics;

export const {
  generateDiagnosticReport,
  exportDiagnosticReport,
  saveDiagnosticReport,
  loadDiagnosticReport,
} = diagnosticReport;

export const {
  initializeDebugging,
  DebugErrorBoundary,
  DebugProvider,
} = debugInit;

// Initialize debugging if auto-init is enabled
if (typeof window !== 'undefined' && window.__REACT_DEBUG_AUTO_INIT__) {
  initializeDebugging(window.__REACT_DEBUG_OPTIONS__ || {});
}

// Default export
export default {
  initializeDebugging,
  DebugProvider,
  DebugErrorBoundary,
  generateDiagnosticReport,
  logger: debugLogger,
};
