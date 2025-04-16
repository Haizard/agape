/**
 * Utility functions for safely processing data from the API
 */

/**
 * Safely extracts academicYear information from class data
 * Handles both object and string representations
 * 
 * @param {Object|string} academicYear - The academicYear data from the class object
 * @param {string} defaultValue - Default value to return if academicYear is invalid
 * @returns {string} - A string representation of the academic year
 */
export const safelyExtractAcademicYear = (academicYear, defaultValue = 'Current Year') => {
  try {
    // If academicYear is null or undefined, return default
    if (academicYear == null) {
      return defaultValue;
    }
    
    // If academicYear is a string, return it directly
    if (typeof academicYear === 'string') {
      return academicYear;
    }
    
    // If academicYear is an object, try to extract name or year
    if (typeof academicYear === 'object') {
      // Check for _id to determine if it's a reference or full object
      if (academicYear._id && typeof academicYear._id === 'string') {
        // It's a reference, return the ID as fallback
        return academicYear.name || academicYear.year || academicYear._id;
      }
      
      // It's a full object, extract name or year
      return academicYear.name || academicYear.year || defaultValue;
    }
    
    // If we get here, academicYear is in an unexpected format
    console.warn('Unexpected academicYear format:', academicYear);
    return defaultValue;
  } catch (error) {
    console.error('Error processing academicYear:', error);
    return defaultValue;
  }
};

/**
 * Safely processes class data to ensure all properties are in the expected format
 * 
 * @param {Object} classData - The class data from the API
 * @returns {Object} - Processed class data with safe values
 */
export const processClassData = (classData) => {
  if (!classData) return null;
  
  try {
    // Create a deep copy to avoid modifying the original
    const processedData = { ...classData };
    
    // Process academicYear
    if (processedData.academicYear) {
      // Store the original academicYear object
      processedData._originalAcademicYear = processedData.academicYear;
      
      // Add a string representation for display
      processedData.academicYearDisplay = safelyExtractAcademicYear(processedData.academicYear);
    }
    
    // Process other potentially problematic fields
    // Add more field processing as needed
    
    return processedData;
  } catch (error) {
    console.error('Error processing class data:', error);
    return classData; // Return original data if processing fails
  }
};
