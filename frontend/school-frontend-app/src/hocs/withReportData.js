import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useReport } from '../contexts/ReportContext';

/**
 * Higher-Order Component that provides report data to wrapped components
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {Object} options - Configuration options
 * @returns {React.Component} - Wrapped component with report data
 */
const withReportData = (WrappedComponent, options = {}) => {
  const {
    reportType,
    getParamsFromProps = null,
    shouldRefetchOnParamsChange = true,
    loadingComponent = null,
    errorComponent = null
  } = options;
  
  const WithReportData = (props) => {
    const params = useParams();
    const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);
    
    // Get report context
    const {
      report,
      loading,
      error,
      isFromCache,
      isMockData,
      fetchReport,
      resetState
    } = useReport();
    
    // Get params from props or route params
    const reportParams = useMemo(() => {
      return getParamsFromProps
        ? getParamsFromProps(props)
        : {
            studentId: params.studentId,
            examId: params.examId,
            classId: params.classId,
            academicYear: props.academicYear || params.academicYear,
            term: props.term || params.term
          };
    }, [params, props, getParamsFromProps]);
    
    // Create a stable reference to params for dependency array
    const stableParams = useMemo(() => JSON.stringify(reportParams), [reportParams]);
    
    // Fetch report on mount and when params change
    useEffect(() => {
      // Skip if we've already fetched and shouldn't refetch on params change
      if (hasInitiallyFetched && !shouldRefetchOnParamsChange) {
        return;
      }
      
      // Parse params back to object
      const parsedParams = JSON.parse(stableParams);
      
      // Check if we have all required params
      const hasRequiredParams = Object.values(parsedParams).every(
        value => value !== undefined && value !== null && value !== ''
      );
      
      if (hasRequiredParams) {
        console.log(`Fetching ${reportType} report with params:`, parsedParams);
        fetchReport(reportType, parsedParams)
          .then(() => {
            setHasInitiallyFetched(true);
          })
          .catch(err => {
            console.error(`Error fetching ${reportType} report:`, err);
            setHasInitiallyFetched(true);
          });
      }
      
      // Cleanup on unmount
      return () => {
        if (!shouldRefetchOnParamsChange) {
          // Don't reset state if we want to persist between navigations
          return;
        }
        resetState();
      };
    }, [stableParams, fetchReport, resetState, hasInitiallyFetched, shouldRefetchOnParamsChange, reportType]);
    
    // Show loading component
    if (loading && !report) {
      return loadingComponent || <div>Loading...</div>;
    }
    
    // Show error component
    if (error && !report) {
      return errorComponent || <div>Error: {error.message}</div>;
    }
    
    // Render wrapped component with report data
    return (
      <WrappedComponent
        {...props}
        report={report}
        loading={loading}
        error={error}
        isFromCache={isFromCache}
        isMockData={isMockData}
        refetch={() => fetchReport(reportType, JSON.parse(stableParams), { forceRefresh: true })}
      />
    );
  };
  
  // Set display name
  WithReportData.displayName = `withReportData(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithReportData;
};

export default withReportData;
