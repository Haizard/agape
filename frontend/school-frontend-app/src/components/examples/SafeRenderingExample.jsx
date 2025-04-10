import React from 'react';
import SafeDisplay from '../common/SafeDisplay';
import withSafeRendering from '../common/withSafeRendering';
import { stringifyObject } from '../../utils/stringifyObject';

/**
 * Example component showing how to use the safe rendering utilities
 */
const SafeRenderingExample = ({ student, subject }) => {
  return (
    <div className="safe-rendering-example">
      <h2>Safe Rendering Examples</h2>
      
      <h3>Method 1: Using SafeDisplay Component</h3>
      <div>
        <p>Student: <SafeDisplay value={student} fallback="No student selected" /></p>
        <p>Subject: <SafeDisplay value={subject} fallback="No subject selected" /></p>
      </div>
      
      <h3>Method 2: Using stringifyObject Utility</h3>
      <div>
        <p>Student: {stringifyObject(student)}</p>
        <p>Subject: {stringifyObject(subject)}</p>
      </div>
      
      <h3>Method 3: Using JSON.stringify</h3>
      <div>
        <p>Student: {student ? JSON.stringify(student) : 'No student selected'}</p>
        <p>Subject: {subject ? JSON.stringify(subject) : 'No subject selected'}</p>
      </div>
    </div>
  );
};

// Export the component wrapped with safe rendering HOC
export default withSafeRendering(SafeRenderingExample);
