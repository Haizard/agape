/**
 * Utility functions for safely rendering objects in React components
 */

import React from 'react';
import SafeDisplay from '../components/common/SafeDisplay';

/**
 * Safely renders any value, including objects
 * Use this function to prevent "Objects are not valid as a React child" errors
 * 
 * @param {any} value - The value to render
 * @param {string} fallback - Fallback text if value is null/undefined
 * @returns {React.ReactNode} - The safely rendered value
 */
export const renderSafely = (value, fallback = '') => {
  return <SafeDisplay value={value} fallback={fallback} />;
};

/**
 * Safely renders a student object
 * 
 * @param {Object} student - The student object
 * @param {string} fallback - Fallback text if student is null/undefined
 * @returns {React.ReactNode} - The safely rendered student
 */
export const renderStudent = (student, fallback = 'No student') => {
  return <SafeDisplay value={student} fallback={fallback} />;
};

/**
 * Safely renders a subject object
 * 
 * @param {Object} subject - The subject object
 * @param {string} fallback - Fallback text if subject is null/undefined
 * @returns {React.ReactNode} - The safely rendered subject
 */
export const renderSubject = (subject, fallback = 'No subject') => {
  return <SafeDisplay value={subject} fallback={fallback} />;
};

/**
 * Safely renders a class object
 * 
 * @param {Object} classObj - The class object
 * @param {string} fallback - Fallback text if class is null/undefined
 * @returns {React.ReactNode} - The safely rendered class
 */
export const renderClass = (classObj, fallback = 'No class') => {
  return <SafeDisplay value={classObj} fallback={fallback} />;
};

/**
 * Safely renders a teacher object
 * 
 * @param {Object} teacher - The teacher object
 * @param {string} fallback - Fallback text if teacher is null/undefined
 * @returns {React.ReactNode} - The safely rendered teacher
 */
export const renderTeacher = (teacher, fallback = 'No teacher') => {
  return <SafeDisplay value={teacher} fallback={fallback} />;
};

/**
 * Safely renders an exam object
 * 
 * @param {Object} exam - The exam object
 * @param {string} fallback - Fallback text if exam is null/undefined
 * @returns {React.ReactNode} - The safely rendered exam
 */
export const renderExam = (exam, fallback = 'No exam') => {
  return <SafeDisplay value={exam} fallback={fallback} />;
};

export default {
  renderSafely,
  renderStudent,
  renderSubject,
  renderClass,
  renderTeacher,
  renderExam
};
