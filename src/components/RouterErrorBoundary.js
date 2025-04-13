
import React from 'react';

/**
 * Router Error Boundary
 * 
 * This component catches and handles React Router errors,
 * particularly Error #299.
 */
class RouterErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Router error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Check for Error #299
    if (error.message && error.message.includes('You cannot change <Router history>')) {
      console.error('Detected Error #299: You cannot change <Router history> after it has been created');
      console.error('This is typically caused by multiple Router instances or incorrect initialization order');
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
          <h2>Navigation Error</h2>
          <p>{this.state.error && this.state.error.message}</p>
          <button 
            onClick={() => window.location.href = '/'} 
            style={{ padding: '8px 16px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Go to Home
          </button>
          <button 
            onClick={() => this.setState({ hasError: false })} 
            style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '8px' }}
          >
            Try Again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default RouterErrorBoundary;
