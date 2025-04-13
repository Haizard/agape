# Advanced React Debugging Framework

This comprehensive debugging framework is designed to help diagnose and fix complex React issues, with a special focus on React Router and React 18 integration problems like Error #299.

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Basic Usage](#basic-usage)
4. [Diagnosing React Router Issues](#diagnosing-react-router-issues)
5. [Diagnosing React 18 Issues](#diagnosing-react-18-issues)
6. [Generating Diagnostic Reports](#generating-diagnostic-reports)
7. [Common Issues and Solutions](#common-issues-and-solutions)
8. [API Reference](#api-reference)

## Overview

This debugging framework provides:

- Comprehensive logging of React and React Router events
- Specialized diagnostics for React Router Error #299
- React 18 `createRoot` tracking and analysis
- Component lifecycle tracing
- Router state and history monitoring
- Diagnostic report generation
- Error boundary with detailed error reporting

## Installation

The debugging framework is already integrated into your project. All the necessary files are located in the `src/utils` directory:

- `debug.js` - Main entry point
- `debugLogger.js` - Logging utility
- `reactTracer.js` - React component tracing
- `routerDebugger.js` - Router state and history tracking
- `routerDiagnostics.js` - Router-specific diagnostics
- `react18Diagnostics.js` - React 18-specific diagnostics
- `diagnosticReport.js` - Diagnostic report generation
- `debugInit.js` - Initialization and configuration

## Basic Usage

### Initializing the Debugging Framework

The debugging framework is automatically initialized in your application. If you need to manually initialize it, you can do so by adding the following to your `index.js`:

```jsx
import { initializeDebugging, DebugProvider } from './utils/debug';

// Initialize debugging
initializeDebugging({
  patchReact: true,
  patchRouter: true,
  logLevel: 'debug',
  componentTracing: true,
  routerTracing: true,
});

// Wrap your app with DebugProvider
root.render(
  <DebugProvider>
    <App />
  </DebugProvider>
);
```

### Using the Debug Console

Once initialized, you can access the debugging tools through the browser console:

```javascript
// Generate a diagnostic report
window.__REACT_DEBUG__.generateReport();

// Export the report as JSON
const reportJson = window.__REACT_DEBUG__.exportReport();

// Save the report to localStorage
window.__REACT_DEBUG__.saveReport();

// Access the logger
window.__REACT_DEBUG__.logger.getLogs();
```

### Adding Component Tracing

To trace a specific component:

```jsx
import { withComponentTracing } from './utils/debug';

// Wrap your component with tracing
const TracedComponent = withComponentTracing(YourComponent);

// Or use the hook in functional components
import { useTraceRender } from './utils/debug';

function YourComponent() {
  useTraceRender('YourComponent');
  // ...
}
```

## Diagnosing React Router Issues

### Detecting Router Initialization Problems

The framework automatically tracks Router initialization and can detect issues like:

- Multiple Router instances
- Incorrect Router nesting
- History object changes after initialization
- Missing Router context

### Using Router Debugging Hooks

```jsx
import { useRouterDebugger } from './utils/debug';

function YourComponent() {
  // Get enhanced router objects with debugging
  const { location, navigate, history } = useRouterDebugger();
  
  // Now you can use these as normal
  console.log('Current path:', location.pathname);
  
  // Navigate with automatic logging
  const handleClick = () => navigate('/some-path');
  
  // ...
}
```

### Router Error Boundary

Wrap your Router with the specialized error boundary:

```jsx
import { RouterErrorBoundary } from './utils/debug';

function App() {
  return (
    <RouterErrorBoundary>
      <BrowserRouter>
        {/* Your app */}
      </BrowserRouter>
    </RouterErrorBoundary>
  );
}
```
