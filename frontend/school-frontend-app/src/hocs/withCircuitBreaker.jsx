import React, { useState, useRef, useEffect } from 'react';

/**
 * Circuit breaker HOC to prevent infinite rendering loops
 *
 * @param {React.Component} WrappedComponent - The component to wrap
 * @param {Object} options - Configuration options
 * @param {number} options.maxRenders - Maximum number of renders allowed in the time window
 * @param {number} options.timeWindowMs - Time window in milliseconds
 * @param {React.Component|null} options.fallback - Optional custom fallback component to render when circuit breaker trips
 * @returns {React.Component} - The wrapped component with circuit breaker protection
 */
const withCircuitBreaker = (
  WrappedComponent,
  options = { maxRenders: 30, timeWindowMs: 2000, fallback: null }
) => {
  const { maxRenders, timeWindowMs, fallback } = options;

  const CircuitBreakerComponent = (props) => {
    const [tripped, setTripped] = useState(false);
    const renderCountRef = useRef(0);
    const renderTimesRef = useRef([]);
    const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

    useEffect(() => {
      // Reset render count on unmount
      return () => {
        renderCountRef.current = 0;
        renderTimesRef.current = [];
      };
    }, []);

    // Check if circuit breaker should trip
    const now = Date.now();
    renderTimesRef.current.push(now);

    // Remove render times outside the window
    renderTimesRef.current = renderTimesRef.current.filter(
      time => now - time < timeWindowMs
    );

    // Count renders in the time window
    const rendersInWindow = renderTimesRef.current.length;
    renderCountRef.current += 1;

    // Trip the circuit breaker if too many renders
    if (rendersInWindow > maxRenders && !tripped) {
      console.error(
        `Emergency circuit breaker activated for ${componentName} - ` +
        `${rendersInWindow} renders in ${timeWindowMs}ms (total: ${renderCountRef.current})`
      );
      setTripped(true);
    }

    // Log render count every 5 renders
    if (renderCountRef.current % 5 === 0) {
      console.log(`Render count for ${componentName}: ${renderCountRef.current}`);
    }

    // If circuit breaker is tripped, render fallback or default error message
    if (tripped) {
      if (fallback) {
        return React.createElement(fallback, {
          componentName,
          rendersInWindow,
          timeWindowMs,
          onReset: () => {
            renderCountRef.current = 0;
            renderTimesRef.current = [];
            setTripped(false);
          }
        });
      }

      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid red',
          borderRadius: '5px',
          backgroundColor: '#fff8f8'
        }}>
          <h3 style={{ color: 'red' }}>Rendering Emergency Stop</h3>
          <p>
            The component <strong>{componentName}</strong> was rendering too quickly
            ({rendersInWindow} renders in {timeWindowMs}ms) and has been stopped to prevent
            browser crashes.
          </p>
          <p>
            This usually indicates an infinite loop in the component's render or effect hooks.
            Please check the console for more details.
          </p>
          <button
            onClick={() => {
              renderCountRef.current = 0;
              renderTimesRef.current = [];
              setTripped(false);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset & Try Again
          </button>
        </div>
      );
    }

    // Otherwise, render the wrapped component
    return <WrappedComponent {...props} />;
  };

  // Set display name for debugging
  CircuitBreakerComponent.displayName = `withCircuitBreaker(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return CircuitBreakerComponent;
};

export default withCircuitBreaker;
