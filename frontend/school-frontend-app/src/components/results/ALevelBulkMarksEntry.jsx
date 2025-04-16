import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import PreviewDialog from '../common/PreviewDialog';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import teacherAuthService from '../../services/teacherAuthService';
import teacherApi from '../../services/teacherApi';
import studentSubjectsApi from '../../services/studentSubjectsApi';
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
  Checkbox,
  FormControlLabel,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
 * A-Level Bulk Marks Entry Component
 * Allows teachers to enter marks for multiple A-Level students at once
 */
const ALevelBulkMarksEntry = () => {
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

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  // Monitor previewOpen state
  useEffect(() => {
    console.log('previewOpen state changed:', previewOpen);
  }, [previewOpen]);

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
              educationLevel: 'A_LEVEL'
            }
          });
          classesData = response.data || [];
        } else {
          // Teachers can only see assigned classes
          const assignedClasses = await teacherApi.getAssignedClasses();
          // Filter for A-Level classes
          classesData = assignedClasses.filter(cls =>
            cls.educationLevel === 'A_LEVEL'
          );
        }

        // Log the classes for debugging
        console.log(`Found ${classesData.length} A-Level classes`);

        // If no classes found, show a message
        if (classesData.length === 0) {
          console.log('No A-Level classes found');
          setError('No A-Level classes found. Please contact an administrator to assign you to A-Level classes.');
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

        let subjectsData = [];
        if (isAdmin) {
          // Admin can see all subjects in the class
          const response = await api.get(`/api/classes/${selectedClass}/subjects`);
          subjectsData = response.data || [];
        } else {
          // Teachers can only see assigned subjects
          try {
            // Get the teacher's assigned subjects for this class
            console.log(`Fetching subjects that the teacher is assigned to teach in class ${selectedClass}`);
            try {
              subjectsData = await teacherApi.getAssignedSubjects(selectedClass);
              console.log(`Teacher has ${subjectsData.length} assigned subjects in class ${selectedClass}:`,
                subjectsData.map(s => `${s.name} (${s._id})`));

              if (subjectsData.length === 0) {
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
            subjectsData = [];
          }
        }

        // Filter for A-Level subjects only
        const aLevelSubjects = subjectsData.filter(subject =>
          subject.educationLevel === 'A_LEVEL' || subject.educationLevel === 'BOTH'
        );

        console.log(`Found ${aLevelSubjects.length} A-Level subjects out of ${subjectsData.length} total subjects`);

        if (aLevelSubjects.length === 0) {
          console.log('No A-Level subjects found');
          if (subjectsData.length > 0) {
            setError('No A-Level subjects found for this class. Please contact an administrator.');
          } else if (!isAdmin) {
            setError('You are not assigned to teach any A-Level subjects in this class.');
          } else {
            setError('No subjects found for this class. Please add subjects to the class first.');
          }
        }

        setSubjects(aLevelSubjects);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setError('Failed to fetch subjects. Please try again.');
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedClass]);

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
          // Check if teacher is authorized for this class and subject
          const isAuthorizedForClass = await teacherAuthService.isAuthorizedForClass(selectedClass);
          const isAuthorizedForSubject = await teacherAuthService.isAuthorizedForSubject(selectedClass, selectedSubject);

          if (!isAuthorizedForClass || !isAuthorizedForSubject) {
            setError('You are not authorized to view marks for this class or subject');
            setLoading(false);
            return;
          }
        }

        // Get students in the class
        let studentsData;
        if (isAdmin) {
          // Admin can see all students in the class
          const studentsResponse = await api.get(`/api/students/class/${selectedClass}`);
          studentsData = studentsResponse.data || [];
        } else {
          try {
            // Teachers can only see assigned students
            studentsData = await teacherApi.getAssignedStudents(selectedClass);
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
            const response = await api.get(`/api/students/class/${selectedClass}`);
            studentsData = response.data || [];
          }
        }

        // Process all A-Level students to ensure they have properly populated subject combinations
        const aLevelStudentsWithCombinations = studentsData.filter(student =>
          (student.educationLevel === 'A_LEVEL' || student.form === 5 || student.form === 6) &&
          student.subjectCombination
        );

        console.log(`Found ${aLevelStudentsWithCombinations.length} A-Level students with combinations in class ${selectedClass}`);

        // Process each A-Level student with a combination
        for (const student of aLevelStudentsWithCombinations) {
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
        }

        // Log students with their subject combinations
        console.log(`Fetched ${studentsData.length} students for class ${selectedClass}`);

        // Log raw student data for debugging
        console.log('Raw student data:', studentsData.slice(0, 3));

        // Get the class object to check if it's an A-Level class
        const selectedClassObj = classes.find(cls => cls._id === selectedClass);

        // Enhanced A-Level class detection
        const isALevelClass = selectedClassObj && (
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
            selectedClassObj.name.toUpperCase().includes('A-LEVEL') ||
            selectedClassObj.name.toUpperCase().includes('A LEVEL')
          ))
        );

        // Special case for this school - force A-Level class if name contains 'FORM V' or 'FORM VI'
        let forceALevel = false;
        if (selectedClassObj?.name && (
          selectedClassObj.name.toUpperCase().includes('FORM V') ||
          selectedClassObj.name.toUpperCase().includes('FORM VI')
        )) {
          console.log(`Class ${selectedClassObj.name} is recognized as an A-Level class by name`);
          console.log(`Forcing class ${selectedClassObj.name} to be recognized as an A-Level class`);
          forceALevel = true;
        }

        console.log(`Class ${selectedClass} is ${(isALevelClass || forceALevel) ? 'an A-Level' : 'not an A-Level'} class:`,
          selectedClassObj?.name,
          `Form: ${selectedClassObj?.form}`);

        // Filter for A-Level students by educationLevel OR form level (5 or 6)
        const aLevelStudents = studentsData.filter(student => {
          // Check if student is explicitly marked as A_LEVEL
          const isALevel = student.educationLevel === 'A_LEVEL';

          // Check if student is in Form 5 or 6 (A-Level forms)
          const isFormFiveOrSix = student.form === 5 || student.form === 6;

          // Determine if this is an A-Level student
          const isALevelStudent = isALevel || isFormFiveOrSix;

          // If the class is an A-Level class, only include A-Level students
          if (isALevelClass || forceALevel) {
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

        console.log(`Found ${aLevelStudents.length} A-Level students out of ${studentsData.length} total students`);

        // For bulk marks entry, we still need to filter students who have the selected subject in their combination
        // The backend has already filtered students by teacher, but we need to filter by selected subject
        const filteredStudents = selectedSubject ? aLevelStudents.filter(student => {
          // If student has a subject combination
          if (student.subjectCombination &&
              typeof student.subjectCombination === 'object') {

            // Check if the combination is fully populated
            const isPopulated = student.subjectCombination.subjects &&
                              Array.isArray(student.subjectCombination.subjects);

            if (isPopulated) {
              // Check if the selected subject is in the student's principal subjects
              const principalSubjectIds = student.subjectCombination.subjects.map(s =>
                typeof s === 'object' ? s._id : s
              );

              // Check if the selected subject is in the student's subsidiary subjects
              const subsidiarySubjectIds = student.subjectCombination.compulsorySubjects ?
                student.subjectCombination.compulsorySubjects.map(s =>
                  typeof s === 'object' ? s._id : s
                ) : [];

              // Combine all subject IDs
              const allSubjectIds = [...principalSubjectIds, ...subsidiarySubjectIds];

              // Check if the selected subject is in the student's combination
              return allSubjectIds.includes(selectedSubject);
            }
          }

          // If student doesn't have a populated subject combination, don't include them
          // For bulk marks entry, we only want students with the selected subject
          return false;
        }) : aLevelStudents;

        console.log(`Filtered to ${filteredStudents.length} students who have subject ${selectedSubject} in their combination`);

        // If no A-Level students found, show a message
        if (filteredStudents.length === 0 && studentsData.length > 0) {
          console.log('No A-Level students found with the selected subject');
          setError('No A-Level students found with the selected subject in this class.');
        } else if (studentsData.length === 0) {
          console.log('No students found at all');
          setError('No students found in this class.');
        }

        // Filter for A-Level students with subject combinations
        const aLevelStudentsWithAssignedCombinations = filteredStudents.filter(student =>
          student.subjectCombination
        );

        console.log(`Found ${aLevelStudentsWithAssignedCombinations.length} A-Level students with subject combinations`);

        // Get the selected subject
        const selectedSubjectObj = subjects.find(s => s._id === selectedSubject);
        if (selectedSubjectObj) {
          console.log(`Selected subject: ${selectedSubjectObj.name}`);
        }

        // Get existing marks for the selected class, subject, and exam
        const marksResponse = await api.get('/api/check-marks/check-existing', {
          params: {
            classId: selectedClass,
            subjectId: selectedSubject,
            examId: selectedExam
          }
        });

        // Get exam details to get academic year
        const examResponse = await api.get(`/api/exams/${selectedExam}`);

        const academicYearId = examResponse.data.academicYear;
        const examTypeId = examResponse.data.examType;

        // Use the filtered students that have the selected subject in their combination
        setStudents(filteredStudents);

        // Initialize marks array with existing marks
        const initialMarks = filteredStudents.map(student => {
          const existingMark = marksResponse.data.find(mark =>
            mark.studentId === student._id
          );

          // Check if this subject is in the student's combination
          let isInCombination = false;
          let isPrincipal = existingMark ? existingMark.isPrincipal : false;

          if (student.subjectCombination) {
            // Check if the combination is fully populated
            const isPopulated = typeof student.subjectCombination === 'object' &&
                              student.subjectCombination.subjects &&
                              Array.isArray(student.subjectCombination.subjects);

            if (!isPopulated) {
              console.log(`Subject combination for student ${student._id} is not fully populated`);
              // We'll handle this case by assuming the subject is not in the combination
              isInCombination = false;
            } else {
              // Check if the subject is in the student's combination
              isInCombination = studentSubjectsApi.isSubjectInStudentCombination(selectedSubject, student);

              if (isInCombination) {
                // Get subjects from combination
                const combinationSubjects = studentSubjectsApi.getSubjectsFromCombination(student);

                // Find this subject in the combination
                const subjectInCombination = combinationSubjects.find(s => s._id === selectedSubject);

                // If found, use its isPrincipal flag
                if (subjectInCombination) {
                  isPrincipal = subjectInCombination.isPrincipal;
                  console.log(`Subject ${selectedSubject} is ${isPrincipal ? 'a principal' : 'a subsidiary'} subject for student ${student._id}`);
                }
              } else {
                console.log(`Subject ${selectedSubject} is not in the combination for student ${student._id}`);
              }
            }
          } else {
            console.log(`Student ${student._id} has no subject combination`);
          }

          return {
            studentId: student._id,
            studentName: `${student.firstName} ${student.lastName}`,
            examId: selectedExam,
            academicYearId,
            examTypeId,
            subjectId: selectedSubject,
            classId: selectedClass,
            marksObtained: existingMark ? existingMark.marksObtained : '',
            grade: existingMark ? existingMark.grade : '',
            points: existingMark ? existingMark.points : '',
            comment: existingMark ? existingMark.comment : '',
            isPrincipal: isPrincipal,
            _id: existingMark ? existingMark._id : null,
            isInCombination: isInCombination
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
  }, [selectedClass, selectedSubject, selectedExam, subjects, classes]);

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
              // Clear grade and points when marks are changed
              grade: '',
              points: ''
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

  // Handle principal subject change
  const handlePrincipalChange = (studentId, checked) => {
    setMarks(prevMarks =>
      prevMarks.map(mark =>
        mark.studentId === studentId
          ? { ...mark, isPrincipal: checked }
          : mark
      )
    );
  };

  // Calculate grade based on marks (A-Level grading system)
  const calculateGrade = (marks) => {
    if (marks === '' || marks === undefined) return '';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B';
    if (marks >= 60) return 'C';
    if (marks >= 50) return 'D';
    if (marks >= 40) return 'E';
    if (marks >= 35) return 'S';
    return 'F';
  };

  // Calculate points based on grade (A-Level points system)
  const calculatePoints = (grade) => {
    if (!grade) return '';
    switch (grade) {
      case 'A': return 5;
      case 'B': return 4;
      case 'C': return 3;
      case 'D': return 2;
      case 'E': return 1;
      case 'S': return 0.5;
      case 'F': return 0;
      default: return '';
    }
  };

  // Prepare marks for preview
  const handleSaveMarks = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Check if user is admin
      const isAdmin = teacherAuthService.isAdmin();

      // If not admin, verify authorization
      if (!isAdmin) {
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

      if (marksToSave.length === 0) {
        setError('No marks to save. Please enter at least one mark.');
        setSaving(false);
        return;
      }

      // Get class and exam details for preview
      const classObj = classes.find(c => c._id === selectedClass);
      const className = classObj ? `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}` : 'Unknown Class';

      const examObj = exams.find(e => e._id === selectedExam);
      const examName = examObj ? examObj.name : 'Unknown Exam';

      const subjectObj = subjects.find(s => s._id === selectedSubject);
      const subjectName = subjectObj ? subjectObj.name : 'Unknown Subject';

      // Set preview data
      setPreviewData({
        marks: marksToSave,
        className,
        examName,
        subjectName,
        totalStudents: students.length,
        markedStudents: marksToSave.length,
        summary: {
          totalMarks: marksToSave.reduce((sum, mark) => sum + Number(mark.marksObtained), 0),
          averageMark: marksToSave.length > 0 ?
            (marksToSave.reduce((sum, mark) => sum + Number(mark.marksObtained), 0) / marksToSave.length).toFixed(2) : 0,
          highestMark: marksToSave.length > 0 ?
            Math.max(...marksToSave.map(mark => Number(mark.marksObtained))) : 0,
          lowestMark: marksToSave.length > 0 ?
            Math.min(...marksToSave.map(mark => Number(mark.marksObtained))) : 0,
          gradeDistribution: {
            A: marksToSave.filter(mark => mark.grade === 'A').length,
            B: marksToSave.filter(mark => mark.grade === 'B').length,
            C: marksToSave.filter(mark => mark.grade === 'C').length,
            D: marksToSave.filter(mark => mark.grade === 'D').length,
            E: marksToSave.filter(mark => mark.grade === 'E').length,
            S: marksToSave.filter(mark => mark.grade === 'S').length,
            F: marksToSave.filter(mark => mark.grade === 'F').length
          }
        }
      });

      // Open preview dialog
      console.log('Setting preview open to true');
      setPreviewOpen(true);
      console.log('Preview dialog state after setting:', previewOpen);

      // Update marks state with calculated grades and points
      setMarks(marksWithGrades);

    } catch (error) {
      console.error('Error preparing marks preview:', error);
      setError(`Failed to prepare marks preview: ${error.response?.data?.message || error.message}`);
      setSnackbar({
        open: true,
        message: `Failed to prepare marks preview: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle final submission after preview
  const handleFinalSubmit = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!previewData || !previewData.marks || previewData.marks.length === 0) {
        throw new Error('No marks to save');
      }

      // Save marks
      await api.post('/api/a-level-results/batch', previewData.marks);

      // Close preview dialog
      setPreviewOpen(false);

      // Show success message
      setSuccess('Marks saved successfully.');
      setSnackbar({
        open: true,
        message: 'Marks saved successfully',
        severity: 'success'
      });

      // Refresh data to show saved status
      handleRefresh();

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

  // Handle preview dialog close
  const handlePreviewClose = () => {
    console.log('Closing preview dialog');
    setPreviewOpen(false);
    console.log('Preview dialog state after closing:', previewOpen);
  };

  // Refresh data
  const handleRefresh = () => {
    if (selectedClass && selectedSubject && selectedExam) {
      // Reset marks and fetch data again
      setMarks([]);
      setActiveTab(0);

      // Trigger useEffect to fetch data
      const tempClass = selectedClass;
      const tempSubject = selectedSubject;
      const tempExam = selectedExam;

      setSelectedClass('');
      setSelectedSubject('');
      setSelectedExam('');

      setTimeout(() => {
        setSelectedClass(tempClass);
        setSelectedSubject(tempSubject);
        setSelectedExam(tempExam);
      }, 100);
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
            A-Level Bulk Marks Entry
          </Typography>
        </Box>

        {selectedSubject && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            onClick={() => navigate(`/marks-history/subject/${selectedSubject}?model=ALevelResult`)}
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
                        color="secondary"
                        onClick={() => {
                          console.log('Test button clicked, setting previewOpen to true');
                          setPreviewOpen(true);
                        }}
                        sx={{ mr: 1 }}
                      >
                        Test Preview Dialog
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
                          <TableCell width="25%">Student Name</TableCell>
                          <TableCell width="20%">Marks (0-100)</TableCell>
                          <TableCell width="20%">Comment</TableCell>
                          <TableCell width="15%">Principal Subject</TableCell>
                          <TableCell width="10%">In Combination</TableCell>
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
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={mark.isPrincipal}
                                    onChange={(e) => handlePrincipalChange(mark.studentId, e.target.checked)}
                                    disabled={saving}
                                  />
                                }
                                label="Principal"
                              />
                            </TableCell>
                            <TableCell>
                              {mark.isInCombination ? (
                                <Chip
                                  label="Yes"
                                  color="success"
                                  size="small"
                                  variant="outlined"
                                />
                              ) : (
                                <Tooltip title="This subject is not in the student's combination">
                                  <Chip
                                    label="No"
                                    color="error"
                                    size="small"
                                    variant="outlined"
                                  />
                                </Tooltip>
                              )}
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
                                    onClick={() => navigate(`/marks-history/result/${mark._id}?model=ALevelResult`)}
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
                    <Tooltip title="A-Level Grading: A (80-100%), B (70-79%), C (60-69%), D (50-59%), E (40-49%), S (35-39%), F (0-34%)">
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
                          <TableCell width="30%">Student Name</TableCell>
                          <TableCell width="15%" align="center">Marks</TableCell>
                          <TableCell width="15%" align="center">Grade</TableCell>
                          <TableCell width="15%" align="center">Points</TableCell>
                          <TableCell width="15%" align="center">Principal Subject</TableCell>
                          <TableCell width="15%" align="center">In Combination</TableCell>
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
                                      grade === 'D' ? 'warning' :
                                      grade === 'E' ? 'warning' :
                                      grade === 'S' ? 'warning' : 'error'
                                    }
                                    size="small"
                                  />
                                ) : '-'}
                              </TableCell>
                              <TableCell align="center">{points || '-'}</TableCell>
                              <TableCell align="center">
                                {mark.isPrincipal ? (
                                  <Chip
                                    label="Principal"
                                    color="primary"
                                    size="small"
                                  />
                                ) : (
                                  <Chip
                                    label="Subsidiary"
                                    color="default"
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {mark.isInCombination ? (
                                  <Chip
                                    label="Yes"
                                    color="success"
                                    size="small"
                                    variant="outlined"
                                  />
                                ) : (
                                  <Tooltip title="This subject is not in the student's combination">
                                    <Chip
                                      label="No"
                                      color="error"
                                      size="small"
                                      variant="outlined"
                                    />
                                  </Tooltip>
                                )}
                              </TableCell>
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

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onClose={handlePreviewClose}
        onSubmit={handleFinalSubmit}
        data={previewData}
        loading={saving}
        type="bulk"
      />
    </Box>
  );
};

export default ALevelBulkMarksEntry;
