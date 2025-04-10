import React from 'react';

/**
 * Safely renders an object as a string
 * @param {any} value - The value to render
 * @returns {string} - A string representation of the value
 */
export const safeRender = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  // Handle React elements directly
  if (React && value && value.$$typeof && value.$$typeof.toString() === 'Symbol(react.element)') {
    return value; // Return React elements as is
  }

  if (typeof value === 'object') {
    // If it's an object, convert it to a string representation
    if (value._id) {
      // If it has an _id property, it's likely a MongoDB document
      if (value.name) {
        return value.name;
      } else if (value.firstName && value.lastName) {
        return `${value.firstName} ${value.lastName}`;
      } else if (value.code) {
        return value.code;
      } else {
        return value._id.toString();
      }
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => safeRender(item)).join(', ');
    }

    // Handle Date objects
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    // Fallback to JSON string
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.error('Error stringifying object:', error);
      return '[Object]';
    }
  }

  // For non-objects, convert to string
  return String(value);
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
      return `${student.firstName} ${student.lastName}`;
    } else if (student.name) {
      return student.name;
    } else if (student._id) {
      return student._id.toString();
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
      return subject.name;
    } else if (subject.code) {
      return subject.code;
    } else if (subject._id) {
      return subject._id.toString();
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
      let className = classObj.name;
      if (classObj.section) className += ` ${classObj.section}`;
      if (classObj.stream) className += ` ${classObj.stream}`;
      return className.trim();
    } else if (classObj._id) {
      return classObj._id.toString();
    }
  }

  return String(classObj);
};

/**
 * Safely renders a teacher object
 * @param {Object} teacher - The teacher object
 * @returns {string} - A string representation of the teacher
 */
export const renderTeacher = (teacher) => {
  if (!teacher) return '';

  if (typeof teacher === 'object') {
    if (teacher.firstName && teacher.lastName) {
      return `${teacher.firstName} ${teacher.lastName}`;
    } else if (teacher.name) {
      return teacher.name;
    } else if (teacher._id) {
      return teacher._id.toString();
    }
  }

  return String(teacher);
};

export default {
  safeRender,
  renderStudent,
  renderSubject,
  renderClass,
  renderTeacher
};
