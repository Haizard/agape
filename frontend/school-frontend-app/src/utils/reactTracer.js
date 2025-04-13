/**
 * React Component Tracer
 * 
 * This utility provides detailed tracing of React component lifecycle events,
 * helping to debug rendering, mounting, and update issues.
 */

import debugLogger from './debugLogger';

// Higher-order component to trace component lifecycle
export const withComponentTracing = (Component, options = {}) => {
  const componentName = options.name || Component.displayName || Component.name || 'UnknownComponent';
  
  // Return a wrapped component with tracing
  const TracedComponent = (props) => {
    // Use React hooks for tracing
    const React = require('react');
    
    // Trace mounting
    React.useEffect(() => {
      debugLogger.debug('ComponentMount', {
        component: componentName,
        props: sanitizeProps(props),
      });
      
      // Trace unmounting
      return () => {
        debugLogger.debug('ComponentUnmount', {
          component: componentName,
        });
      };
    }, []);
    
    // Trace renders
    debugLogger.trace('ComponentRender', {
      component: componentName,
      props: sanitizeProps(props),
    });
    
    // Trace updates
    const prevPropsRef = React.useRef(props);
    React.useEffect(() => {
      const prevProps = prevPropsRef.current;
      
      // Find changed props
      const changedProps = {};
      let hasChanges = false;
      
      Object.keys(props).forEach(key => {
        if (props[key] !== prevProps[key]) {
          changedProps[key] = {
            from: prevProps[key],
            to: props[key],
          };
          hasChanges = true;
        }
      });
      
      // Log if props changed
      if (hasChanges) {
        debugLogger.debug('ComponentUpdate', {
          component: componentName,
          changedProps: sanitizeProps(changedProps),
        });
      }
      
      // Update ref
      prevPropsRef.current = props;
    });
    
    // Render the original component
    return <Component {...props} />;
  };
  
  // Set display name for debugging
  TracedComponent.displayName = `Traced(${componentName})`;
  
  return TracedComponent;
};

// Helper to sanitize props for logging (remove circular references, etc.)
const sanitizeProps = (props) => {
  try {
    // Convert to JSON and back to handle circular references
    return JSON.parse(JSON.stringify(props));
  } catch (e) {
    // If serialization fails, return a simplified version
    const sanitized = {};
    
    Object.keys(props).forEach(key => {
      const value = props[key];
      
      if (typeof value === 'function') {
        sanitized[key] = '[Function]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = `[Object: ${value.constructor.name || typeof value}]`;
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }
};

// Function to trace all components in an app
export const traceAllComponents = (rootComponent) => {
  // Recursively trace all components
  const traceComponent = (component) => {
    // Skip if already traced
    if (component.displayName && component.displayName.startsWith('Traced(')) {
      return component;
    }
    
    // Trace this component
    const traced = withComponentTracing(component);
    
    // If it has subcomponents, trace those too
    if (component.subcomponents) {
      traced.subcomponents = {};
      
      Object.keys(component.subcomponents).forEach(key => {
        traced.subcomponents[key] = traceComponent(component.subcomponents[key]);
      });
    }
    
    return traced;
  };
  
  return traceComponent(rootComponent);
};

// React Router specific tracing
export const traceRouterComponents = () => {
  try {
    // Get React Router components
    const ReactRouter = require('react-router-dom');
    
    // Trace key components
    const originalComponents = {
      BrowserRouter: ReactRouter.BrowserRouter,
      Routes: ReactRouter.Routes,
      Route: ReactRouter.Route,
      Link: ReactRouter.Link,
      NavLink: ReactRouter.NavLink,
      Navigate: ReactRouter.Navigate,
      Outlet: ReactRouter.Outlet,
      useNavigate: ReactRouter.useNavigate,
      useLocation: ReactRouter.useLocation,
      useParams: ReactRouter.useParams,
    };
    
    // Replace with traced versions
    Object.keys(originalComponents).forEach(key => {
      if (typeof originalComponents[key] === 'function') {
        if (key.startsWith('use')) {
          // For hooks, we need special handling
          const originalHook = originalComponents[key];
          
          ReactRouter[key] = (...args) => {
            debugLogger.trace('RouterHook', {
              hook: key,
              args,
            });
            
            const result = originalHook(...args);
            
            debugLogger.trace('RouterHookResult', {
              hook: key,
              result: typeof result === 'function' ? '[Function]' : result,
            });
            
            return result;
          };
        } else {
          // For components
          ReactRouter[key] = withComponentTracing(originalComponents[key], { name: `Router.${key}` });
        }
      }
    });
    
    debugLogger.info('RouterTracing', { message: 'React Router components traced successfully' });
  } catch (e) {
    debugLogger.error('RouterTracing', { message: 'Failed to trace React Router components', error: e });
  }
};

// Export a hook to trace component renders
export const useTraceRender = (componentName) => {
  const React = require('react');
  
  React.useEffect(() => {
    debugLogger.debug('HookComponentMount', {
      component: componentName,
    });
    
    return () => {
      debugLogger.debug('HookComponentUnmount', {
        component: componentName,
      });
    };
  }, [componentName]);
  
  debugLogger.trace('HookComponentRender', {
    component: componentName,
  });
};

// Export a hook to trace state changes
export const useTraceState = (state, stateName, componentName) => {
  const React = require('react');
  const prevStateRef = React.useRef(state);
  
  React.useEffect(() => {
    const prevState = prevStateRef.current;
    
    if (prevState !== state) {
      debugLogger.debug('StateChange', {
        component: componentName,
        state: stateName,
        from: prevState,
        to: state,
      });
    }
    
    prevStateRef.current = state;
  }, [state, stateName, componentName]);
};
