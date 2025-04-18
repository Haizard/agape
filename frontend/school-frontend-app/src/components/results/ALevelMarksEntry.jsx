import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import PreviewDialog from '../common/PreviewDialog';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import api from '../../utils/api';
import teacherAuthService from '../../services/teacherAuthService';
import teacherApi from '../../services/teacherApi';
import studentSubjectsApi from '../../services/studentSubjectsApi';

/**
 * A-Level Marks Entry Component
 * A simple component for entering A-Level marks for testing purposes
 */
const ALevelMarksEntry = () => {
  // Navigation hook
  const navigate = useNavigate();

  // State variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [marks, setMarks] = useState('');
  const [comment, setComment] = useState('');
  const [isPrincipal, setIsPrincipal] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Monitor preview dialog state
  useEffect(() => {
    console.log('previewOpen state changed:', previewOpen);
  }, [previewOpen]);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchStudentsByClass(selectedClass);
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  // Fetch subjects when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchSubjectsByClass(selectedClass);
    } else {
      setSubjects([]);
    }
  }, [selectedClass]);

  // Fetch initial data (classes, exams)
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Check if user is admin
      const isAdmin = teacherAuthService.isAdmin();

      let classesData;
      if (isAdmin) {
        // Admin can see all classes
        const classesRes = await api.get('/api/classes');
        classesData = classesRes.data || [];
      } else {
        // Teachers can only see assigned classes
        classesData = await teacherApi.getAssignedClasses();
      }

      // Get exams
      const examsRes = await api.get('/api/exams');

      // Filter for A-Level classes
      const aLevelClasses = classesData.filter(cls => cls.educationLevel === 'A_LEVEL');

      // Log the classes for debugging
      console.log(`Found ${aLevelClasses.length} A-Level classes out of ${classesData.length} total classes`);

      // If no A-Level classes found, show a message
      if (aLevelClasses.length === 0 && classesData.length > 0) {
        console.log('No A-Level classes found, but found other classes');
        setError('No A-Level classes found. Please contact an administrator to assign you to A-Level classes.');
      } else if (classesData.length === 0) {
        console.log('No classes found at all');
        setError('No classes found. Please contact an administrator to assign you to classes.');
      }

      setClasses(aLevelClasses);
      setExams(examsRes.data || []);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch students by class
  const fetchStudentsByClass = async (classId) => {
    setLoading(true);
    try {
      // Check if user is admin
      const isAdmin = teacherAuthService.isAdmin();

      let studentsData;
      if (isAdmin) {
        // Admin can see all students in the class
        const response = await api.get(`/api/students/class/${classId}`);
        studentsData = response.data || [];
      } else {
        try {
          // Teachers can only see assigned students
          studentsData = await teacherApi.getAssignedStudents(classId);

          // Get the teacher's assigned subjects for this class
          const teacherSubjects = await teacherApi.getAssignedSubjects(classId);
          console.log(`Teacher has ${teacherSubjects.length} assigned subjects in this class`);

          if (teacherSubjects.length > 0) {
            // Filter students to only include those who have the teacher's subjects in their combination
            const teacherSubjectIds = teacherSubjects.map(subject => subject._id);
            console.log('Teacher subject IDs:', teacherSubjectIds);

            // We'll filter the students later after processing their combinations
          }
        } catch (teacherError) {
          console.error('Error fetching assigned students:', teacherError);

          // Handle 403/401 errors gracefully without logging out
          if (teacherError.response && (teacherError.response.status === 403 || teacherError.response.status === 401)) {
            console.log('Teacher is not authorized for this class');
            setError('You are not authorized to teach in this class. Please contact an administrator.');
            setLoading(false);
            return; // Exit early if unauthorized
          }

          // If the teacher-specific endpoint fails for other reasons, try the general endpoint
          console.log('Falling back to general students endpoint');
          const response = await api.get(`/api/students/class/${classId}`);
          studentsData = response.data || [];
        }
      }

      // Process all A-Level students to ensure they have properly populated subject combinations
      const aLevelStudentsWithCombinations = studentsData.filter(student =>
        (student.educationLevel === 'A_LEVEL' || student.form === 5 || student.form === 6) &&
        student.subjectCombination
      );

      console.log(`Found ${aLevelStudentsWithCombinations.length} A-Level students with combinations in class ${classId}`);

      // Process each A-Level student with a combination
      for (const student of aLevelStudentsWithCombinations) {
        // Check if student has a subject combination
        if (student.subjectCombination) {
          // Check if the combination is fully populated
          const isPopulated = typeof student.subjectCombination === 'object' &&
                            student.subjectCombination.subjects &&
                            Array.isArray(student.subjectCombination.subjects);

          if (!isPopulated) {
            try {
              // Get the combination ID
              const combinationId = typeof student.subjectCombination === 'object' ?
                student.subjectCombination._id : student.subjectCombination;

              console.log(`Fetching subject combination ${combinationId} for student ${student._id}`);

              // Fetch the full combination details
              const response = await api.get(`/api/subject-combinations/${combinationId}`);
              const fullCombination = response.data;

              // Update the student's subject combination
              student.subjectCombination = fullCombination;
              console.log(`Updated subject combination for student ${student._id}`);

              // Log the combination details
              if (fullCombination.subjects && fullCombination.subjects.length > 0) {
                console.log(`Principal subjects: ${fullCombination.subjects.map(s => s.name || s.code).join(', ')}`);
              }

              if (fullCombination.compulsorySubjects && fullCombination.compulsorySubjects.length > 0) {
                console.log(`Subsidiary subjects: ${fullCombination.compulsorySubjects.map(s => s.name || s.code).join(', ')}`);
              }
            } catch (error) {
              console.error(`Error fetching subject combination for student ${student._id}:`, error);
            }
          } else {
            // Log the combination details for debugging
            console.log(`Student ${student._id} already has populated combination: ${student.subjectCombination.name || student.subjectCombination._id}`);

            if (student.subjectCombination.subjects && student.subjectCombination.subjects.length > 0) {
              console.log(`Principal subjects: ${student.subjectCombination.subjects.map(s => s.name || s.code).join(', ')}`);
            }

            if (student.subjectCombination.compulsorySubjects && student.subjectCombination.compulsorySubjects.length > 0) {
              console.log(`Subsidiary subjects: ${student.subjectCombination.compulsorySubjects.map(s => s.name || s.code).join(', ')}`);
            }
          }
        } else {
          console.log(`Student ${student._id} has no subject combination assigned`);
        }
      }

      // Log raw student data for debugging
      console.log('Raw student data:', studentsData.slice(0, 3));

      // Log subject combination details for debugging
      const studentsWithCombinations = studentsData.filter(student => student.subjectCombination);
      console.log(`Found ${studentsWithCombinations.length} students with subject combinations out of ${studentsData.length} total students`);

      if (studentsWithCombinations.length > 0) {
        const sampleStudent = studentsWithCombinations[0];
        console.log('Sample student with combination:', {
          studentName: `${sampleStudent.firstName} ${sampleStudent.lastName}`,
          combinationId: sampleStudent.subjectCombination._id || sampleStudent.subjectCombination,
          combinationDetails: sampleStudent.subjectCombination
        });
      }

      // Check if the class is an A-Level class (Form 5 or Form 6)
      const selectedClassObj = classes.find(cls => cls._id === classId);

      // Check if the class name contains 'FORM V' or 'FORM VI' (special case for this school)
      const hasALevelName = selectedClassObj?.name && (
        selectedClassObj.name.toUpperCase().includes('FORM V') ||
        selectedClassObj.name.toUpperCase().includes('FORM VI')
      );

      // Enhanced A-Level class detection
      let isALevelClass = selectedClassObj && (
        // Check form property
        selectedClassObj.form === 5 ||
        selectedClassObj.form === 6 ||
        selectedClassObj.educationLevel === 'A_LEVEL' ||
        // Check name for various formats (case insensitive)
        (selectedClassObj.name && (
          selectedClassObj.name.toUpperCase().includes('FORM 5') ||
          selectedClassObj.name.toUpperCase().includes('FORM 6') ||
          selectedClassObj.name.toUpperCase().includes('FORM V') ||
          selectedClassObj.name.toUpperCase().includes('FORM VI') ||
          selectedClassObj.name.toUpperCase().includes('F5') ||
          selectedClassObj.name.toUpperCase().includes('F6') ||
          selectedClassObj.name.toUpperCase().includes('FV') ||
          selectedClassObj.name.toUpperCase().includes('FVI') ||
          // Check for A-Level indicators
          selectedClassObj.name.toUpperCase().includes('A-LEVEL') ||
          selectedClassObj.name.toUpperCase().includes('A LEVEL')
        ))
      );

      // Force A-Level class for testing if the class name contains 'FORM V' or 'FORM VI'
      if (hasALevelName) {
        console.log(`Class ${selectedClassObj.name} is recognized as an A-Level class by name`);
        console.log(`Forcing class ${selectedClassObj.name} to be recognized as an A-Level class`);
        isALevelClass = true;
      }

      console.log(`Class ${classId} is ${isALevelClass ? 'an A-Level' : 'not an A-Level'} class:`,
        selectedClassObj?.name,
        `Form: ${selectedClassObj?.form}`);

      // Filter for A-Level students by educationLevel OR form level (5 or 6) OR being in an A-Level class
      const aLevelStudents = studentsData.filter(student => {
        // Check if student is explicitly marked as A_LEVEL
        const isALevel = student.educationLevel === 'A_LEVEL';

        // Check if student is in Form 5 or 6 (A-Level forms)
        // Handle both number and string representations of form
        const isFormFiveOrSix =
          student.form === 5 || student.form === 6 ||
          student.form === '5' || student.form === '6' ||
          (typeof student.form === 'string' &&
            (student.form.includes('Form 5') ||
             student.form.includes('Form 6') ||
             student.form.includes('Form V') ||
             student.form.includes('Form VI')));

        // Determine if this is an A-Level student
        const isALevelStudent = isALevel || isFormFiveOrSix;

        // If the class is an A-Level class, only include A-Level students
        if (isALevelClass) {
          if (isALevelStudent) {
            console.log(`Student ${student.firstName} ${student.lastName} is an A-Level student in an A-Level class`);
            return true;
          }
          console.log(`Student ${student.firstName} ${student.lastName} is not an A-Level student but is in an A-Level class, excluding`);
          return false;
        }

        // For debugging
        if (isFormFiveOrSix && !isALevel) {
          console.log(`Student in Form ${student.form} but not marked as A_LEVEL:`,
            student.firstName, student.lastName, student.educationLevel);
        }

        // Return true if either condition is met
        return isALevelStudent;
      });

      // Log the students for debugging
      console.log(`Found ${aLevelStudents.length} A-Level students out of ${studentsData.length} total students`);

      // The backend now handles filtering students by teacher's subjects
      // We don't need to filter again on the frontend
      const filteredStudents = aLevelStudents;

      // Log the number of students for debugging
      console.log(`Using ${filteredStudents.length} A-Level students returned by the API`);

      // If there are no students, check if it's because the teacher is not assigned to this class
      if (filteredStudents.length === 0 && !isAdmin) {
        // Get the teacher's assigned subjects for this class to check if they're assigned
        try {
          const teacherSubjects = await teacherApi.getAssignedSubjects(classId);
          if (teacherSubjects.length === 0) {
            console.log('Teacher has no assigned subjects in this class');
            setError('You are not assigned to teach any subjects in this class. Please contact an administrator.');
          }
        } catch (error) {
          console.error('Error checking teacher subjects:', error);
        }
      }

      // If no A-Level students found, show a message
      if (filteredStudents.length === 0 && studentsData.length > 0) {
        console.log('No A-Level students found for this teacher');
        setError('No A-Level students found for this teacher in this class.');
      } else if (studentsData.length === 0) {
        console.log('No students found at all');
        setError('No students found in this class.');
      }

      setStudents(filteredStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects by class
  const fetchSubjectsByClass = async (classId) => {
    setLoading(true);
    try {
      // Check if user is admin
      const isAdmin = teacherAuthService.isAdmin();

      let classSubjects = [];
      if (isAdmin) {
        // Admin can see all subjects in the class
        const response = await api.get(`/api/classes/${classId}`);
        const classData = response.data;

        if (classData.subjects && classData.subjects.length > 0) {
          // Extract subject IDs from class data
          const subjectIds = classData.subjects.map(s =>
            typeof s === 'object' ? s.subject._id || s.subject : s
          );

          // Fetch subject details
          const subjectsResponse = await api.get('/api/subjects');
          const allSubjects = subjectsResponse.data || [];

          // Filter subjects that belong to this class
          classSubjects = allSubjects.filter(subject =>
            subjectIds.includes(subject._id)
          );
        }
      } else {
        // Teachers can only see assigned subjects
        try {
          // Get the teacher's assigned subjects for this class
          console.log(`Fetching subjects that the teacher is assigned to teach in class ${classId}`);
          try {
            classSubjects = await teacherApi.getAssignedSubjects(classId);
            console.log(`Teacher has ${classSubjects.length} assigned subjects in class ${classId}:`,
              classSubjects.map(s => `${s.name} (${s._id})`));

            if (classSubjects.length === 0) {
              console.log('No assigned subjects found for this teacher in this class');
              setError('You are not assigned to teach any subjects in this class. Please contact an administrator.');
              setLoading(false);
              return; // Exit early if no subjects found
            }
          } catch (error) {
            console.error('Error fetching assigned subjects:', error);
            // Handle 403/401 errors gracefully without logging out
            if (error.response && (error.response.status === 403 || error.response.status === 401)) {
              setError('You are not authorized to teach in this class. Please contact an administrator.');
            } else {
              setError(error.response?.data?.message || 'Error fetching assigned subjects. Please try again later.');
            }
            setLoading(false);
            return; // Exit early if error occurs
          }
        } catch (error) {
          console.error('Error fetching teacher subjects:', error);
          setError('Failed to load subjects. You may not be authorized to teach in this class.');
          classSubjects = [];
        }
      }

      // Filter for A-Level subjects
      const aLevelSubjects = classSubjects.filter(subject =>
        subject.educationLevel === 'A_LEVEL' || subject.educationLevel === 'BOTH'
      );

      console.log(`Found ${aLevelSubjects.length} A-Level subjects out of ${classSubjects.length} total subjects`);

      if (aLevelSubjects.length === 0) {
        console.log('No A-Level subjects found');
        if (classSubjects.length > 0) {
          setError('No A-Level subjects found for this class. Please contact an administrator.');
        } else if (!isAdmin) {
          setError('You are not assigned to teach any A-Level subjects in this class.');
        } else {
          setError('No subjects found for this class. Please add subjects to the class first.');
        }
      }

      setSubjects(aLevelSubjects);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects. Please try again.');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle class selection
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setSelectedStudent('');
    setSelectedSubject('');
  };

  // Handle student selection
  const handleStudentChange = async (e) => {
    const studentId = e.target.value;
    setSelectedStudent(studentId);

    // Reset subject selection
    setSelectedSubject('');

    if (studentId) {
      try {
        setLoading(true);

        // Find the selected student object
        const selectedStudentObj = students.find(s => s._id === studentId);

        // Check if the class is an A-Level class
        const selectedClassObj = classes.find(cls => cls._id === selectedClass);

        // Check if the class name contains 'FORM V' or 'FORM VI' (special case for this school)
        const hasALevelName = selectedClassObj?.name && (
          selectedClassObj.name.toUpperCase().includes('FORM V') ||
          selectedClassObj.name.toUpperCase().includes('FORM VI')
        );

        // Enhanced A-Level class detection
        let isALevelClass = selectedClassObj && (
          // Check form property
          selectedClassObj.form === 5 ||
          selectedClassObj.form === 6 ||
          selectedClassObj.educationLevel === 'A_LEVEL' ||
          // Check name for various formats (case insensitive)
          (selectedClassObj.name && (
            selectedClassObj.name.toUpperCase().includes('FORM 5') ||
            selectedClassObj.name.toUpperCase().includes('FORM 6') ||
            selectedClassObj.name.toUpperCase().includes('FORM V') ||
            selectedClassObj.name.toUpperCase().includes('FORM VI') ||
            selectedClassObj.name.toUpperCase().includes('F5') ||
            selectedClassObj.name.toUpperCase().includes('F6') ||
            selectedClassObj.name.toUpperCase().includes('FV') ||
            selectedClassObj.name.toUpperCase().includes('FVI') ||
            // Check for A-Level indicators
            selectedClassObj.name.toUpperCase().includes('A-LEVEL') ||
            selectedClassObj.name.toUpperCase().includes('A LEVEL')
          ))
        );

        // Force A-Level class for testing if the class name contains 'FORM V' or 'FORM VI'
        if (hasALevelName) {
          console.log(`Student selection: Class ${selectedClassObj.name} is recognized as an A-Level class by name`);
          console.log(`Student selection: Forcing class ${selectedClassObj.name} to be recognized as an A-Level class`);
          isALevelClass = true;
        }

        // Check if student is explicitly marked as A_LEVEL
        const isALevel = selectedStudentObj?.educationLevel === 'A_LEVEL';

        // Check if student is in Form 5 or 6 (A-Level forms)
        // Handle both number and string representations of form
        const isFormFiveOrSix =
          selectedStudentObj?.form === 5 || selectedStudentObj?.form === 6 ||
          selectedStudentObj?.form === '5' || selectedStudentObj?.form === '6' ||
          (typeof selectedStudentObj?.form === 'string' &&
            (selectedStudentObj.form.includes('Form 5') ||
             selectedStudentObj.form.includes('Form 6') ||
             selectedStudentObj.form.includes('Form V') ||
             selectedStudentObj.form.includes('Form VI')));

        // Determine if this is an A-Level student
        const isALevelStudent = isALevel || isFormFiveOrSix;

        // If the student is in an A-Level class AND is an A-Level student, proceed
        if (isALevelClass && isALevelStudent) {
          console.log(`Selected ${isALevelClass ? 'student in A-Level class' : 'A-Level student'}: ${selectedStudentObj.firstName} ${selectedStudentObj.lastName}`);

          // Always use the teacher API to get subjects for this student
          console.log('Fetching subjects for student that the teacher is assigned to teach');
          try {
            // Use the new endpoint to get subjects for this student that the teacher is assigned to teach
            const teacherSubjectsForStudent = await teacherApi.getAssignedSubjectsForStudent(studentId, selectedClass);

            if (teacherSubjectsForStudent.length > 0) {
              console.log(`Found ${teacherSubjectsForStudent.length} subjects for student taught by this teacher`);
              setSubjects(teacherSubjectsForStudent);
            } else {
              // If no subjects found that the teacher teaches, check if the student has a subject combination
              if (!selectedStudentObj.subjectCombination) {
                console.log('Student has no subject combination, fetching all teacher subjects for this class');

                // If student doesn't have a subject combination, get all subjects the teacher teaches in this class
                const teacherClassSubjects = await teacherApi.getAssignedSubjects(selectedClass);

                if (teacherClassSubjects.length > 0) {
                  console.log(`Found ${teacherClassSubjects.length} subjects taught by teacher in this class`);
                  setSubjects(teacherClassSubjects);
                } else {
                  console.log('No subjects found that the teacher teaches in this class');
                  setSubjects([]);
                  setError('You are not assigned to teach any subjects in this class. Please contact an administrator.');
                }
              } else {
                // If student has a subject combination but no subjects found, show a message
                console.log('No subjects found for student that the teacher is assigned to teach');
                setSubjects([]);
                setError('You are not assigned to teach any subjects for this student. Please contact an administrator.');
              }
            }
          } catch (error) {
            console.error('Error fetching teacher subjects for student:', error);

            // If there's an error, try to get all subjects the teacher teaches in this class
            try {
              console.log('Falling back to fetching all teacher subjects for this class');
              const teacherClassSubjects = await teacherApi.getAssignedSubjects(selectedClass);

              if (teacherClassSubjects.length > 0) {
                console.log(`Found ${teacherClassSubjects.length} subjects taught by teacher in this class`);
                setSubjects(teacherClassSubjects);
              } else {
                setSubjects([]);
                setError('You are not assigned to teach any subjects in this class. Please contact an administrator.');
              }
            } catch (fallbackError) {
              console.error('Error in fallback subject fetch:', fallbackError);
              setSubjects([]);
              setError('Failed to load subjects for this student. Please try again.');
            }
          }
        } else {
          console.log('Selected student is not in an A-Level class and not marked as A-Level');
          setSubjects([]);
          setError('This component is only for A-Level students. Please select an A-Level student.');
        }
      } catch (error) {
        console.error('Error fetching student subjects:', error);
        setError('Failed to load subjects for this student. Please try again.');
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle subject selection
  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);

    // Check if the selected subject is principal
    const subject = subjects.find(s => s._id === e.target.value);
    if (subject) {
      setIsPrincipal(subject.isPrincipal || false);
      console.log(`Selected subject ${subject.name} is ${subject.isPrincipal ? 'a principal' : 'a subsidiary'} subject`);
    }
  };

  // Handle exam selection
  const handleExamChange = (e) => {
    setSelectedExam(e.target.value);
  };

  // Handle marks input
  const handleMarksChange = (e) => {
    const value = e.target.value;
    // Validate marks (0-100)
    if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
      setMarks(value);
    }
  };

  // Handle comment input
  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  // Calculate A-Level grade based on marks
  const calculateGrade = (marks) => {
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B';
    if (marks >= 60) return 'C';
    if (marks >= 50) return 'D';
    if (marks >= 40) return 'E';
    if (marks >= 35) return 'S';
    return 'F';
  };

  // Calculate A-Level points based on grade (using NECTA system where lower is better)
  const calculatePoints = (grade) => {
    switch (grade) {
      case 'A': return 1;
      case 'B': return 2;
      case 'C': return 3;
      case 'D': return 4;
      case 'E': return 5;
      case 'S': return 6;
      case 'F': return 7;
      default: return 0;
    }
  };

  // Handle principal checkbox change
  const handlePrincipalChange = (e) => {
    setIsPrincipal(e.target.checked);
    console.log(`Subject is now marked as ${e.target.checked ? 'principal' : 'subsidiary'}`);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent || !selectedSubject || !selectedExam || !marks) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      // Check if user is admin
      const isAdmin = teacherAuthService.isAdmin();

      // If not admin, verify authorization
      if (!isAdmin) {
        // Check if teacher is authorized for this class
        const isAuthorizedForClass = await teacherAuthService.isAuthorizedForClass(selectedClass);
        if (!isAuthorizedForClass) {
          throw new Error('You are not authorized to enter marks for this class');
        }

        // Check if teacher is authorized for this subject
        const isAuthorizedForSubject = await teacherAuthService.isAuthorizedForSubject(selectedClass, selectedSubject);
        if (!isAuthorizedForSubject) {
          throw new Error('You are not authorized to enter marks for this subject');
        }

        // Check if teacher is authorized for this student
        const assignedStudents = await teacherApi.getAssignedStudents(selectedClass);
        const isAuthorizedForStudent = assignedStudents.some(student => student._id === selectedStudent);
        if (!isAuthorizedForStudent) {
          throw new Error('You are not authorized to enter marks for this student');
        }
      }

      // Get the selected student to check education level
      const student = students.find(s => s._id === selectedStudent);
      if (!student) {
        throw new Error('Selected student not found');
      }

      // Get the selected subject to check if it's principal
      const subject = subjects.find(s => s._id === selectedSubject);
      if (!subject) {
        throw new Error('Selected subject not found');
      }

      // Validate that the subject is in the student's combination
      if (student.educationLevel === 'A_LEVEL' && student.subjectCombination) {
        // Check if the subject is in the student's combination
        const isInCombination = studentSubjectsApi.isSubjectInStudentCombination(selectedSubject, student);

        if (!isInCombination) {
          console.warn(`Subject ${subject.name} is not in student's combination`);

          // Confirm with the user before proceeding
          if (!window.confirm(`Warning: ${subject.name} is not in ${student.firstName}'s subject combination. Are you sure you want to enter marks for this subject?`)) {
            throw new Error('Mark entry cancelled - subject not in student combination');
          }
        }
      }

      // Get the selected exam to get academic year
      const exam = exams.find(e => e._id === selectedExam);
      if (!exam) {
        throw new Error('Selected exam not found');
      }

      // Calculate grade and points
      const grade = calculateGrade(Number(marks));
      const points = calculatePoints(grade);

      // Get the class name
      const classObj = classes.find(c => c._id === selectedClass);
      const className = classObj ? `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}` : 'Unknown Class';

      // Prepare data for preview and API call
      const resultData = {
        studentId: selectedStudent,
        studentName: `${student.firstName} ${student.lastName}`,
        examId: selectedExam,
        examName: exam.name,
        academicYearId: exam.academicYear,
        examTypeId: exam.examType,
        subjectId: selectedSubject,
        subjectName: subject.name,
        classId: selectedClass,
        className: className,
        marksObtained: Number(marks),
        grade,
        points,
        comment,
        educationLevel: 'A_LEVEL',
        isPrincipal: isPrincipal, // Use the state value for isPrincipal
        isInCombination: studentSubjectsApi.isSubjectInStudentCombination(selectedSubject, student)
      };

      console.log(`Subject ${subject.name} is ${subject.isPrincipal ? 'a principal' : 'a subsidiary'} subject`);
      console.log('Preview A-Level result:', resultData);

      // Set preview data and open the preview dialog
      console.log('Setting preview data:', resultData);
      setPreviewData(resultData);
      console.log('Opening preview dialog');
      setPreviewOpen(true);
      console.log('Preview dialog state after setting:', previewOpen);

    } catch (err) {
      console.error('Error preparing marks preview:', err);
      setSnackbar({
        open: true,
        message: `Failed to prepare marks preview: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle final submission after preview
  const handleFinalSubmit = async () => {
    if (!previewData) return;

    setLoading(true);
    try {
      // Submit to the standardized v2 API endpoint
      const response = await api.post('/api/v2/results/enter-marks', {
        ...previewData,
        educationLevel: 'A_LEVEL'
      });

      // Show success message
      setSnackbar({
        open: true,
        message: 'Marks saved successfully',
        severity: 'success'
      });

      // Close the preview dialog
      setPreviewOpen(false);

      // Reset form
      setMarks('');
      setComment('');
    } catch (err) {
      console.error('Error saving marks:', err);
      setSnackbar({
        open: true,
        message: `Failed to save marks: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle preview dialog close
  const handlePreviewClose = () => {
    console.log('Closing preview dialog');
    setPreviewOpen(false);
    console.log('Preview dialog state after closing:', previewOpen);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        A-Level Marks Entry
      </Typography>

      <Typography variant="body1" paragraph>
        Use this form to enter marks for A-Level students. This is a simplified form for testing purposes.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                label="Class"
                onChange={handleClassChange}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Select a class</em>
                </MenuItem>
                {Array.isArray(classes) && classes.map(cls => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name} {cls.section || ''} {cls.stream || ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Student</InputLabel>
              <Select
                value={selectedStudent}
                label="Student"
                onChange={handleStudentChange}
                disabled={loading || !selectedClass}
              >
                <MenuItem value="">
                  <em>Select a student</em>
                </MenuItem>
                {Array.isArray(students) && students.map(student => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.firstName} {student.lastName} ({student.rollNumber || 'No Roll Number'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                label="Subject"
                onChange={handleSubjectChange}
                disabled={loading || !selectedClass}
              >
                <MenuItem value="">
                  <em>Select a subject</em>
                </MenuItem>
                {Array.isArray(subjects) && subjects.map(subject => {
                  // Check if this subject is in the student's combination
                  const student = students.find(s => s._id === selectedStudent);
                  const isInCombination = student?.subjectCombination ?
                    studentSubjectsApi.isSubjectInStudentCombination(subject._id, student) :
                    false;

                  return (
                    <MenuItem
                      key={subject._id}
                      value={subject._id}
                      sx={{
                        fontWeight: subject.isPrincipal ? 'bold' : 'normal',
                        color: subject.isPrincipal ? 'primary.main' : 'inherit',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>{subject.name} ({subject.isPrincipal ? 'PRINCIPAL' : 'Subsidiary'})</span>
                        {isInCombination && (
                          <Chip
                            size="small"
                            label="In Combination"
                            color="success"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Exam</InputLabel>
              <Select
                value={selectedExam}
                label="Exam"
                onChange={handleExamChange}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>Select an exam</em>
                </MenuItem>
                {Array.isArray(exams) && exams.map(exam => (
                  <MenuItem key={exam._id} value={exam._id}>
                    {exam.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Marks"
              type="number"
              value={marks}
              onChange={handleMarksChange}
              fullWidth
              inputProps={{ min: 0, max: 100, step: 0.1 }}
              disabled={loading}
              required
              helperText={marks ? `Grade: ${calculateGrade(Number(marks))}, Points: ${calculatePoints(calculateGrade(Number(marks)))}` : ''}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Comment"
              value={comment}
              onChange={handleCommentChange}
              fullWidth
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isPrincipal}
                    onChange={handlePrincipalChange}
                    disabled={loading}
                    color="primary"
                  />
                }
                label="Principal Subject"
              />
              <Typography variant="caption" color="textSecondary">
                Principal subjects are used to calculate division
              </Typography>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || !selectedStudent || !selectedSubject || !selectedExam || !marks}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Marks'}
              </Button>

              {selectedStudent && selectedExam && (
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => navigate(`/results/a-level/student-clean/${selectedStudent}/${selectedExam}`)}
                  sx={{ mt: 2, mr: 1 }}
                >
                  View Student Report
                </Button>
              )}

              {selectedClass && selectedExam && (
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={() => navigate(`/results/a-level/class/${selectedClass}/${selectedExam}`)}
                  >
                    View Class Report
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate(`/results/a-level/class/${selectedClass}/${selectedExam}/form/5`)}
                  >
                    Form 5 Report
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate(`/results/a-level/class/${selectedClass}/${selectedExam}/form/6`)}
                  >
                    Form 6 Report
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onClose={handlePreviewClose}
        onSubmit={handleFinalSubmit}
        data={previewData}
        loading={loading}
        type="individual"
      />


    </Paper>
  );
};

export default ALevelMarksEntry;
