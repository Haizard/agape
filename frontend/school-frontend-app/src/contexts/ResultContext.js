import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { handleApiError } from '../utils/errorHandler';

// Create context
const ResultContext = createContext();

/**
 * Result Provider Component
 * Provides shared state and data fetching functions for result-related components
 */
export const ResultProvider = ({ children }) => {
  // State
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch classes
  const fetchClasses = useCallback(async (educationLevel) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = educationLevel 
        ? `/api/classes?educationLevel=${educationLevel}`
        : '/api/classes';
      
      const response = await axios.get(url);
      setClasses(response.data);
      return response.data;
    } catch (err) {
      const errorDetails = handleApiError(err, 'fetchClasses');
      setError(errorDetails.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch exams
  const fetchExams = useCallback(async (classId) => {
    if (!classId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/exams?class=${classId}`);
      setExams(response.data);
      return response.data;
    } catch (err) {
      const errorDetails = handleApiError(err, 'fetchExams');
      setError(errorDetails.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch students
  const fetchStudents = useCallback(async (classId, form) => {
    if (!classId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/students?class=${classId}`);
      
      // Filter by form if provided
      let filteredStudents = response.data;
      if (form) {
        const formNumber = typeof form === 'string' ? parseInt(form.replace('Form ', ''), 10) : form;
        filteredStudents = response.data.filter(student => 
          student.form === formNumber || 
          student.form === formNumber.toString() ||
          student.form === `Form ${formNumber}`
        );
      }
      
      setStudents(filteredStudents);
      return filteredStudents;
    } catch (err) {
      const errorDetails = handleApiError(err, 'fetchStudents');
      setError(errorDetails.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle class selection
  const handleClassChange = useCallback(async (classId) => {
    setSelectedClass(classId);
    setSelectedExam(null);
    setSelectedStudent(null);
    
    if (classId) {
      await fetchExams(classId);
      await fetchStudents(classId, selectedForm);
    } else {
      setExams([]);
      setStudents([]);
    }
  }, [fetchExams, fetchStudents, selectedForm]);

  // Handle exam selection
  const handleExamChange = useCallback((examId) => {
    setSelectedExam(examId);
  }, []);

  // Handle student selection
  const handleStudentChange = useCallback((studentId) => {
    setSelectedStudent(studentId);
  }, []);

  // Handle form selection
  const handleFormChange = useCallback(async (form) => {
    setSelectedForm(form);
    
    if (selectedClass) {
      await fetchStudents(selectedClass, form);
    }
  }, [fetchStudents, selectedClass]);

  // Clear selections
  const clearSelections = useCallback(() => {
    setSelectedClass(null);
    setSelectedExam(null);
    setSelectedStudent(null);
    setSelectedForm(null);
    setExams([]);
    setStudents([]);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const value = {
    // State
    classes,
    exams,
    students,
    selectedClass,
    selectedExam,
    selectedStudent,
    selectedForm,
    loading,
    error,
    
    // Actions
    fetchClasses,
    fetchExams,
    fetchStudents,
    handleClassChange,
    handleExamChange,
    handleStudentChange,
    handleFormChange,
    clearSelections,
    clearError
  };

  return (
    <ResultContext.Provider value={value}>
      {children}
    </ResultContext.Provider>
  );
};

/**
 * Custom hook to use the Result context
 * @returns {Object} - Result context value
 */
export const useResultContext = () => {
  const context = useContext(ResultContext);
  
  if (!context) {
    throw new Error('useResultContext must be used within a ResultProvider');
  }
  
  return context;
};
