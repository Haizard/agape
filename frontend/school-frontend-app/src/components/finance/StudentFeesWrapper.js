import React, { useEffect } from 'react';
import StudentFees from './StudentFees';

/**
 * This is a wrapper component for StudentFees that ensures
 * the component is properly refreshed when navigated to
 */
const StudentFeesWrapper = () => {
  // Force a refresh when the component mounts
  useEffect(() => {
    // Clear any cached content
    console.log('StudentFeesWrapper mounted - forcing refresh');
    
    // You could also add a key to the StudentFees component
    // that changes on each render to force a complete remount
  }, []);

  return <StudentFees key={Date.now()} />;
};

export default StudentFeesWrapper;
