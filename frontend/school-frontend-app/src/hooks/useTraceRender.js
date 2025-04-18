import { useRef, useEffect } from 'react';

/**
 * Hook to trace component renders
 * @param {string} componentName - Name of the component
 * @param {Object} props - Component props
 */
const useTraceRender = (componentName, props) => {
  const prevProps = useRef();
  const renderCount = useRef(0);
  
  useEffect(() => {
    // Increment render count
    renderCount.current++;
    
    // Log render count
    console.log(`[${componentName}] Render #${renderCount.current}`);
    
    // Log changed props in development
    if (process.env.NODE_ENV !== 'production' && prevProps.current) {
      const changedProps = Object.entries(props).filter(
        ([key, value]) => prevProps.current[key] !== value
      );
      
      if (changedProps.length > 0) {
        console.log(`[${componentName}] Changed props:`, 
          changedProps.reduce((obj, [key, value]) => {
            obj[key] = {
              from: prevProps.current[key],
              to: value
            };
            return obj;
          }, {})
        );
      }
    }
    
    // Update prevProps
    prevProps.current = { ...props };
  });
};

export default useTraceRender;
