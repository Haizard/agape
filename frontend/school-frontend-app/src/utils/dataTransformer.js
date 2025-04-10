/**
 * Utility to transform data before rendering
 * This ensures that no objects are passed to React components
 */

/**
 * Deeply transforms all objects in the data to strings
 * @param {any} data - The data to transform
 * @returns {any} - The transformed data with all objects converted to strings
 */
export const transformData = (data) => {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitive types
  if (typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => transformData(item));
  }

  // Handle dates
  if (data instanceof Date) {
    return data.toLocaleDateString();
  }

  // Handle React elements (return as is)
  if (data && data.$$typeof && typeof data.$$typeof === 'symbol') {
    return data;
  }

  // Handle objects
  const result = {};
  
  // Special handling for MongoDB documents
  if (data._id) {
    // For student objects
    if (data.firstName && data.lastName) {
      result._id = String(data._id);
      result.firstName = String(data.firstName);
      result.lastName = String(data.lastName);
      result.fullName = `${data.firstName} ${data.lastName}`;
      
      if (data.rollNumber) {
        result.rollNumber = String(data.rollNumber);
      }
      
      // Copy other properties
      Object.keys(data).forEach(key => {
        if (!result[key] && data[key] !== null && data[key] !== undefined) {
          result[key] = transformData(data[key]);
        }
      });
      
      return result;
    }
    
    // For subject objects
    if (data.name && data.type) {
      result._id = String(data._id);
      result.name = String(data.name);
      result.type = String(data.type);
      
      // Copy other properties
      Object.keys(data).forEach(key => {
        if (!result[key] && data[key] !== null && data[key] !== undefined) {
          result[key] = transformData(data[key]);
        }
      });
      
      return result;
    }
    
    // For class objects
    if (data.name && (data.section || data.stream)) {
      result._id = String(data._id);
      result.name = String(data.name);
      
      if (data.section) {
        result.section = String(data.section);
      }
      
      if (data.stream) {
        result.stream = String(data.stream);
      }
      
      result.fullName = [data.name, data.section, data.stream].filter(Boolean).join(' ');
      
      // Copy other properties
      Object.keys(data).forEach(key => {
        if (!result[key] && data[key] !== null && data[key] !== undefined) {
          result[key] = transformData(data[key]);
        }
      });
      
      return result;
    }
  }
  
  // For other objects, transform all properties
  Object.keys(data).forEach(key => {
    result[key] = transformData(data[key]);
  });
  
  return result;
};

/**
 * Transform API response data before using it in components
 * @param {any} response - The API response data
 * @returns {any} - The transformed data
 */
export const transformApiResponse = (response) => {
  if (!response) return response;
  
  // If it's an axios response with a data property
  if (response.data) {
    return {
      ...response,
      data: transformData(response.data)
    };
  }
  
  // Otherwise transform the response directly
  return transformData(response);
};

export default transformData;
