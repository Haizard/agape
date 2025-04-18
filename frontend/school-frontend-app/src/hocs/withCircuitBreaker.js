import React, { useEffect } from 'react';
import circuitBreaker from '../utils/circuitBreaker';

/**
 * HOC that adds circuit breaker functionality to prevent infinite re-renders
 * @param {React.Component} WrappedComponent - Component to wrap
 * @returns {React.Component} - Wrapped component with circuit breaker
 */
const withCircuitBreaker = (WrappedComponent) => {
  const WithCircuitBreaker = (props) => {
    // Check circuit breaker on each render
    const isBroken = circuitBreaker.check();
    
    // Reset circuit breaker on unmount
    useEffect(() => {
      return () => {
        circuitBreaker.reset();
      };
    }, []);
    
    // If circuit is broken, show error message
    if (isBroken) {
      return (
        <div className="circuit-breaker-error" style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #f44336',
          borderRadius: '4px',
          backgroundColor: '#ffebee',
          color: '#d32f2f',
          textAlign: 'center'
        }}>
          <h2>Emergency Circuit Breaker Activated</h2>
          <p>Too many re-renders detected. This could be caused by a bug in the application.</p>
          <button 
            onClick={() => {
              circuitBreaker.reset();
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reset & Reload
          </button>
        </div>
      );
    }
    
    // Otherwise, render the wrapped component
    return <WrappedComponent {...props} />;
  };
  
  // Set display name
  WithCircuitBreaker.displayName = `withCircuitBreaker(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithCircuitBreaker;
};

export default withCircuitBreaker;
