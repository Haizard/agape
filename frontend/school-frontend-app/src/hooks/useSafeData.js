import { useState, useEffect } from 'react';
import transformData from '../utils/dataTransformer';

/**
 * Custom hook to transform data before rendering
 * @param {any} data - The data to transform
 * @returns {any} - The transformed data
 */
const useSafeData = (data) => {
  const [safeData, setSafeData] = useState(null);
  
  useEffect(() => {
    // Transform the data
    const transformed = transformData(data);
    setSafeData(transformed);
  }, [data]);
  
  return safeData;
};

export default useSafeData;
