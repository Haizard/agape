import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  AlertTitle,
  Divider
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import MarksEntryForm from './MarksEntryForm';
import MarksEntryTable from './MarksEntryTable';
import StudentSubjectEligibilityChecker from './StudentSubjectEligibilityChecker';

/**
 * Unified Marks Entry Component
 * Handles marks entry for both O-Level and A-Level students
 */
const UnifiedMarksEntry = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [studentsWithMarks, setStudentsWithMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingMarks, setCheckingMarks] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [showEligibilityChecker, setShowEligibilityChecker] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch classes, exams, and academic years on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch classes
        const classesResponse = await axios.get('/api/classes', {
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });

        if (classesResponse.data.success) {
          setClasses(classesResponse.data.data);
        }

        // Fetch exams
        const examsResponse = await axios.get('/api/prisma/exams', {
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });

        if (examsResponse.data.success) {
          setExams(examsResponse.data.data);
        }

        // Fetch academic years
        const academicYearsResponse = await axios.get('/api/academic-years', {
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });

        if (academicYearsResponse.data.success) {
          setAcademicYears(academicYearsResponse.data.data);

          // Set current academic year if available
          const currentYear = academicYearsResponse.data.data.find(year => year.isCurrent);
          if (currentYear) {
            setSelectedAcademicYear(currentYear._id);
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Error fetching initial data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [currentUser]);

  // Fetch subjects when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      setEducationLevel('');
      return;
    }

    const fetchSubjects = async () => {
      try {
        const classResponse = await axios.get(`/api/classes/${selectedClass}`, {
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });

        if (classResponse.data.success) {
          const classData = classResponse.data.data;
          setEducationLevel(classData.educationLevel);
        }

        // For admin users, fetch all subjects for the class
        const response = await axios.get(`/api/prisma/subjects/class/${selectedClass}`, {
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });

        if (response.data.success) {
          setSubjects(response.data.data.subjects || []);
        } else {
          setError('Failed to fetch subjects');
        }
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setError('Error fetching subjects');
      }
    };

    fetchSubjects();
  }, [selectedClass, currentUser]);

  // Check existing marks
  const checkExistingMarks = async () => {
    if (!selectedClass || !selectedSubject || !selectedExam) {
      setError('Please select class, subject, and exam');
      return;
    }

    setCheckingMarks(true);
    setError('');
    setSuccess('');
    setStudentsWithMarks([]);

    try {
      const response = await axios.get('/api/prisma/marks/check', {
        params: {
          classId: selectedClass,
          subjectId: selectedSubject,
          examId: selectedExam
        },
        headers: {
          Authorization: `Bearer ${currentUser.token}`
        }
      });

      if (response.data.success) {
        // Get the students with marks
        const students = response.data.data.studentsWithMarks || [];

        // Check eligibility for each student
        const studentsWithEligibility = await Promise.all(students.map(async (student) => {
          try {
            // Check if student is eligible for this subject
            const eligibilityResponse = await axios.get('/api/prisma/marks/validate-eligibility', {
              params: {
                studentId: student.student.id,
                subjectId: selectedSubject
              },
              headers: {
                Authorization: `Bearer ${currentUser.token}`
              }
            });

            // Add eligibility warning if student is not eligible
            if (eligibilityResponse.data.success && !eligibilityResponse.data.isEligible) {
              return {
                ...student,
                eligibilityWarning: eligibilityResponse.data.message
              };
            }

            return student;
          } catch (error) {
            console.error(`Error checking eligibility for student ${student.student.id}:`, error);
            return student;
          }
        }));

        setStudentsWithMarks(studentsWithEligibility);
      } else {
        setError(response.data.message || 'Failed to check marks');
      }
    } catch (error) {
      console.error('Error checking marks:', error);
      setError('Error checking marks');
    } finally {
      setCheckingMarks(false);
    }
  };

  // Handle marks change
  const handleMarksChange = (studentId, value) => {
    // Validate marks (0-100)
    const numValue = Number(value);
    let error = null;

    if (value !== '' && (Number.isNaN(numValue) || numValue < 0 || numValue > 100)) {
      error = 'Marks must be between 0 and 100';
    }

    // Update validation errors
    setValidationErrors(prev => ({
      ...prev,
      [studentId]: error
    }));

    // Update students with marks
    setStudentsWithMarks(prev =>
      prev.map(item =>
        item.student.id === studentId
          ? {
              ...item,
              marksObtained: value,
              hasError: error !== null
            }
          : item
      )
    );
  };

  // Handle comment change
  const handleCommentChange = (studentId, value) => {
    setStudentsWithMarks(prev =>
      prev.map(item =>
        item.student.id === studentId
          ? {
              ...item,
              comment: value
            }
          : item
      )
    );
  };

  // Save marks
  const saveMarks = async () => {
    // Check for validation errors
    const hasErrors = Object.values(validationErrors).some(error => error !== null);
    if (hasErrors) {
      setError('Please fix validation errors before saving');
      return;
    }

    // Prepare data for batch marks entry
    const studentMarks = studentsWithMarks
      .filter(item => item.marksObtained !== undefined && item.marksObtained !== '')
      .map(item => ({
        studentId: item.student.id,
        marksObtained: Number(item.marksObtained),
        comment: item.comment || ''
      }));

    if (studentMarks.length === 0) {
      setError('No marks to save');
      return;
    }

    setSavingMarks(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/prisma/marks/batch', {
        classId: selectedClass,
        subjectId: selectedSubject,
        examId: selectedExam,
        academicYearId: selectedAcademicYear,
        studentMarks
      }, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`
        }
      });

      if (response.data.success) {
        setSuccess(`Successfully saved marks for ${response.data.data.results.length} students`);
        // Refresh marks
        checkExistingMarks();
      } else {
        setError(response.data.message || 'Failed to save marks');
      }
    } catch (error) {
      console.error('Error saving marks:', error);
      setError('Error saving marks');
    } finally {
      setSavingMarks(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedSubject('');
    setSelectedExam('');
    setStudentsWithMarks([]);
    setError('');
    setSuccess('');
    setValidationErrors({});
  };

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Unified Marks Entry
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Enter marks for both O-Level and A-Level students.
        </Typography>

        <Button
          variant="outlined"
          onClick={() => setShowEligibilityChecker(!showEligibilityChecker)}
          sx={{ mb: 2 }}
        >
          {showEligibilityChecker ? 'Hide Eligibility Checker' : 'Show Eligibility Checker'}
        </Button>

        {showEligibilityChecker && (
          <StudentSubjectEligibilityChecker />
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <AlertTitle>Success</AlertTitle>
            {success}
          </Alert>
        )}

        <MarksEntryForm
          classes={classes}
          subjects={subjects}
          exams={exams}
          academicYears={academicYears}
          selectedClass={selectedClass}
          selectedSubject={selectedSubject}
          selectedExam={selectedExam}
          selectedAcademicYear={selectedAcademicYear}
          educationLevel={educationLevel}
          loading={loading}
          checkingMarks={checkingMarks}
          setSelectedClass={setSelectedClass}
          setSelectedSubject={setSelectedSubject}
          setSelectedExam={setSelectedExam}
          setSelectedAcademicYear={setSelectedAcademicYear}
          checkExistingMarks={checkExistingMarks}
          resetForm={resetForm}
        />

        {studentsWithMarks.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <MarksEntryTable
              studentsWithMarks={studentsWithMarks}
              validationErrors={validationErrors}
              handleMarksChange={handleMarksChange}
              handleCommentChange={handleCommentChange}
              saveMarks={saveMarks}
              savingMarks={savingMarks}
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default UnifiedMarksEntry;
