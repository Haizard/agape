import React, { Component } from 'react';
import FeeTemplatesFixed from './FeeTemplatesFixed';
import FeeTemplatesPlaceholder from './FeeTemplatesPlaceholder';

class FeeTemplatesWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('Error in FeeTemplatesFixed component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <FeeTemplatesPlaceholder />;
    }

    return <FeeTemplatesFixed />;
  }
}

export default FeeTemplatesWrapper;
