import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import authUtils from '../../utils/authUtils';
import teacherAuthService from '../../services/teacherAuthService';
import teacherApi from '../../services/teacherApi';
import teacherSubjectFilter from '../../services/teacherSubjectFilter';
import { ENDPOINTS, getEndpoint } from '../../services/api-endpoints';
import { filterStudentsBySubject, createStudentSubjectsMap, formatStudentName } from '../../utils/student-utils';
import { handleApiError, logError } from '../../utils/error-utils';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Help as HelpIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * O-Level Bulk Marks Entry Component
 * Allows teachers to enter marks for multiple O-Level students at once
 */
const OLevelBulkMarksEntry = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  // State variables
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);

        // Check if user is admin
        const isAdmin = teacherAuthService.isAdmin();

        let classesData;
        if (isAdmin) {
          // Admin can see all classes
          const response = await api.get('/api/classes', {
            params: {
              educationLevel: 'O_LEVEL'
            }
          });
          classesData = response.data || [];
        } else {
          // Teachers can only see assigned classes
          const assignedClasses = await teacherApi.getAssignedClasses();
          // Filter for O-Level classes
          classesData = assignedClasses.filter(cls =>
            cls.educationLevel === 'O_LEVEL' || !cls.educationLevel
          );
        }

        setClasses(classesData);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError('Failed to fetch classes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch exams when class is selected
  useEffect(() => {
    const fetchExams = async () => {
      if (!selectedClass) return;

      try {
        setLoading(true);
        const response = await api.get('/api/exams');
        setExams(response.data || []);
      } catch (error) {
        console.error('Error fetching exams:', error);
        setError('Failed to fetch exams. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [selectedClass]);

  // Fetch subjects when class is selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass) return;

      try {
        setLoading(true);

        // Check if user is admin
        const isAdmin = teacherAuthService.isAdmin();

        let subjectsData;
        if (isAdmin) {
          // Admin can see all subjects in the class
          // Use enhanced API endpoint that respects student subject selections
          const response = await api.get(getEndpoint(ENDPOINTS.TEACHER.ENHANCED.O_LEVEL.SUBJECTS, selectedClass));
          subjectsData = response.data.subjects || [];
          console.log('Admin: Found subjects:', subjectsData);
        } else {
          // Teachers can only see assigned subjects
          // Use our specialized filter service to get only truly assigned subjects
          console.log('Teacher: Using teacherSubjectFilter to get only truly assigned subjects');
          subjectsData = await teacherSubjectFilter.getTeacherFilteredSubjects(selectedClass);
          console.log('Teacher: Found filtered subjects:', subjectsData);
        }

        // Filter for O-Level subjects only
        const oLevelSubjects = subjectsData.filter(subject =>
          subject.educationLevel === 'O_LEVEL' || subject.educationLevel === 'BOTH' || !subject.educationLevel
        );

        console.log('All subjects before filtering:', subjectsData);
        console.log('O-Level subjects after filtering:', oLevelSubjects);

        // If we have no O-Level subjects and user is admin, try to fetch them directly
        if (oLevelSubjects.length === 0 && isAdmin) {
          try {
            console.log('No O-Level subjects found, trying direct approach');
            // Try to get O-Level subjects directly
            const directResponse = await api.get('/api/subjects', {
              params: { educationLevel: 'O_LEVEL' }
            });

            if (directResponse.data && directResponse.data.length > 0) {
              console.log('Direct approach: Found O-Level subjects directly:', directResponse.data);
              setSubjects(directResponse.data);
            } else {
              console.log('Direct approach: No O-Level subjects found directly');
              setSubjects(oLevelSubjects);
            }
          } catch (directError) {
            console.error('Error fetching O-Level subjects directly:', directError);
            setSubjects(oLevelSubjects);
          }
        } else {
          setSubjects(oLevelSubjects);
        }
      } catch (error) {
        // Use our error handling utility to get a more specific error
        const handledError = handleApiError(error);

        // Log the error with context
        logError(handledError, {
          component: 'OLevelBulkMarksEntry',
          function: 'fetchSubjects',
          classId: selectedClass
        });

        // Set appropriate error message based on error type
        setError(handledError.message || 'Failed to fetch subjects. Please try again.');

        // Show more specific messages based on error type
        if (handledError.name === 'AuthorizationError') {
          setError('You are not authorized to access subjects in this class. Please contact an administrator.');
        } else if (handledError.statusCode === 404) {
          setError('Teacher profile not found. Please contact an administrator to set up your teacher profile.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedClass]);

  // Function to fetch student subject selections
  const fetchStudentSubjectSelections = async (classId) => {
    try {
      console.log(`Fetching student subject selections for class ${classId}`);
      const response = await api.get(getEndpoint(ENDPOINTS.STUDENT_SELECTIONS.BY_CLASS, classId));
      console.log(`Found ${response.data.length} student subject selections for class ${classId}`);

      // Log a sample of the selections
      if (response.data.length > 0) {
        const sample = response.data.slice(0, 2);
        console.log('Sample of student subject selections:',
          sample.map(s => ({
            studentId: s.student?._id || 'unknown',
            studentName: s.student ? `${s.student.firstName || ''} ${s.student.lastName || ''}` : 'unknown',
            coreSubjects: (s.coreSubjects || []).length,
            optionalSubjects: (s.optionalSubjects || []).length,
            status: s.status
          }))
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching student subject selections:', error);
      return [];
    }
  };

  /**
   * Filter students based on subject type and selections
   * @param {Array} students - Array of student objects
   * @param {string} subjectId - ID of the subject to filter by
   * @param {boolean} isCoreSubject - Whether the subject is a core subject
   * @param {Object} studentSubjectsMap - Map of student IDs to their selected subjects
   * @returns {Array} - Filtered array of students
   */
  const filterStudentsForSubject = (students, subjectId, isCoreSubject, studentSubjectsMap) => {
    // If it's a core subject, all students take it
    if (isCoreSubject) {
      console.log(`Subject ${subjectId} is a core subject, using all ${students.length} students`);
      return students;
    }

    // For optional subjects, filter students who have selected this subject
    console.log(`Subject ${subjectId} is an optional subject, filtering students...`);
    console.log(`Total students before filtering: ${students.length}`);
    console.log(`Student subjects map has ${Object.keys(studentSubjectsMap).length} entries`);

    // Check if we have any student subject selections
    if (Object.keys(studentSubjectsMap).length === 0) {
      console.log('No student subject selections found, cannot filter students');
      return [];
    }

    const filteredStudents = filterStudentsBySubject(students, subjectId, false, studentSubjectsMap);
    console.log(`Filtered to ${filteredStudents.length} students who have selected subject ${subjectId}`);

    // Log the filtered students for debugging
    if (filteredStudents.length > 0) {
      console.log('Filtered students:', filteredStudents.map(s => ({
        id: s._id,
        name: `${s.firstName || ''} ${s.lastName || ''}`
      })));
    }

    return filteredStudents;
  };

  // Fetch students when class, subject, and exam are selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass || !selectedSubject || !selectedExam) return;

      try {
        setLoading(true);

        // Check if user is admin
        const isAdmin = teacherAuthService.isAdmin();

        // If not admin, verify authorization
        if (!isAdmin) {
          // Always check if teacher is authorized for this subject
          console.log('Checking teacher authorization for subject');

          // Check if teacher is authorized for this class
          const isAuthorizedForClass = await teacherAuthService.isAuthorizedForClass(selectedClass);
          if (!isAuthorizedForClass) {
            setError('You are not authorized to view marks for this class');
            setLoading(false);
            return;
          }

          // Get the filtered subjects the teacher should have access to
          const authorizedSubjects = await teacherSubjectFilter.getTeacherFilteredSubjects(selectedClass);
          const isAuthorizedForSubject = authorizedSubjects.some(subject => subject._id === selectedSubject);

          if (!isAuthorizedForSubject) {
            setError('You are not authorized to view marks for this subject');
            setLoading(false);
            return;
          }

          console.log('Teacher is authorized for class and subject');
        }

        // Get students in the class
        let studentsData;
        if (isAdmin) {
          // Admin can see all students in the class
          try {
            console.log('Admin: Fetching students using /api/students/class endpoint');
            const studentsResponse = await api.get(`/api/students/class/${selectedClass}`);
            studentsData = studentsResponse.data || [];
            console.log(`Admin: Found ${studentsData.length} students in class ${selectedClass}`);
          } catch (adminError) {
            console.error('Admin: Error fetching students:', adminError);
            // Try alternative endpoint
            console.log('Admin: Trying alternative endpoint /api/teachers/classes');
            try {
              const altResponse = await api.get(`/api/teachers/classes/${selectedClass}/students`);
              studentsData = altResponse.data || [];
              console.log(`Admin: Found ${studentsData.length} students using alternative endpoint`);
            } catch (altError) {
              console.error('Admin: Alternative endpoint also failed:', altError);
              throw new Error('Failed to fetch students. Please try again.');
            }
          }
        } else {
          // Teachers can only see assigned students
          try {
            console.log('Teacher: Trying O-Level specific endpoint for students');
            // First try the O-Level specific endpoint
            const oLevelResponse = await api.get(getEndpoint(ENDPOINTS.TEACHER.ENHANCED.O_LEVEL.STUDENTS, selectedClass, selectedSubject));
            if (oLevelResponse.data && Array.isArray(oLevelResponse.data.students)) {
              console.log(`Teacher: Found ${oLevelResponse.data.students.length} students using O-Level specific endpoint`);
              studentsData = oLevelResponse.data.students;
            } else {
              // Fall back to the regular endpoint
              console.log('Teacher: O-Level specific endpoint returned invalid data, falling back to regular endpoint');
              try {
                const regularResponse = await api.get(`/api/teachers/classes/${selectedClass}/students`);
                studentsData = regularResponse.data || [];
                console.log(`Teacher: Found ${studentsData.length} students using regular endpoint`);
              } catch (regularError) {
                console.error('Teacher: Regular endpoint failed:', regularError);
                // Try another fallback
                console.log('Teacher: Trying students/class endpoint as last resort');
                const lastResortResponse = await api.get(`/api/students/class/${selectedClass}`);
                studentsData = lastResortResponse.data || [];
                console.log(`Teacher: Found ${studentsData.length} students using last resort endpoint`);
              }
            }
          } catch (oLevelError) {
            console.log('Teacher: O-Level specific endpoint failed, falling back to regular endpoint', oLevelError);
            // Fall back to the regular endpoint
            try {
              const regularResponse = await api.get(`/api/teachers/classes/${selectedClass}/students`);
              studentsData = regularResponse.data || [];
              console.log(`Teacher: Found ${studentsData.length} students using regular endpoint`);
            } catch (regularError) {
              console.error('Teacher: Regular endpoint failed:', regularError);
              // Try another fallback
              console.log('Teacher: Trying students/class endpoint as last resort');
              const lastResortResponse = await api.get(`/api/students/class/${selectedClass}`);
              studentsData = lastResortResponse.data || [];
              console.log(`Teacher: Found ${studentsData.length} students using last resort endpoint`);
            }
          }
        }

        // Get existing marks for the selected class, subject, and exam using the new standardized API
        let marksResponse;
        try {
          console.log('Fetching marks from standardized API endpoint...');
          marksResponse = await api.get(ENDPOINTS.MARKS.O_LEVEL.CHECK, {
            params: {
              classId: selectedClass,
              subjectId: selectedSubject,
              examId: selectedExam
            }
          });
          console.log('Marks response:', marksResponse.data);
          console.log('Students with marks:', marksResponse.data.studentsWithMarks || []);
        } catch (marksError) {
          console.error('Error fetching marks from standardized API:', marksError);
          // Fall back to the legacy endpoint
          console.log('Falling back to legacy endpoint...');
          try {
            marksResponse = await api.get(ENDPOINTS.MARKS.LEGACY.CHECK, {
              params: {
                classId: selectedClass,
                subjectId: selectedSubject,
                examId: selectedExam
              }
            });
            console.log('Legacy marks response:', marksResponse.data);
          } catch (legacyError) {
            console.error('Error fetching marks from legacy API:', legacyError);
            // Create an empty response to avoid errors
            marksResponse = { data: { studentsWithMarks: [] } };
          }
        }

        // Get exam details to get academic year
        const examResponse = await api.get(`/api/exams/${selectedExam}`);

        const academicYearId = examResponse.data.academicYear;
        const examTypeId = examResponse.data.examType;

        // Filter for O-Level students only
        const oLevelStudents = studentsData.filter(student =>
          student.educationLevel === 'O_LEVEL' || !student.educationLevel
        );

        console.log('All students before filtering:', studentsData);
        console.log('O-Level students after filtering:', oLevelStudents);

        // Get student subject selections and determine if subject is core
        let subjectIsCoreSubject = true; // Default to true for safety
        let studentSubjectsMap = {};
        let studentsToUse = [];

        try {
          // Get student subject selections for this class
          const selections = await fetchStudentSubjectSelections(selectedClass);

          if (selections && selections.length > 0) {
            console.log(`Found ${selections.length} student subject selections`);

            // Create a map of student IDs to their selected subjects
            studentSubjectsMap = createStudentSubjectsMap(selections);
            console.log('Student subjects map:', studentSubjectsMap);

            // Check if the selected subject is a core subject
            try {
              console.log(`Checking if subject ${selectedSubject} is a core subject...`);
              const subjectResponse = await api.get(getEndpoint(ENDPOINTS.SUBJECTS.DETAILS, selectedSubject));
              console.log('Subject response:', subjectResponse.data);

              // Check if the subject has a type property
              if (subjectResponse.data && subjectResponse.data.type) {
                subjectIsCoreSubject = subjectResponse.data.type === 'CORE';
                console.log(`Subject ${selectedSubject} (${subjectResponse.data.name}) is ${subjectIsCoreSubject ? 'a CORE subject' : 'an OPTIONAL subject'}`);
              } else {
                // If no type property, check if we can find it in the subjects array
                const subjectFromList = subjects.find(s => s._id === selectedSubject);
                if (subjectFromList && subjectFromList.type) {
                  subjectIsCoreSubject = subjectFromList.type === 'CORE';
                  console.log(`Subject ${selectedSubject} (${subjectFromList.name}) is ${subjectIsCoreSubject ? 'a CORE subject' : 'an OPTIONAL subject'} (from subjects list)`);
                } else {
                  // Default to false for safety - only show students who have explicitly selected this subject
                  subjectIsCoreSubject = false;
                  console.log(`Could not determine subject type for ${selectedSubject}, assuming it is an OPTIONAL subject for safety`);
                }
              }
            } catch (subjectError) {
              console.error(`Error checking if subject ${selectedSubject} is a core subject:`, subjectError);
              // Default to false for safety - only show students who have explicitly selected this subject
              subjectIsCoreSubject = false;
              console.log('Error occurred, assuming subject is an OPTIONAL subject for safety');
            }

            // Filter students based on subject type
            studentsToUse = filterStudentsForSubject(oLevelStudents, selectedSubject, subjectIsCoreSubject, studentSubjectsMap);

            // Update the students state
            if (studentsToUse.length === 0) {
              console.log('No students found for this subject');

              // Get the subject name from the subjects array
              const subjectObj = subjects.find(s => s._id === selectedSubject);
              const subjectName = subjectObj ? subjectObj.name : selectedSubject;

              if (!subjectIsCoreSubject) {
                console.log('This is an optional subject, showing empty list with explanation');
                setStudents([]);
                // Show a more user-friendly error message
                setError(`No students are assigned to take ${subjectName} in this class. Please check subject assignments.`);
              } else {
                console.log('This is a core subject, showing all students as fallback');
                // For core subjects, we'll show all students as a fallback
                setStudents(oLevelStudents);
                setError(`Warning: No specific student assignments found for ${subjectName}, showing all students as fallback.`);
              }
            } else {
              console.log(`Setting students state with ${studentsToUse.length} students for subject ${selectedSubject}`);
              setStudents(studentsToUse);
              // Clear any previous error message
              setError('');
            }
          } else {
            console.log('No student subject selections found, showing all O-Level students');
            studentsToUse = oLevelStudents;
            setStudents(oLevelStudents);
          }
        } catch (selectionError) {
          console.error('Error filtering students by subject selection:', selectionError);
          studentsToUse = oLevelStudents;
          setStudents(oLevelStudents);
        }

        // Now initialize the marks array with the correct students
        const initialMarks = studentsToUse.map(student => {
          // Check if studentsWithMarks exists in the response
          const studentsWithMarks = marksResponse.data.studentsWithMarks || [];
          const existingMark = studentsWithMarks.find(mark =>
            mark.studentId === student._id
          );

          // Use the utility function to format student name consistently
          const studentName = formatStudentName(student);

          return {
            studentId: student._id,
            studentName,
            examId: selectedExam,
            academicYearId,
            examTypeId,
            subjectId: selectedSubject,
            classId: selectedClass,
            marksObtained: existingMark ? existingMark.marksObtained : '',
            grade: existingMark ? existingMark.grade : '',
            points: existingMark ? existingMark.points : '',
            comment: existingMark ? existingMark.comment : '',
            _id: existingMark ? (existingMark._id || existingMark.resultId) : null
          };
        });

        setMarks(initialMarks);
      } catch (error) {
        // Use our error handling utility to get a more specific error
        const handledError = handleApiError(error);

        // Log the error with context
        logError(handledError, {
          component: 'OLevelBulkMarksEntry',
          function: 'fetchStudents',
          classId: selectedClass,
          subjectId: selectedSubject,
          examId: selectedExam
        });

        // Set appropriate error message based on error type
        if (handledError.name === 'AuthorizationError') {
          setError('You are not authorized to access this data. Please contact an administrator.');
        } else if (handledError.name === 'ValidationError') {
          setError('Invalid data provided. Please check your selections and try again.');
        } else if (handledError.statusCode === 404) {
          setError('The requested data could not be found. Please check your selections.');
        } else {
          setError(handledError.message || 'Failed to fetch data. Please try again.');
        }

        // Clear any partial data that might have been loaded
        setStudents([]);
        setMarks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, selectedSubject, selectedExam]);

  // Handle class change
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
    setSelectedSubject('');
    setSelectedExam('');
    setMarks([]);
  };

  // Handle subject change
  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
    setMarks([]);
  };

  // Handle exam change
  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
    setMarks([]);
  };

  // Handle tab change
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  // Fix teacher-subject assignment
  const handleFixTeacherAssignment = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Get the current teacher's ID
      const profileResponse = await api.get('/api/teachers/profile/me');
      const teacherId = profileResponse.data._id;

      if (!teacherId) {
        setError('Could not determine your teacher ID. Please contact an administrator.');
        setLoading(false);
        return;
      }

      // Call the fix-teacher endpoint
      const response = await api.post('/api/fix-teacher/subject-assignment', {
        classId: selectedClass,
        subjectId: selectedSubject,
        teacherId
      });

      if (response.data.success) {
        setSuccess('Teacher-subject assignment fixed successfully. Please try saving marks again.');
        setSnackbar({
          open: true,
          message: 'Teacher-subject assignment fixed successfully',
          severity: 'success'
        });
      } else {
        setError(`Failed to fix teacher-subject assignment: ${response.data.message}`);
        setSnackbar({
          open: true,
          message: `Failed to fix teacher-subject assignment: ${response.data.message}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error fixing teacher-subject assignment:', error);
      setError('Failed to fix teacher-subject assignment. Please contact an administrator.');
      setSnackbar({
        open: true,
        message: 'Failed to fix teacher-subject assignment',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle mark change
  const handleMarkChange = (studentId, value) => {
    // Validate input (0-100)
    if (value !== '' && (Number.isNaN(Number(value)) || Number(value) < 0 || Number(value) > 100)) {
      return;
    }

    setMarks(prevMarks =>
      prevMarks.map(mark =>
        mark.studentId === studentId
          ? {
              ...mark,
              marksObtained: value,
              // Calculate grade and points immediately when marks are changed
              grade: value !== '' ? calculateGrade(Number(value)) : '',
              points: value !== '' ? calculatePoints(calculateGrade(Number(value))) : ''
            }
          : mark
      )
    );
  };

  // Handle comment change
  const handleCommentChange = (studentId, value) => {
    setMarks(prevMarks =>
      prevMarks.map(mark =>
        mark.studentId === studentId
          ? { ...mark, comment: value }
          : mark
      )
    );
  };

  // Calculate grade based on marks (O-Level grading system)
  const calculateGrade = (marks) => {
    if (marks === '' || marks === undefined) return '';
    // Using the standardized NECTA CSEE grading system
    if (marks >= 75) return 'A';
    if (marks >= 65) return 'B';
    if (marks >= 45) return 'C';
    if (marks >= 30) return 'D';
    return 'F';
  };

  // Calculate points based on grade (O-Level points system)
  const calculatePoints = (grade) => {
    if (!grade) return '';
    switch (grade) {
      case 'A': return 1;
      case 'B': return 2;
      case 'C': return 3;
      case 'D': return 4;
      case 'F': return 5;
      default: return '';
    }
  };

  // Save marks
  const handleSaveMarks = async () => {
    let marksToSave = [];
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Check if user is admin
      const isAdmin = teacherAuthService.isAdmin();

      // If not admin, verify authorization
      if (!isAdmin) {
        console.log('Save: Checking teacher authorization for class and subject');

        // Check if teacher is authorized for this class
        const isAuthorizedForClass = await teacherAuthService.isAuthorizedForClass(selectedClass);
        if (!isAuthorizedForClass) {
          throw new Error('You are not authorized to save marks for this class');
        }

        // Get the filtered subjects the teacher should have access to
        const authorizedSubjects = await teacherSubjectFilter.getTeacherFilteredSubjects(selectedClass);
        const isAuthorizedForSubject = authorizedSubjects.some(subject => subject._id === selectedSubject);

        if (!isAuthorizedForSubject) {
          throw new Error('You are not authorized to save marks for this subject');
        }

        console.log('Save: Teacher is authorized for class and subject');

        // Check if teacher is authorized for all students
        const assignedStudents = await teacherApi.getAssignedStudents(selectedClass);
        const assignedStudentIds = assignedStudents.map(student => student._id);

        // Check if any marks are for students not assigned to this teacher
        const unauthorizedMarks = marks.filter(mark =>
          mark.marksObtained !== '' && !assignedStudentIds.includes(mark.studentId)
        );

        if (unauthorizedMarks.length > 0) {
          console.log('Save: Unauthorized students detected:', unauthorizedMarks.map(m => m.studentName));
          throw new Error('You are not authorized to enter marks for some of these students');
        }

        console.log('Save: Teacher is authorized for all students');
      }

      // Calculate grades and points for marks
      const marksWithGrades = marks.map(mark => {
        if (mark.marksObtained === '') {
          return mark;
        }

        const grade = calculateGrade(Number(mark.marksObtained));
        const points = calculatePoints(grade);

        return {
          ...mark,
          grade,
          points
        };
      });

      // Filter out empty marks
      const marksToSave = marksWithGrades.filter(mark => mark.marksObtained !== '');

      // Validate marks before saving
      const validationErrors = [];
      marksToSave.forEach(mark => {
        const numMarks = Number(mark.marksObtained);
        if (isNaN(numMarks) || numMarks < 0 || numMarks > 100) {
          validationErrors.push(`Invalid marks for ${mark.studentName}: ${mark.marksObtained}`);
        }
      });

      if (validationErrors.length > 0) {
        setError(`Validation errors: ${validationErrors.join(', ')}`);
        setSaving(false);
        return;
      }

      if (marksToSave.length === 0) {
        setError('No marks to save. Please enter at least one mark.');
        setSaving(false);
        return;
      }

      // Save marks using the new standardized API
      await api.post(ENDPOINTS.MARKS.O_LEVEL.BATCH, marksToSave);

      // Refresh marks to get the latest data including IDs
      await handleRefresh();

      // Show success message
      setSuccess('Marks saved successfully.');
      setSnackbar({
        open: true,
        message: 'Marks saved successfully',
        severity: 'success'
      });
    } catch (error) {
      // Use our error handling utility to get a more specific error
      const handledError = handleApiError(error);

      // Log the error with context
      logError(handledError, {
        component: 'OLevelBulkMarksEntry',
        function: 'handleSaveMarks',
        classId: selectedClass,
        subjectId: selectedSubject,
        examId: selectedExam,
        marksCount: marksToSave.length
      });

      // Set appropriate error message based on error type
      let errorMessage = 'Failed to save marks. Please try again.';

      if (handledError.name === 'AuthorizationError') {
        errorMessage = 'You are not authorized to save marks for this class or subject.';
      } else if (handledError.name === 'ValidationError') {
        errorMessage = 'Invalid marks data. Please check your entries and try again.';
      } else if (handledError.statusCode === 404) {
        errorMessage = 'The class, subject, or exam could not be found. Please check your selections.';
      } else if (handledError.message) {
        errorMessage = handledError.message;
      }

      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    if (selectedClass && selectedSubject && selectedExam) {
      try {
        setLoading(true);
        setError('');

        // Get students in the class
        let studentsData;
        if (isAdmin) {
          // Admin can see all students in the class
          try {
            console.log('Refresh: Admin: Fetching students using /api/students/class endpoint');
            const studentsResponse = await api.get(`/api/students/class/${selectedClass}`);
            studentsData = studentsResponse.data || [];
            console.log(`Refresh: Admin: Found ${studentsData.length} students in class ${selectedClass}`);
          } catch (adminError) {
            console.error('Refresh: Admin: Error fetching students:', adminError);
            // Try alternative endpoint
            console.log('Refresh: Admin: Trying alternative endpoint /api/teachers/classes');
            try {
              const altResponse = await api.get(`/api/teachers/classes/${selectedClass}/students`);
              studentsData = altResponse.data || [];
              console.log(`Refresh: Admin: Found ${studentsData.length} students using alternative endpoint`);
            } catch (altError) {
              console.error('Refresh: Admin: Alternative endpoint also failed:', altError);
              throw new Error('Failed to fetch students. Please try again.');
            }
          }
        } else {
          // Teachers can only see assigned students
          try {
            console.log('Refresh: Teacher: Trying O-Level specific endpoint for students');
            // First try the O-Level specific endpoint
            const oLevelResponse = await api.get(getEndpoint(ENDPOINTS.TEACHER.ENHANCED.O_LEVEL.STUDENTS, selectedClass, selectedSubject));
            if (oLevelResponse.data && Array.isArray(oLevelResponse.data.students)) {
              console.log(`Refresh: Teacher: Found ${oLevelResponse.data.students.length} students using O-Level specific endpoint`);
              studentsData = oLevelResponse.data.students;
            } else {
              // Fall back to the regular endpoint
              console.log('Refresh: Teacher: O-Level specific endpoint returned invalid data, falling back to regular endpoint');
              try {
                const regularResponse = await api.get(`/api/teachers/classes/${selectedClass}/students`);
                studentsData = regularResponse.data || [];
                console.log(`Refresh: Teacher: Found ${studentsData.length} students using regular endpoint`);
              } catch (regularError) {
                console.error('Refresh: Teacher: Regular endpoint failed:', regularError);
                // Try another fallback
                console.log('Refresh: Teacher: Trying students/class endpoint as last resort');
                const lastResortResponse = await api.get(`/api/students/class/${selectedClass}`);
                studentsData = lastResortResponse.data || [];
                console.log(`Refresh: Teacher: Found ${studentsData.length} students using last resort endpoint`);
              }
            }
          } catch (oLevelError) {
            console.log('Refresh: Teacher: O-Level specific endpoint failed, falling back to regular endpoint', oLevelError);
            // Fall back to the regular endpoint
            try {
              const regularResponse = await api.get(`/api/teachers/classes/${selectedClass}/students`);
              studentsData = regularResponse.data || [];
              console.log(`Refresh: Teacher: Found ${studentsData.length} students using regular endpoint`);
            } catch (regularError) {
              console.error('Refresh: Teacher: Regular endpoint failed:', regularError);
              // Try another fallback
              console.log('Refresh: Teacher: Trying students/class endpoint as last resort');
              const lastResortResponse = await api.get(`/api/students/class/${selectedClass}`);
              studentsData = lastResortResponse.data || [];
              console.log(`Refresh: Teacher: Found ${studentsData.length} students using last resort endpoint`);
            }
          }
        }

        // Get existing marks for the selected class, subject, and exam using the new standardized API
        let marksResponse;
        try {
          console.log('Refresh: Fetching marks from standardized API endpoint...');
          marksResponse = await api.get('/api/o-level/marks/check', {
            params: {
              classId: selectedClass,
              subjectId: selectedSubject,
              examId: selectedExam
            }
          });
          console.log('Refresh - Marks response:', marksResponse.data);
          console.log('Refresh - Students with marks:', marksResponse.data.studentsWithMarks || []);
        } catch (marksError) {
          console.error('Refresh: Error fetching marks from standardized API:', marksError);
          // Fall back to the legacy endpoint
          console.log('Refresh: Falling back to legacy endpoint...');
          try {
            marksResponse = await api.get('/api/check-marks/check-existing', {
              params: {
                classId: selectedClass,
                subjectId: selectedSubject,
                examId: selectedExam
              }
            });
            console.log('Refresh: Legacy marks response:', marksResponse.data);
          } catch (legacyError) {
            console.error('Refresh: Error fetching marks from legacy API:', legacyError);
            // Create an empty response to avoid errors
            marksResponse = { data: { studentsWithMarks: [] } };
          }
        }

        // Get exam details to get academic year
        const examResponse = await api.get(`/api/exams/${selectedExam}`);

        const academicYearId = examResponse.data.academicYear;
        const examTypeId = examResponse.data.examType;

        // Filter for O-Level students only
        const oLevelStudents = studentsData.filter(student =>
          student.educationLevel === 'O_LEVEL' || !student.educationLevel
        );

        console.log('Refresh: All students before filtering:', studentsData);
        console.log('Refresh: O-Level students after filtering:', oLevelStudents);

        // Try to get student subject selections to filter students by subject
        try {
          // Get student subject selections for this class
          const selections = await fetchStudentSubjectSelections(selectedClass);

          if (selections && selections.length > 0) {
            console.log(`Refresh: Found ${selections.length} student subject selections`);

            // Create a map of student IDs to their selected subjects using our utility function
            const studentSubjectsMap = createStudentSubjectsMap(selections);

            console.log('Refresh: Student subjects map:', studentSubjectsMap);

            // Check if the selected subject is a core subject
            let subjectIsCoreSubject = false;
            try {
              console.log(`Refresh: Checking if subject ${selectedSubject} is a core subject...`);
              const subjectResponse = await api.get(`/api/subjects/${selectedSubject}`);
              console.log('Refresh: Subject response:', subjectResponse.data);

              // Check if the subject has a type property
              if (subjectResponse.data && subjectResponse.data.type) {
                subjectIsCoreSubject = subjectResponse.data.type === 'CORE';
                console.log(`Refresh: Subject ${selectedSubject} (${subjectResponse.data.name}) is ${subjectIsCoreSubject ? 'a CORE subject' : 'an OPTIONAL subject'}`);
              } else {
                // If no type property, check if we can find it in the subjects array
                const subjectFromList = subjects.find(s => s._id === selectedSubject);
                if (subjectFromList && subjectFromList.type) {
                  subjectIsCoreSubject = subjectFromList.type === 'CORE';
                  console.log(`Refresh: Subject ${selectedSubject} (${subjectFromList.name}) is ${subjectIsCoreSubject ? 'a CORE subject' : 'an OPTIONAL subject'} (from subjects list)`);
                } else {
                  // Default to false for safety - only show students who have explicitly selected this subject
                  subjectIsCoreSubject = false;
                  console.log(`Refresh: Could not determine subject type for ${selectedSubject}, assuming it is an OPTIONAL subject for safety`);
                }
              }
            } catch (subjectError) {
              console.error(`Refresh: Error checking if subject ${selectedSubject} is a core subject:`, subjectError);
              // Default to false for safety - only show students who have explicitly selected this subject
              subjectIsCoreSubject = false;
              console.log('Refresh: Error occurred, assuming subject is an OPTIONAL subject for safety');
            }

            // Use our centralized function to filter students based on subject type
            const filteredStudents = filterStudentsForSubject(oLevelStudents, selectedSubject, subjectIsCoreSubject, studentSubjectsMap);
            console.log(`Refresh: Filtered to ${filteredStudents.length} students who have selected subject ${selectedSubject}`);

            // Update the students state
            if (filteredStudents.length === 0) {
              console.log('Refresh: No students found for this subject');

              // Get the subject name from the subjects array
              const subjectObj = subjects.find(s => s._id === selectedSubject);
              const subjectName = subjectObj ? subjectObj.name : selectedSubject;

              if (!subjectIsCoreSubject) {
                console.log('Refresh: This is an optional subject, showing empty list with explanation');
                setStudents([]);
                // Show a more user-friendly error message
                setError(`No students are assigned to take ${subjectName} in this class. Please check subject assignments.`);
              } else {
                console.log('Refresh: This is a core subject, showing all students as fallback');
                // For core subjects, we'll show all students as a fallback
                setStudents(oLevelStudents);
                setError(`Warning: No specific student assignments found for ${subjectName}, showing all students as fallback.`);
              }
            } else {
              console.log(`Refresh: Setting students state with ${filteredStudents.length} students for subject ${selectedSubject}`);
              setStudents(filteredStudents);
              // Clear any previous error message
              setError('');
            }
          } else {
            console.log('Refresh: No student subject selections found, showing all O-Level students');
            setStudents(oLevelStudents);
          }
        } catch (selectionError) {
          console.error('Refresh: Error filtering students by subject selection:', selectionError);
          setStudents(oLevelStudents);
        }

        // Initialize marks array with existing marks
        // We need to use the same filtered list for both UI display and marks array
        // Instead of re-filtering, we'll use the students state that was already filtered

        // Use the current students state which has already been filtered correctly
        // This ensures we only create mark entries for students who should see this subject
        let studentsToUse = [];
        let studentSubjectsMap = {};

        try {
          // Try to get student subject selections again if needed
          const selections = await fetchStudentSubjectSelections(selectedClass);
          // Create a map of student IDs to their selected subjects - use our utility function
          studentSubjectsMap = createStudentSubjectsMap(selections);
        } catch (error) {
          console.error('Error getting student subject selections for marks array:', error);
          // Continue with empty map if there's an error
        }

        // Use our centralized function to filter students based on subject type
        studentsToUse = filterStudentsForSubject(oLevelStudents, selectedSubject, subjectIsCoreSubject, studentSubjectsMap);
        console.log(`Refresh: Using ${studentsToUse.length} filtered students for marks array`);

        // Now initialize the marks array with the correct students
        const initialMarks = studentsToUse.map(student => {
          // Check if studentsWithMarks exists in the response
          const studentsWithMarks = marksResponse.data.studentsWithMarks || [];
          const existingMark = studentsWithMarks.find(mark =>
            mark.studentId === student._id
          );

          // Use the utility function to format student name consistently
          const studentName = formatStudentName(student);

          return {
            studentId: student._id,
            studentName,
            examId: selectedExam,
            academicYearId,
            examTypeId,
            subjectId: selectedSubject,
            classId: selectedClass,
            marksObtained: existingMark ? existingMark.marksObtained : '',
            grade: existingMark ? existingMark.grade : '',
            points: existingMark ? existingMark.points : '',
            comment: existingMark ? existingMark.comment : '',
            _id: existingMark ? (existingMark._id || existingMark.resultId) : null
          };
        });

        setMarks(initialMarks);
        setActiveTab(0);
      } catch (error) {
        console.error('Error refreshing data:', error);
        setError('Failed to refresh data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle go back
  const handleGoBack = () => {
    navigate(-1);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleGoBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            O-Level Bulk Marks Entry
          </Typography>
        </Box>

        {selectedSubject && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            onClick={() => navigate(`/marks-history/subject/${selectedSubject}?model=OLevelResult`)}
          >
            View Marks History
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Class, Exam, and Subject
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={handleClassChange}
                label="Class"
                disabled={loading}
              >
                {Array.isArray(classes) && classes.map((classItem) => (
                  <MenuItem key={classItem._id} value={classItem._id}>
                    {classItem.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Exam</InputLabel>
              <Select
                value={selectedExam}
                onChange={handleExamChange}
                label="Exam"
                disabled={!selectedClass || loading}
              >
                {Array.isArray(exams) && exams.map((exam) => (
                  <MenuItem key={exam._id} value={exam._id}>
                    {exam.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                onChange={handleSubjectChange}
                label="Subject"
                disabled={!selectedClass || loading}
              >
                {Array.isArray(subjects) && subjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {selectedSubject && (
        <>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Enter Marks" />
              <Tab label="View Grades" />
            </Tabs>

            <Box sx={{ p: 2 }}>
              {activeTab === 0 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Enter Marks for {students.length} Students
                    </Typography>
                    <Box>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveMarks}
                        disabled={saving || loading}
                        sx={{ mr: 1 }}
                      >
                        {saving ? 'Saving...' : 'Save Marks'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                        disabled={saving || loading}
                        sx={{ mr: 1 }}
                      >
                        Refresh
                      </Button>
                      {error && error.includes('not authorized') && (
                        <Button
                          variant="outlined"
                          color="secondary"
                          startIcon={<CheckIcon />}
                          onClick={handleFixTeacherAssignment}
                          disabled={saving || loading}
                        >
                          Fix Teacher Assignment
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width="5%">#</TableCell>
                          <TableCell width="30%">Student Name</TableCell>
                          <TableCell width="25%">Marks (0-100)</TableCell>
                          <TableCell width="25%">Comment</TableCell>
                          <TableCell width="10%">Status</TableCell>
                          <TableCell width="5%">History</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {marks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              {students.length === 0 && selectedSubject ? (
                                <Typography color="error">
                                  No students are assigned to take this subject. Please check subject assignments.
                                </Typography>
                              ) : (
                                `Enter Marks for ${students.length} Students`
                              )}
                            </TableCell>
                          </TableRow>
                        ) : (
                          marks.map((mark, index) => (
                            <TableRow key={mark.studentId}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{mark.studentName}</TableCell>
                              <TableCell>
                                <TextField
                                  type="text"
                                  value={mark.marksObtained}
                                  onChange={(e) => handleMarkChange(mark.studentId, e.target.value)}
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  inputProps={{
                                    min: 0,
                                    max: 100,
                                    step: 0.5
                                  }}
                                  disabled={saving}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  type="text"
                                  value={mark.comment}
                                  onChange={(e) => handleCommentChange(mark.studentId, e.target.value)}
                                  variant="outlined"
                                  size="small"
                                  fullWidth
                                  disabled={saving}
                                />
                              </TableCell>
                              <TableCell>
                                {mark._id ? (
                                  <Chip
                                    icon={<CheckIcon />}
                                    label="Saved"
                                    color="success"
                                    size="small"
                                  />
                                ) : mark.marksObtained ? (
                                  <Chip
                                    icon={<WarningIcon />}
                                    label="Unsaved"
                                    color="warning"
                                    size="small"
                                  />
                                ) : null}
                              </TableCell>
                              <TableCell>
                                {mark._id && (
                                  <Tooltip title="View mark history">
                                    <IconButton
                                      size="small"
                                      onClick={() => navigate(`/marks-history/result/${mark._id}?model=OLevelResult`)}
                                    >
                                      <HistoryIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          )))
                        }
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {activeTab === 1 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Grades and Points
                    </Typography>
                    <Tooltip title="O-Level Grading: A (75-100%), B (65-74%), C (45-64%), D (30-44%), F (0-29%)">
                      <IconButton>
                        <HelpIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width="5%">#</TableCell>
                          <TableCell width="40%">Student Name</TableCell>
                          <TableCell width="15%" align="center">Marks</TableCell>
                          <TableCell width="15%" align="center">Grade</TableCell>
                          <TableCell width="15%" align="center">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {marks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              {students.length === 0 && selectedSubject ? (
                                <Typography color="error">
                                  No students are assigned to take this subject. Please check subject assignments.
                                </Typography>
                              ) : (
                                `No marks entered for ${students.length} students`
                              )}
                            </TableCell>
                          </TableRow>
                        ) : (
                          marks.map((mark, index) => {
                            // Calculate grade and points for display
                            const grade = mark.marksObtained
                              ? (mark.grade || calculateGrade(Number(mark.marksObtained)))
                              : '';
                            const points = grade
                              ? (mark.points || calculatePoints(grade))
                              : '';

                            return (
                              <TableRow key={mark.studentId}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{mark.studentName}</TableCell>
                                <TableCell align="center">{mark.marksObtained || '-'}</TableCell>
                                <TableCell align="center">
                                  {grade ? (
                                    <Chip
                                      label={grade}
                                      color={
                                        grade === 'A' ? 'success' :
                                        grade === 'B' ? 'success' :
                                        grade === 'C' ? 'primary' :
                                        grade === 'D' ? 'warning' : 'error'
                                      }
                                      size="small"
                                    />
                                  ) : '-'}
                                </TableCell>
                                <TableCell align="center">{points || '-'}</TableCell>
                              </TableRow>
                            );
                          }))
                        }
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveMarks}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save All Marks'}
            </Button>
          </Box>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OLevelBulkMarksEntry;
