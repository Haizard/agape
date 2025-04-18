import React from 'react';
import { ReportProvider } from '../contexts/ReportContext';

/**
 * Wrapper component for the ReportProvider
 * This allows us to easily add the ReportProvider to the application
 * without modifying the main App.js file
 */
const ReportProviderWrapper = ({ children }) => {
  return (
    <ReportProvider>
      {children}
    </ReportProvider>
  );
};

export default ReportProviderWrapper;
