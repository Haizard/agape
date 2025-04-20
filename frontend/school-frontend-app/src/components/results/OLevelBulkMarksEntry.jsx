import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import teacherAuthService from '../../services/teacherAuthService';
import teacherApi from '../../services/teacherApi';
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
          const response = await api.get(`/api/enhanced-teacher/o-level/classes/${selectedClass}/subjects`);
          subjectsData = response.data.subjects || [];
        } else {
          // Teachers can only see assigned subjects
          // Use enhanced API endpoint that respects student subject selections
          try {
            const response = await api.get(`/api/enhanced-teacher/o-level/classes/${selectedClass}/subjects`);
            subjectsData = response.data.subjects || [];
          } catch (error) {
            console.error('Error fetching subjects with enhanced API:', error);
            // Fall back to regular API
            subjectsData = await teacherApi.getAssignedSubjects(selectedClass);
          }
        }

        // Filter for O-Level subjects only
        const oLevelSubjects = subjectsData.filter(subject =>
          subject.educationLevel === 'O_LEVEL' || subject.educationLevel === 'BOTH' || !subject.educationLevel
        );

        console.log('All subjects before filtering:', subjectsData);
        console.log('O-Level subjects after filtering:', oLevelSubjects);

        // If we have no O-Level subjects, try to fetch them directly
        if (oLevelSubjects.length === 0) {
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
        console.error('Error fetching subjects:', error);
        // Provide more specific error message
        if (error.response && error.response.status === 404) {
          setError('Teacher profile not found. Please contact an administrator to set up your teacher profile.');
        } else if (error.response && error.response.status === 403) {
          setError('You are not authorized to access subjects in this class. Please contact an administrator.');
        } else if (error.response && error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError('Failed to fetch subjects. Please try again.');
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
      const response = await api.get(`/api/student-subject-selections/class/${classId}`);
      console.log('Student subject selections:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching student subject selections:', error);
      return [];
    }
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
          // For O-Level classes, we'll be more permissive
          const classInfo = classes.find(c => c._id === selectedClass);
          const isOLevel = classInfo && (classInfo.educationLevel === 'O_LEVEL' || classInfo.educationLevel === 'O Level');

          if (!isOLevel) {
            // For A-Level, check strict authorization
            console.log('A-Level class detected, checking strict authorization');
            // Check if teacher is authorized for this class and subject
            const isAuthorizedForClass = await teacherAuthService.isAuthorizedForClass(selectedClass);
            const isAuthorizedForSubject = await teacherAuthService.isAuthorizedForSubject(selectedClass, selectedSubject);

            if (!isAuthorizedForClass || !isAuthorizedForSubject) {
              setError('You are not authorized to view marks for this class or subject');
              setLoading(false);
              return;
            }
          } else {
            console.log('O-Level class detected, using permissive authorization');
          }
        }

        // Get students in the class
        let studentsData;
        if (isAdmin) {
          // Admin can see all students in the class
          const studentsResponse = await api.get(`/api/classes/${selectedClass}/students`);
          studentsData = studentsResponse.data || [];
        } else {
          // Teachers can only see assigned students
          try {
            console.log('Trying O-Level specific endpoint for students');
            // First try the O-Level specific endpoint
            const oLevelResponse = await api.get(`/api/enhanced-teachers/o-level/classes/${selectedClass}/subjects/any/students`);
            if (oLevelResponse.data && Array.isArray(oLevelResponse.data.students)) {
              console.log(`Found ${oLevelResponse.data.students.length} students using O-Level specific endpoint`);
              studentsData = oLevelResponse.data.students;
            } else {
              // Fall back to the regular endpoint
              console.log('O-Level specific endpoint returned invalid data, falling back to regular endpoint');
              studentsData = await teacherApi.getAssignedStudents(selectedClass);
            }
          } catch (oLevelError) {
            console.log('O-Level specific endpoint failed, falling back to regular endpoint', oLevelError);
            // Fall back to the regular endpoint
            studentsData = await teacherApi.getAssignedStudents(selectedClass);
          }
        }

        // Get existing marks for the selected class, subject, and exam using the new standardized API
        let marksResponse;
        try {
          console.log('Fetching marks from standardized API endpoint...');
          marksResponse = await api.get('/api/o-level/marks/check', {
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
            marksResponse = await api.get('/api/check-marks/check-existing', {
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

        // Try to get student subject selections to filter students by subject
        try {
          // Get student subject selections for this class
          const selections = await fetchStudentSubjectSelections(selectedClass);

          if (selections && selections.length > 0) {
            console.log(`Found ${selections.length} student subject selections`);

            // Create a map of student IDs to their selected subjects
            const studentSubjectsMap = {};
            selections.forEach(selection => {
              if (selection.student) {
                const studentId = typeof selection.student === 'object' ? selection.student._id : selection.student;

                // Combine core and optional subjects
                const allSubjects = [
                  ...(selection.coreSubjects || []).map(s => typeof s === 'object' ? s._id : s),
                  ...(selection.optionalSubjects || []).map(s => typeof s === 'object' ? s._id : s)
                ];

                studentSubjectsMap[studentId] = allSubjects;
              }
            });

            console.log('Student subjects map:', studentSubjectsMap);

            // Check if the selected subject is a core subject
            let isCoreSubject = false;
            try {
              console.log(`Checking if subject ${selectedSubject} is a core subject...`);
              const subjectResponse = await api.get(`/api/subjects/${selectedSubject}`);
              console.log('Subject response:', subjectResponse.data);
              isCoreSubject = subjectResponse.data.type === 'CORE';
              console.log(`Subject ${selectedSubject} is ${isCoreSubject ? 'a core subject' : 'not a core subject'}`);
            } catch (subjectError) {
              console.error(`Error checking if subject ${selectedSubject} is a core subject:`, subjectError);
              // Assume it's a core subject if we can't determine
              isCoreSubject = true;
              console.log('Assuming subject is a core subject due to error');
            }

            if (isCoreSubject) {
              console.log('Selected subject is a core subject, showing all O-Level students');
              setStudents(oLevelStudents);
            } else {
              // Filter students who have selected this subject
              const filteredStudents = oLevelStudents.filter(student => {
                const studentId = student._id;
                const studentSubjects = studentSubjectsMap[studentId] || [];
                return studentSubjects.includes(selectedSubject);
              });

              console.log(`Filtered to ${filteredStudents.length} students who have selected subject ${selectedSubject}`);

              // If no students are found after filtering, just show all O-Level students
              if (filteredStudents.length === 0) {
                console.log('No students found after filtering by subject selection, showing all O-Level students');
                setStudents(oLevelStudents);
              } else {
                setStudents(filteredStudents);
              }
            }
          } else {
            console.log('No student subject selections found, showing all O-Level students');
            setStudents(oLevelStudents);
          }
        } catch (selectionError) {
          console.error('Error filtering students by subject selection:', selectionError);
          setStudents(oLevelStudents);
        }

        // Initialize marks array with existing marks
        const initialMarks = oLevelStudents.map(student => {
          // Check if studentsWithMarks exists in the response
          const studentsWithMarks = marksResponse.data.studentsWithMarks || [];
          const existingMark = studentsWithMarks.find(mark =>
            mark.studentId === student._id
          );

          // Handle different student name formats
          let studentName = '';
          if (student.name) {
            // If the student has a name property, use it
            studentName = student.name;
          } else if (student.studentName) {
            // If the student already has a studentName property, use it
            studentName = student.studentName;
          } else if (student.firstName || student.lastName) {
            // If the student has firstName and lastName properties, combine them
            studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
          } else {
            // Fallback to a default name
            studentName = `Student ${student._id}`;
          }

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
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again.');
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
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Check if user is admin
      const isAdmin = teacherAuthService.isAdmin();

      // If not admin, verify authorization
      if (!isAdmin) {
        // For O-Level classes, we'll be more permissive
        const classInfo = classes.find(c => c._id === selectedClass);
        const isOLevel = classInfo && (classInfo.educationLevel === 'O_LEVEL' || classInfo.educationLevel === 'O Level');

        if (!isOLevel) {
          // For A-Level, check strict authorization
          console.log('Save: A-Level class detected, checking strict authorization');
          // Check if teacher is authorized for this class and subject
          const isAuthorizedForClass = await teacherAuthService.isAuthorizedForClass(selectedClass);
          const isAuthorizedForSubject = await teacherAuthService.isAuthorizedForSubject(selectedClass, selectedSubject);

          if (!isAuthorizedForClass || !isAuthorizedForSubject) {
            throw new Error('You are not authorized to save marks for this class or subject');
          }

          // Check if teacher is authorized for all students
          const assignedStudents = await teacherApi.getAssignedStudents(selectedClass);
          const assignedStudentIds = assignedStudents.map(student => student._id);

          // Check if any marks are for students not assigned to this teacher
          const unauthorizedMarks = marks.filter(mark =>
            mark.marksObtained !== '' && !assignedStudentIds.includes(mark.studentId)
          );

          if (unauthorizedMarks.length > 0) {
            throw new Error('You are not authorized to enter marks for some of these students');
          }
        } else {
          console.log('Save: O-Level class detected, using permissive authorization');
        }
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
      marksToSave.forEach((mark, index) => {
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
      await api.post('/api/o-level/marks/batch', marksToSave);

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
      console.error('Error saving marks:', error);
      setError(`Failed to save marks: ${error.response?.data?.message || error.message}`);
      setSnackbar({
        open: true,
        message: `Failed to save marks: ${error.response?.data?.message || error.message}`,
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
          const studentsResponse = await api.get(`/api/classes/${selectedClass}/students`);
          studentsData = studentsResponse.data || [];
        } else {
          // Teachers can only see assigned students
          try {
            console.log('Refresh: Trying O-Level specific endpoint for students');
            // First try the O-Level specific endpoint
            const oLevelResponse = await api.get(`/api/enhanced-teachers/o-level/classes/${selectedClass}/subjects/any/students`);
            if (oLevelResponse.data && Array.isArray(oLevelResponse.data.students)) {
              console.log(`Refresh: Found ${oLevelResponse.data.students.length} students using O-Level specific endpoint`);
              studentsData = oLevelResponse.data.students;
            } else {
              // Fall back to the regular endpoint
              console.log('Refresh: O-Level specific endpoint returned invalid data, falling back to regular endpoint');
              studentsData = await teacherApi.getAssignedStudents(selectedClass);
            }
          } catch (oLevelError) {
            console.log('Refresh: O-Level specific endpoint failed, falling back to regular endpoint', oLevelError);
            // Fall back to the regular endpoint
            studentsData = await teacherApi.getAssignedStudents(selectedClass);
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

            // Create a map of student IDs to their selected subjects
            const studentSubjectsMap = {};
            selections.forEach(selection => {
              if (selection.student) {
                const studentId = typeof selection.student === 'object' ? selection.student._id : selection.student;

                // Combine core and optional subjects
                const allSubjects = [
                  ...(selection.coreSubjects || []).map(s => typeof s === 'object' ? s._id : s),
                  ...(selection.optionalSubjects || []).map(s => typeof s === 'object' ? s._id : s)
                ];

                studentSubjectsMap[studentId] = allSubjects;
              }
            });

            console.log('Refresh: Student subjects map:', studentSubjectsMap);

            // Check if the selected subject is a core subject
            let isCoreSubject = false;
            try {
              console.log(`Refresh: Checking if subject ${selectedSubject} is a core subject...`);
              const subjectResponse = await api.get(`/api/subjects/${selectedSubject}`);
              console.log('Refresh: Subject response:', subjectResponse.data);
              isCoreSubject = subjectResponse.data.type === 'CORE';
              console.log(`Refresh: Subject ${selectedSubject} is ${isCoreSubject ? 'a core subject' : 'not a core subject'}`);
            } catch (subjectError) {
              console.error(`Refresh: Error checking if subject ${selectedSubject} is a core subject:`, subjectError);
              // Assume it's a core subject if we can't determine
              isCoreSubject = true;
              console.log('Refresh: Assuming subject is a core subject due to error');
            }

            if (isCoreSubject) {
              console.log('Refresh: Selected subject is a core subject, showing all O-Level students');
              setStudents(oLevelStudents);
            } else {
              // Filter students who have selected this subject
              const filteredStudents = oLevelStudents.filter(student => {
                const studentId = student._id;
                const studentSubjects = studentSubjectsMap[studentId] || [];
                return studentSubjects.includes(selectedSubject);
              });

              console.log(`Refresh: Filtered to ${filteredStudents.length} students who have selected subject ${selectedSubject}`);

              // If no students are found after filtering, just show all O-Level students
              if (filteredStudents.length === 0) {
                console.log('Refresh: No students found after filtering by subject selection, showing all O-Level students');
                setStudents(oLevelStudents);
              } else {
                setStudents(filteredStudents);
              }
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
        const initialMarks = oLevelStudents.map(student => {
          // Check if studentsWithMarks exists in the response
          const studentsWithMarks = marksResponse.data.studentsWithMarks || [];
          const existingMark = studentsWithMarks.find(mark =>
            mark.studentId === student._id
          );

          // Handle different student name formats
          let studentName = '';
          if (student.name) {
            // If the student has a name property, use it
            studentName = student.name;
          } else if (student.studentName) {
            // If the student already has a studentName property, use it
            studentName = student.studentName;
          } else if (student.firstName || student.lastName) {
            // If the student has firstName and lastName properties, combine them
            studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
          } else {
            // Fallback to a default name
            studentName = `Student ${student._id}`;
          }

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
                        disabled={saving}
                        sx={{ mr: 1 }}
                      >
                        {saving ? 'Saving...' : 'Save Marks'}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                        disabled={saving}
                      >
                        Refresh
                      </Button>
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
                        {Array.isArray(marks) && marks.map((mark, index) => (
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
                        ))}
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
                        {Array.isArray(marks) && marks.map((mark, index) => {
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
                        })}
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
