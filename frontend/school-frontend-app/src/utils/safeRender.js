/**
 * Utility functions for safely rendering objects in React
 */

/**
 * Safely converts any value to a string representation
 * Use this function to prevent "Objects are not valid as a React child" errors
 *
 * @param {any} value - The value to stringify
 * @returns {string} - A string representation of the value
 */
export const safeRender = (value) => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return '';
  }

  // If it's already a primitive type (string, number, boolean), return as string
  if (typeof value !== 'object') {
    return String(value);
  }

  // Handle React elements (return as is)
  if (value && value.$$typeof) {
    return String('[React Element]');
  }

  // Handle MongoDB documents with _id
  if (value && value._id) {
    if (value.name) {
      return String(value.name);
    }
    if (value.firstName && value.lastName) {
      return String(`${value.firstName} ${value.lastName}`);
    }
    if (value.code) {
      return String(value.code);
    }
    return String(value._id);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => safeRender(item)).join(', ');
  }

  // Handle dates
  if (value instanceof Date) {
    return String(value.toLocaleDateString());
  }

  // For other objects, convert to JSON string
  try {
    return String(JSON.stringify(value));
  } catch (error) {
    return String('[Object]');
  }
};

/**
 * Safely renders a student object
 * @param {Object} student - The student object
 * @returns {string} - A string representation of the student
 */
export const renderStudent = (student) => {
  if (!student) return '';

  if (typeof student === 'object') {
    if (student.firstName && student.lastName) {
      return String(`${student.firstName} ${student.lastName}`);
    }
    if (student.name) {
      return String(student.name);
    }
    if (student._id) {
      return String(student._id);
    }
    // For other objects, convert to JSON string
    try {
      return String(JSON.stringify(student));
    } catch (error) {
      return String('[Student Object]');
    }
  }

  return String(student);
};

/**
 * Safely renders a subject object
 * @param {Object} subject - The subject object
 * @returns {string} - A string representation of the subject
 */
export const renderSubject = (subject) => {
  if (!subject) return '';

  if (typeof subject === 'object') {
    if (subject.name) {
      return String(subject.name);
    }
    if (subject.code) {
      return String(subject.code);
    }
    if (subject._id) {
      return String(subject._id);
    }
    // For other objects, convert to JSON string
    try {
      return String(JSON.stringify(subject));
    } catch (error) {
      return String('[Subject Object]');
    }
  }

  return String(subject);
};

/**
 * Safely renders a class object
 * @param {Object} classObj - The class object
 * @returns {string} - A string representation of the class
 */
export const renderClass = (classObj) => {
  if (!classObj) return '';

  if (typeof classObj === 'object') {
    if (classObj.name) {
      let className = String(classObj.name);
      if (classObj.section) className += ` ${String(classObj.section)}`;
      if (classObj.stream) className += ` ${String(classObj.stream)}`;
      return className.trim();
    }
    if (classObj._id) {
      return String(classObj._id);
    }
    // For other objects, convert to JSON string
    try {
      return String(JSON.stringify(classObj));
    } catch (error) {
      return String('[Class Object]');
    }
  }

  return String(classObj);
};

export default safeRender;
