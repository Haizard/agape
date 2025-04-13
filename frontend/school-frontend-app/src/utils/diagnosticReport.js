/**
 * Diagnostic Report Generator
 * 
 * Creates comprehensive diagnostic reports for React applications,
 * focusing on React Router and React 18 issues.
 */

import debugLogger from './debugLogger';
import routerDiagnostics from './routerDiagnostics';
import react18Diagnostics from './react18Diagnostics';

// Generate a comprehensive diagnostic report
export const generateDiagnosticReport = () => {
  debugLogger.info('DiagnosticReport', {
    message: 'Generating diagnostic report',
  });
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: getEnvironmentInfo(),
    react: getReactInfo(),
    router: getRouterInfo(),
    errors: getErrorInfo(),
    logs: debugLogger.getLogs(),
    recommendations: [],
  };
  
  // Add router diagnosis
  const routerDiagnosis = routerDiagnostics.diagnoseRouterIssues();
  report.router.diagnosis = routerDiagnosis;
  
  // Add React 18 diagnosis
  const react18Diagnosis = react18Diagnostics.diagnoseReact18Issues();
  report.react.diagnosis = react18Diagnosis;
  
  // Combine recommendations
  report.recommendations = [
    ...routerDiagnosis.recommendations,
    ...react18Diagnosis.recommendations,
  ];
  
  // Add specific recommendations for Error #299
  if (hasError299(report)) {
    report.recommendations.push(
      'Move Router initialization to the top level of your application',
      'Ensure createRoot is called before any Router initialization',
      'Use a single Router component at the root of your application',
      'Avoid changing the history object after Router initialization'
    );
  }
  
  debugLogger.info('DiagnosticReport', {
    message: 'Diagnostic report generated',
    issueCount: routerDiagnosis.issues.length + react18Diagnosis.issues.length,
    recommendationCount: report.recommendations.length,
  });
  
  return report;
};

// Check if Error #299 is present
const hasError299 = (report) => {
  return report.errors.some(error => 
    error.message && error.message.includes('You cannot change <Router history>')
  );
};

// Get environment information
const getEnvironmentInfo = () => {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Not available',
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'Not available',
    language: typeof navigator !== 'undefined' ? navigator.language : 'Not available',
    viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Not available',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString(),
  };
};

// Get React information
const getReactInfo = () => {
  try {
    const React = require('react');
    const ReactDOM = require('react-dom');
    
    return {
      version: React.version,
      domVersion: ReactDOM.version,
      concurrent: typeof ReactDOM.createRoot === 'function',
      strictMode: React.StrictMode !== undefined,
      rootCount: react18Diagnostics.reactRootTracker.getRootCount(),
      renderCount: react18Diagnostics.reactRootTracker.getRenderCount(),
    };
  } catch (e) {
    return {
      error: e.message,
    };
  }
};

// Get Router information
const getRouterInfo = () => {
  try {
    const ReactRouter = require('react-router-dom');
    
    return {
      available: true,
      version: ReactRouter.version || 'unknown',
      components: Object.keys(ReactRouter).filter(key => typeof ReactRouter[key] === 'function'),
      routerInstanceCount: routerDiagnostics.routerInitTracker.getRouterInstanceCount(),
      historyInstanceCount: routerDiagnostics.routerInitTracker.getHistoryInstanceCount(),
      initialized: routerDiagnostics.routerInitTracker.isInitialized(),
    };
  } catch (e) {
    return {
      available: false,
      error: e.message,
    };
  }
};

// Get error information
const getErrorInfo = () => {
  return debugLogger.getLogsByLevel('error').map(log => ({
    timestamp: log.timestamp,
    category: log.category,
    message: log.data.message || log.data.error || 'Unknown error',
    stack: log.data.stack || 'No stack trace available',
  }));
};

// Export diagnostic report as JSON
export const exportDiagnosticReport = () => {
  const report = generateDiagnosticReport();
  return JSON.stringify(report, null, 2);
};

// Save diagnostic report to localStorage
export const saveDiagnosticReport = () => {
  const report = generateDiagnosticReport();
  
  try {
    localStorage.setItem('react_diagnostic_report', JSON.stringify(report));
    return true;
  } catch (e) {
    debugLogger.error('DiagnosticReport', {
      message: 'Failed to save diagnostic report to localStorage',
      error: e.message,
    });
    
    return false;
  }
};

// Load diagnostic report from localStorage
export const loadDiagnosticReport = () => {
  try {
    const reportJson = localStorage.getItem('react_diagnostic_report');
    
    if (reportJson) {
      return JSON.parse(reportJson);
    }
    
    return null;
  } catch (e) {
    debugLogger.error('DiagnosticReport', {
      message: 'Failed to load diagnostic report from localStorage',
      error: e.message,
    });
    
    return null;
  }
};

export default {
  generateDiagnosticReport,
  exportDiagnosticReport,
  saveDiagnosticReport,
  loadDiagnosticReport,
};
