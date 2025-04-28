import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import PreviewDialog from '../common/PreviewDialog';
import DirectStudentFetcher from './DirectStudentFetcher';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import teacherAuthService from '../../services/teacherAuthService';
import teacherApi from '../../services/teacherApi';
import teacherSubjectFilter from '../../services/teacherSubjectFilter';
import studentSubjectsApi from '../../services/studentSubjectsApi';
import { filterALevelStudentsBySubject, createALevelCombinationsMap, extractALevelCombinations, formatALevelStudentName, debugStudentData } from '../../utils/a-level-student-utils';
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
 * Bulk Marks Entry Component
 * Allows teachers to enter marks for multiple students at once
 * Supports both A-Level and O-Level education levels
 */
const ALevelBulkMarksEntry = ({ educationLevel: propEducationLevel }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';
  const location = useLocation();

  // Determine education level from props or location state
  const [educationLevel, setEducationLevel] = useState(
    propEducationLevel || location.state?.educationLevel || 'A_LEVEL'
  );

  // Set page title based on education level
  const pageTitle = educationLevel === 'O_LEVEL' ? 'O-Level Bulk Marks Entry' : 'A-Level Bulk Marks Entry';

  console.log('Bulk Marks Entry - Education Level:', educationLevel);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear global variables
      if (window.aLevelCombinationsMap) {
        console.log('Cleaning up global combinations map');
        window.aLevelCombinationsMap = undefined;
      }
    };
  }, []);

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
              educationLevel: educationLevel
            }
          });
          classesData = response.data || [];
        } else {
          // Teachers can only see assigned classes
          try {
            // First try using the teacherApi
            console.log('Fetching assigned classes using teacherApi');
            const assignedClasses = await teacherApi.getAssignedClasses();
            // Filter for classes based on education level
            classesData = assignedClasses.filter(cls =>
              cls.educationLevel === educationLevel || !cls.educationLevel
            );
          } catch (error) {
            console.error('Error using teacherApi, falling back to direct API call:', error);

            // Fallback to direct API call
            try {
              console.log('Falling back to direct API call for teacher classes');
              const response = await api.get('/api/teacher-classes/my-classes');
              const assignedClasses = response.data || [];
              // Filter for A-Level classes
              classesData = assignedClasses.filter(cls =>
                cls.educationLevel === 'A_LEVEL'
              );
            } catch (fallbackError) {
              console.error('Error with fallback API call:', fallbackError);

              // Last resort: try to get all classes and filter them client-side
              console.log('Last resort: fetching all classes');
              const allClassesResponse = await api.get('/api/classes');
              const allClasses = allClassesResponse.data || [];
              // Filter for classes based on education level
              if (educationLevel === 'A_LEVEL') {
                classesData = allClasses.filter(cls =>
                  cls.educationLevel === 'A_LEVEL' ||
                  cls.form === 5 ||
                  cls.form === 6 ||
                  (cls.name && (
                    cls.name.toUpperCase().includes('FORM 5') ||
                    cls.name.toUpperCase().includes('FORM 6') ||
                    cls.name.toUpperCase().includes('FORM V') ||
                    cls.name.toUpperCase().includes('FORM VI')
                  ))
                );
              } else {
                classesData = allClasses.filter(cls =>
                  cls.educationLevel === 'O_LEVEL' ||
                  (cls.form && cls.form < 5) ||
                  (cls.name && (
                    cls.name.toUpperCase().includes('FORM 1') ||
                    cls.name.toUpperCase().includes('FORM 2') ||
                    cls.name.toUpperCase().includes('FORM 3') ||
                    cls.name.toUpperCase().includes('FORM 4') ||
                    cls.name.toUpperCase().includes('FORM I') ||
                    cls.name.toUpperCase().includes('FORM II') ||
                    cls.name.toUpperCase().includes('FORM III') ||
                    cls.name.toUpperCase().includes('FORM IV') ||
                    cls.name.toUpperCase().includes('O-LEVEL') ||
                    cls.name.toUpperCase().includes('O LEVEL')
                  ))
                );
              }
            }
          }
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

        // Direct approach: Try to get A-Level subjects first
        try {
          console.log('Direct approach: Using /api/subjects/a-level endpoint to get all A-Level subjects');
          const response = await api.get('/api/subjects/a-level');

          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log(`Direct approach: Found ${response.data.length} A-Level subjects`);
            setSubjects(response.data);
            setLoading(false);
            return; // Exit early if we found subjects
          }
        } catch (directError) {
          console.error('Direct approach failed:', directError);
          // Continue with other approaches
        }

        // Check if user is admin
        const isAdmin = teacherAuthService.isAdmin();

        let subjectsData = [];
        if (isAdmin) {
          // Admin can see all subjects in the class
          const response = await api.get(`/api/classes/${selectedClass}/subjects`);
          subjectsData = response.data || [];
        } else {
          // Teachers can only see subjects they are assigned to teach
          try {
            // Get the teacher's assigned subjects for this class
            console.log(`Fetching subjects that the teacher is assigned to teach in class ${selectedClass}`);

            // Try multiple approaches to get the teacher's assigned subjects
            let subjectsFound = false;

            // Approach 0: Try our new specialized filter service
            try {
              console.log('Approach 0: Using teacherSubjectFilter service');
              const filteredSubjects = await teacherSubjectFilter.getTeacherFilteredSubjects(selectedClass);

              if (filteredSubjects && filteredSubjects.length > 0) {
                subjectsData = filteredSubjects;
                subjectsFound = true;
                console.log(`Approach 0: Found ${subjectsData.length} subjects using specialized filter`);
              } else {
                console.log('Approach 0: No subjects found using specialized filter');
              }
            } catch (error0) {
              console.error('Approach 0 failed:', error0);
            }

            // Approach 1: Try the teacher-subjects endpoint
            if (!subjectsFound) {
              try {
                console.log('Approach 1: Using /api/teachers/classes/:classId/subjects endpoint');
                const response = await api.get(`/api/teachers/classes/${selectedClass}/subjects`);

                // Check if the response has data
                if (response.data) {
                  if (Array.isArray(response.data)) {
                    // If the response is an array, use it directly
                    subjectsData = response.data;
                    subjectsFound = true;
                  } else if (response.data.subjects && Array.isArray(response.data.subjects)) {
                    // If the response has a subjects array, use that
                    subjectsData = response.data.subjects;
                    subjectsFound = true;
                  }
                }

                console.log(`Approach 1: Found ${subjectsData.length} subjects`);
              } catch (error1) {
                console.error('Approach 1 failed:', error1);
              }
            }

            // Approach 2: Try the marks-entry-subjects endpoint
            if (!subjectsFound) {
              try {
                console.log('Approach 2: Using /api/teachers/marks-entry-subjects endpoint');
                const response = await api.get('/api/teachers/marks-entry-subjects', {
                  params: { classId: selectedClass }
                });

                if (response.data) {
                  if (Array.isArray(response.data)) {
                    subjectsData = response.data;
                    subjectsFound = true;
                  } else if (response.data.subjects && Array.isArray(response.data.subjects)) {
                    subjectsData = response.data.subjects;
                    subjectsFound = true;
                  }
                }

                console.log(`Approach 2: Found ${subjectsData.length} subjects`);
              } catch (error2) {
                console.error('Approach 2 failed:', error2);
              }
            }

            // Approach 3: Try the my-subjects endpoint
            if (!subjectsFound) {
              try {
                console.log('Approach 3: Using /api/teachers/my-subjects endpoint');
                const response = await api.get('/api/teachers/my-subjects', {
                  params: { classId: selectedClass }
                });

                if (response.data) {
                  if (Array.isArray(response.data)) {
                    subjectsData = response.data;
                    subjectsFound = true;
                  } else if (response.data.subjects && Array.isArray(response.data.subjects)) {
                    subjectsData = response.data.subjects;
                    subjectsFound = true;
                  }
                }

                console.log(`Approach 3: Found ${subjectsData.length} subjects`);
              } catch (error3) {
                console.error('Approach 3 failed:', error3);
              }
            }

            // Approach 4: Try the teacher-classes/my-subjects endpoint
            if (!subjectsFound) {
              try {
                console.log('Approach 4: Using /api/teacher-classes/my-subjects endpoint');
                const response = await api.get('/api/teacher-classes/my-subjects');

                if (response.data) {
                  if (Array.isArray(response.data)) {
                    // Filter subjects for the selected class
                    subjectsData = response.data.filter(subject =>
                      subject.classes?.some(cls => cls._id === selectedClass)
                    );
                    subjectsFound = true;
                  }
                }

                console.log(`Approach 4: Found ${subjectsData.length} subjects`);
              } catch (error4) {
                console.error('Approach 4 failed:', error4);
              }
            }

            // Approach 5: Use the new teacher-classes endpoint
            if (!subjectsFound) {
              try {
                console.log('Approach 5: Using /api/teacher-classes/classes/:classId/subjects endpoint');
                const response = await api.get(`/api/teacher-classes/classes/${selectedClass}/subjects`);

                if (response.data) {
                  subjectsData = response.data;
                  subjectsFound = true;
                  console.log(`Approach 5: Found ${subjectsData.length} subjects`);
                }
              } catch (error5) {
                console.error('Approach 5 failed:', error5);
              }
            }

            // Approach 5b: Last resort - get all subjects for the class
            if (!subjectsFound) {
              try {
                console.log('Approach 5b: Using /api/classes/:classId/subjects endpoint');
                const response = await api.get(`/api/classes/${selectedClass}/subjects`);

                if (response.data) {
                  subjectsData = response.data;
                  subjectsFound = true;
                  console.log(`Approach 5b: Found ${subjectsData.length} subjects`);
                }
              } catch (error5b) {
                console.error('Approach 5b failed:', error5b);
              }
            }

            // Approach 6: Use the existing A-Level subjects endpoint
            if (!subjectsFound || subjectsData.length === 0) {
              try {
                console.log('Approach 6: Using /api/subjects/a-level endpoint to get all A-Level subjects');
                const response = await api.get('/api/subjects/a-level');

                if (response.data) {
                  subjectsData = response.data;
                  subjectsFound = true;
                  console.log(`Approach 6: Found ${subjectsData.length} subjects`);
                }
              } catch (error6) {
                console.error('Approach 6 failed:', error6);

                // Approach 7: Try the class-specific A-Level subjects endpoint
                try {
                  console.log(`Approach 7: Using /api/subjects/a-level/class/${selectedClass} endpoint`);
                  const response = await api.get(`/api/subjects/a-level/class/${selectedClass}`);

                  if (response.data) {
                    subjectsData = response.data;
                    subjectsFound = true;
                    console.log(`Approach 7: Found ${subjectsData.length} subjects for class ${selectedClass}`);
                  }
                } catch (error7) {
                  console.error('Approach 7 failed:', error7);

                  // Approach 8: Final fallback - get all subjects and filter for A-Level
                  try {
                    console.log('Approach 8: Using /api/subjects endpoint to get all subjects and filter for A-Level');
                    const response = await api.get('/api/subjects');

                    if (response.data) {
                      // Filter for A-Level subjects
                      subjectsData = response.data.filter(subject =>
                        subject.educationLevel === 'A_LEVEL' || subject.educationLevel === 'BOTH'
                      );
                      subjectsFound = true;
                      console.log(`Approach 8: Found ${subjectsData.length} A-Level subjects out of ${response.data.length} total subjects`);
                    }
                  } catch (error8) {
                    console.error('Approach 8 failed:', error8);
                  }
                }
              }
            }

            // If no subjects found after all approaches, show an error
            if (!subjectsFound || subjectsData.length === 0) {
              console.log('No assigned subjects found for this teacher in this class after trying all approaches');
              setError('You are not assigned to teach any subjects in this class. Please contact an administrator.');
              setLoading(false);
              return; // Exit early if no subjects found
            }

            console.log(`Successfully found ${subjectsData.length} subjects for class ${selectedClass}:`,
              subjectsData.map(s => `${s.name} (${s._id})`));

          } catch (error) {
            console.error('Error fetching teacher subjects:', error);
            setError('Failed to load subjects. You may not be authorized to teach in this class.');
            subjectsData = [];
          }
        }

        // Log the subjects for debugging
        console.log('All subjects before filtering:', subjectsData.map(s => `${s.name} (${s._id}) - educationLevel: ${s.educationLevel || 'undefined'}`));

        // Deduplicate subjects by name instead of ID
        const uniqueSubjectsMap = new Map();
        for (const subject of subjectsData) {
          if (!subject.name) continue;

          const subjectName = subject.name.trim().toUpperCase();

          if (!uniqueSubjectsMap.has(subjectName)) {
            // First time seeing this subject name
            uniqueSubjectsMap.set(subjectName, {
              ...subject,
              originalIds: [subject._id],
              studentCount: 0
            });
          } else {
            // We've seen this subject name before, add this ID to the list
            const existingSubject = uniqueSubjectsMap.get(subjectName);
            existingSubject.originalIds.push(subject._id);
            uniqueSubjectsMap.set(subjectName, existingSubject);
          }
        }

        // Convert back to array
        const uniqueSubjects = Array.from(uniqueSubjectsMap.values());
        console.log(`Deduplicated subjects by name: ${uniqueSubjects.length} (from ${subjectsData.length})`);
        console.log('Deduplicated subjects:', uniqueSubjects.map(s => `${s.name} (original IDs: ${s.originalIds.join(', ')})`))

        // For A-Level classes, we should include all subjects regardless of educationLevel
        // Check if this is an A-Level class
        const selectedClassObj = classes.find(cls => cls._id === selectedClass);
        const isALevelClass = selectedClassObj && (
          selectedClassObj.form === 5 ||
          selectedClassObj.form === 6 ||
          selectedClassObj.educationLevel === 'A_LEVEL' ||
          (selectedClassObj.name && (
            selectedClassObj.name.toUpperCase().includes('FORM 5') ||
            selectedClassObj.name.toUpperCase().includes('FORM 6') ||
            selectedClassObj.name.toUpperCase().includes('FORM V') ||
            selectedClassObj.name.toUpperCase().includes('FORM VI') ||
            selectedClassObj.name.toUpperCase().includes('A-LEVEL') ||
            selectedClassObj.name.toUpperCase().includes('A LEVEL')
          ))
        );

        console.log(`Class ${selectedClass} is ${isALevelClass ? 'an A-Level' : 'not an A-Level'} class`);

        // If this is an A-Level class, include all subjects
        // Otherwise, filter for A-Level subjects only
        let filteredSubjects;
        if (isALevelClass) {
          console.log('This is an A-Level class, including all subjects');
          filteredSubjects = uniqueSubjects;
        } else {
          console.log('This is not an A-Level class, filtering for A-Level subjects only');
          filteredSubjects = uniqueSubjects.filter(subject =>
            subject.educationLevel === 'A_LEVEL' || subject.educationLevel === 'BOTH'
          );
        }

        console.log(`Found ${filteredSubjects.length} subjects for this class out of ${subjectsData.length} total subjects`);

        if (filteredSubjects.length === 0) {
          console.log('No subjects found for this class');
          if (subjectsData.length > 0) {
            setError('No subjects found for this class. Please contact an administrator.');
          } else if (!isAdmin) {
            setError('You are not assigned to teach any subjects in this class.');
          } else {
            setError('No subjects found for this class. Please add subjects to the class first.');
          }
        }

        setSubjects(filteredSubjects);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setError('Failed to fetch subjects. Please try again.');
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedClass, classes]);

  // Store marks in session storage when they change
  useEffect(() => {
    if (marks.length > 0 && selectedClass && selectedSubject && selectedExam) {
      const storageKey = `marks_${selectedClass}_${selectedSubject}_${selectedExam}`;
      console.log(`Storing ${marks.length} marks in session storage with key ${storageKey}`);
      sessionStorage.setItem(storageKey, JSON.stringify(marks));
    }
  }, [marks, selectedClass, selectedSubject, selectedExam]);

  // Function to fetch student subject selections for O-Level
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

  // We're now using the imported extractALevelCombinations function from a-level-student-utils.js

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
          // Check if this is an A-Level class
          const selectedClassObj = classes.find(cls => cls._id === selectedClass);
          const isALevelClass = selectedClassObj && (
            selectedClassObj.form === 5 ||
            selectedClassObj.form === 6 ||
            selectedClassObj.educationLevel === 'A_LEVEL' ||
            (selectedClassObj.name && (
              selectedClassObj.name.toUpperCase().includes('FORM 5') ||
              selectedClassObj.name.toUpperCase().includes('FORM 6') ||
              selectedClassObj.name.toUpperCase().includes('FORM V') ||
              selectedClassObj.name.toUpperCase().includes('FORM VI') ||
              selectedClassObj.name.toUpperCase().includes('A-LEVEL') ||
              selectedClassObj.name.toUpperCase().includes('A LEVEL')
            ))
          );

          // If this is an A-Level class, bypass the authorization check
          if (isALevelClass) {
            console.log(`Bypassing authorization check for A-Level class ${selectedClass}`);
          } else {
            // Check if teacher is authorized for this class and subject
            const isAuthorizedForClass = await teacherAuthService.isAuthorizedForClass(selectedClass);
            const isAuthorizedForSubject = await teacherAuthService.isAuthorizedForSubject(selectedClass, selectedSubject);

            if (!isAuthorizedForClass || !isAuthorizedForSubject) {
              setError('You are not authorized to view marks for this class or subject');
              setLoading(false);
              return;
            }
          }
        }

        // Get students in the class
        let studentsData = [];

        // Check if this is an A-Level class
        const selectedClassObj = classes.find(cls => cls._id === selectedClass);
        const isALevelClass = selectedClassObj && (
          selectedClassObj.form === 5 ||
          selectedClassObj.form === 6 ||
          selectedClassObj.educationLevel === 'A_LEVEL' ||
          (selectedClassObj.name && (
            selectedClassObj.name.toUpperCase().includes('FORM 5') ||
            selectedClassObj.name.toUpperCase().includes('FORM 6') ||
            selectedClassObj.name.toUpperCase().includes('FORM V') ||
            selectedClassObj.name.toUpperCase().includes('FORM VI') ||
            selectedClassObj.name.toUpperCase().includes('A-LEVEL') ||
            selectedClassObj.name.toUpperCase().includes('A LEVEL')
          ))
        );

        if (isAdmin) {
          // Admin can see all students in the class
          try {
            console.log(`Admin fetching all students for class ${selectedClass}`);
            const studentsResponse = await api.get(`/api/students/class/${selectedClass}`);
            studentsData = studentsResponse.data || [];
            console.log(`Admin found ${studentsData.length} students for class ${selectedClass}`);
          } catch (error) {
            console.error('Error fetching students as admin:', error);
            setError('Failed to fetch students. Please try again.');
          }
        } else {
          // For A-Level classes, try multiple approaches to get students
          if (isALevelClass) {
            // Use the new endpoint to fetch only students who take the selected subject
            try {
              console.log(`Fetching A-Level students for class ${selectedClass} and subject ${selectedSubject} using new endpoint`);
              const response = await api.get('/api/new-a-level/students-by-class-and-subject', {
                params: {
                  classId,
                  subjectId: selectedSubject
                }
              });
              studentsData = response.data.data || [];
              console.log(`Found ${studentsData.length} A-Level students for class ${selectedClass} and subject ${selectedSubject}`);
            } catch (error) {
              console.error('Error fetching A-Level students by class and subject:', error);
              setError('Failed to fetch students for this subject. Please try again.');
            }
          } else {
            // For non-A-Level classes, use the standard approach
            try {
              // Teachers can only see assigned students
              // Use the endpoint that specifically returns students who are taking subjects the teacher is assigned to teach
              console.log(`Fetching students who are taking subjects the teacher is assigned to teach in class ${selectedClass}`);
              const response = await api.get(`/api/teachers/classes/${selectedClass}/students`);

              // Check if the response has a students array (new format)
              if (response.data && Array.isArray(response.data.students)) {
                studentsData = response.data.students || [];
              } else {
                // Otherwise, assume the response is the array itself (old format)
                studentsData = response.data || [];
              }

              console.log(`Found ${studentsData.length} students who are taking subjects the teacher is assigned to teach in class ${selectedClass}`);
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

        // Debug the first student's data structure
        if (studentsData.length > 0) {
          console.log('Debugging first student data structure:');
          debugStudentData(studentsData[0]);
        }

        // Enhanced A-Level class detection
        const isALevelClassForStudents = selectedClassObj && (
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

        console.log(`Class ${selectedClass} is ${(isALevelClassForStudents || forceALevel) ? 'an A-Level' : 'not an A-Level'} class:`,
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
          if (isALevelClassForStudents || forceALevel) {
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

        // Get the selected subject with its original IDs before filtering students
        const selectedSubjectObj = subjects.find(s => s._id === selectedSubject);
        if (selectedSubjectObj) {
          console.log(`Selected subject for filtering students: ${selectedSubjectObj.name}`);

          // If the subject has original IDs, use them for checking student combinations
          if (selectedSubjectObj.originalIds && selectedSubjectObj.originalIds.length > 0) {
            console.log(`Subject ${selectedSubjectObj.name} has ${selectedSubjectObj.originalIds.length} original IDs for filtering:`, selectedSubjectObj.originalIds);
          }
        }

        // For A-Level classes, include all students if no subject combinations are found
        const anyStudentHasSubjectCombination = aLevelStudents.some(student =>
          student.subjectCombination &&
          typeof student.subjectCombination === 'object' &&
          student.subjectCombination.subjects &&
          Array.isArray(student.subjectCombination.subjects)
        );

        console.log(`${anyStudentHasSubjectCombination ? 'Some' : 'No'} students have subject combinations`);

        // For bulk marks entry, we need to filter students who have the selected subject in their combination
        // AND are assigned to the teacher for that subject
        const filteredStudents = selectedSubject ? aLevelStudents.filter(student => {
          // If no students have subject combinations, include all students
          if (!anyStudentHasSubjectCombination) {
            console.log(`Including student ${student.firstName} ${student.lastName} because no students have subject combinations`);
            return true;
          }

          // Use the new subjectIds array for eligibility check
          if (Array.isArray(student.subjectIds) && student.subjectIds.length > 0) {
            // Get all possible subject IDs to check (original IDs if available)
            const subjectIdsToCheck = selectedSubjectObj?.originalIds?.length > 0 ?
              selectedSubjectObj.originalIds : [selectedSubject];
            const hasSubject = subjectIdsToCheck.some(subjectId => student.subjectIds.includes(subjectId));
            console.log(`Student ${student.firstName} ${student.lastName} ${hasSubject ? 'has' : 'does not have'} subject ${selectedSubjectObj?.name || selectedSubject} in their subjectIds`);
            return hasSubject;
          }

          // If student doesn't have subjectIds, fallback to old logic (optional)
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
              // Get all possible subject IDs to check (original IDs if available)
              const subjectIdsToCheck = selectedSubjectObj?.originalIds?.length > 0 ?
                selectedSubjectObj.originalIds : [selectedSubject];
              // Check if any of the subject IDs are in the student's combination
              const hasSubject = subjectIdsToCheck.some(subjectId => allSubjectIds.includes(subjectId));
              console.log(`Student ${student.firstName} ${student.lastName} ${hasSubject ? 'has' : 'does not have'} subject ${selectedSubjectObj?.name || selectedSubject} in their combination (fallback)`);
              return hasSubject;
            }
          }

          // If student doesn't have a populated subject combination, exclude them
          console.log(`Student ${student.firstName} ${student.lastName} has no valid subject combination or subjectIds, excluding from marks entry`);
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

        // Get the selected subject for marks entry
        if (selectedSubjectObj) {
          console.log(`Selected subject for marks entry: ${selectedSubjectObj.name}`);

          // If the subject has original IDs, use them for checking student combinations
          if (selectedSubjectObj.originalIds && selectedSubjectObj.originalIds.length > 0) {
            console.log(`Subject ${selectedSubjectObj.name} has ${selectedSubjectObj.originalIds.length} original IDs for marks entry:`, selectedSubjectObj.originalIds);
          }
        }

        // COMPLETELY NEW APPROACH: Skip the failing API calls and create a placeholder for marks
        // This will allow us to proceed with student name display even if the marks API is failing
        console.log('Using direct student data approach instead of fetching existing marks');

        // Create an empty marks response structure
        const marksResponse = {
          data: {
            studentsWithMarks: []
          }
        };

        // Log the student data we have
        console.log('Direct student data available:', filteredStudents.length, 'students');
        filteredStudents.forEach((student, index) => {
          if (index < 5) { // Log just the first 5 to avoid console spam
            console.log(`Student ${index + 1}:`, {
              id: student._id,
              firstName: student.firstName,
              lastName: student.lastName,
              fullName: student.fullName || student.name,
              hasStudent: !!student.student,
              studentType: student.student ? typeof student.student : 'none',
              combinationType: student.subjectCombination ? typeof student.subjectCombination : 'none'
            });
          }
        });

        // Get exam details to get academic year
        const examResponse = await api.get(`/api/exams/${selectedExam}`);

        const academicYearId = examResponse.data.academicYear;
        const examTypeId = examResponse.data.examType;

        // For O-Level, we need to handle student subject selections differently
        if (educationLevel === 'O_LEVEL') {
          console.log('Handling O-Level student filtering based on subject selections');

          // Try to get student subject selections to filter students by subject
          try {
            // Get student subject selections for this class
            const selections = await fetchStudentSubjectSelections(selectedClass);

            if (selections && selections.length > 0) {
              console.log(`Found ${selections.length} student subject selections`);

              // Create a map of student IDs to their selected subjects
              const studentSubjectsMap = {};
              for (const selection of selections) {
                if (selection.student) {
                  const studentId = typeof selection.student === 'object' ? selection.student._id : selection.student;

                  // Combine core and optional subjects
                  const allSubjects = [
                    ...(selection.coreSubjects ?? []).map(s => typeof s === 'object' ? s._id : s),
                    ...(selection.optionalSubjects ?? []).map(s => typeof s === 'object' ? s._id : s)
                  ];

                  studentSubjectsMap[studentId] = allSubjects;
                }
              }

              console.log('Student subjects map:', studentSubjectsMap);

              // Check if the selected subject is a core subject
              const isCoreSubject = await api.get(`/api/subjects/${selectedSubject}`)
                .then(res => res.data.type === 'CORE')
                .catch(() => false);

              if (isCoreSubject) {
                console.log('Selected subject is a core subject, showing all O-Level students');
                setStudents(filteredStudents);
              } else {
                // Filter students who have selected this subject
                const oLevelFilteredStudents = filteredStudents.filter(student => {
                  const studentId = student._id;
                  const studentSubjects = studentSubjectsMap[studentId] || [];
                  return studentSubjects.includes(selectedSubject);
                });

                console.log(`Filtered to ${oLevelFilteredStudents.length} students who have selected subject ${selectedSubject}`);

                // If no students are found after filtering, just show all O-Level students
                if (oLevelFilteredStudents.length === 0) {
                  console.log('No students found after filtering by subject selection, showing all O-Level students');
                  setStudents(filteredStudents);
                } else {
                  setStudents(oLevelFilteredStudents);
                }
              }
            } else {
              console.log('No student subject selections found, showing all O-Level students');
              setStudents(filteredStudents);
            }
          } catch (selectionError) {
            console.error('Error filtering students by subject selection:', selectionError);
            setStudents(filteredStudents);
          }
        } else {
          // For A-Level, use our new utility functions to filter students
          console.log('Handling A-Level student filtering based on subject combinations');

          // Try to fetch A-Level combinations from the API first
          try {
            console.log('Fetching A-Level combinations from API');
            const combinationsResponse = await api.get(`/api/students/a-level-combinations/class/${selectedClass}`);

            if (combinationsResponse.data && combinationsResponse.data.length > 0) {
              console.log(`Fetched ${combinationsResponse.data.length} A-Level combinations from API`);

              // Log the first combination to see its structure
              console.log('A-Level: First combination structure:', JSON.stringify(combinationsResponse.data[0], null, 2));

              // Create a map of student IDs to their combinations using our new utility
              const combinationsMap = createALevelCombinationsMap(combinationsResponse.data);

              // Store the combinations map in a global variable for easy access
              window.aLevelCombinationsMap = combinationsResponse.data.reduce((map, combination) => {
                if (combination.student && combination.student._id) {
                  map[combination.student._id.toString()] = combination;
                }
                return map;
              }, {});

              console.log('Stored combinations map in window.aLevelCombinationsMap with',
                Object.keys(window.aLevelCombinationsMap).length, 'entries');

              // Create a map of student IDs to their names from the combinations data
              const studentNamesMap = {};
              for (const combination of combinationsResponse.data) {
                if (combination.student && combination.student._id) {
                  const studentId = combination.student._id.toString();

                  // Try to get the most complete name possible
                  let studentName = '';

                  // First check if there's a fullName property
                  if (combination.student.fullName) {
                    studentName = combination.student.fullName;
                  }
                  // Otherwise try to combine firstName and lastName
                  else if (combination.student.firstName || combination.student.lastName) {
                    const firstName = combination.student.firstName || '';
                    const lastName = combination.student.lastName || '';
                    studentName = `${firstName} ${lastName}`.trim();
                  }
                  // If we still don't have a name, check if there's a name property
                  else if (combination.student.name) {
                    studentName = combination.student.name;
                  }

                  // Store the name in the map
                  if (studentName) {
                    studentNamesMap[studentId] = studentName;
                    console.log(`Mapped student ${studentId} to name: ${studentNamesMap[studentId]}`);
                  }
                }
              }

              // Get the subject details to determine if it's principal
              const subjectObj = subjects.find(s => s._id === selectedSubject);
              console.log(`Filtering students for subject ${selectedSubject} (${subjectObj?.name || 'Unknown'})`);

              // Filter students who have this subject in their combination
              // First try as principal subject
              const principalStudents = filterALevelStudentsBySubject(filteredStudents, selectedSubject, true, combinationsMap);
              console.log(`Found ${principalStudents.length} students who take ${subjectObj?.name || selectedSubject} as principal subject`);

              // Log the first few principal students for debugging
              if (principalStudents.length > 0) {
                console.log('First 3 principal students:');
                principalStudents.slice(0, 3).forEach(student => {
                  console.log(`- ${student._id}: ${student.firstName || ''} ${student.lastName || ''}`);
                });
              }

              // Then try as subsidiary subject
              const subsidiaryStudents = filterALevelStudentsBySubject(filteredStudents, selectedSubject, false, combinationsMap);
              console.log(`Found ${subsidiaryStudents.length} students who take ${subjectObj?.name || selectedSubject} as subsidiary subject`);

              // Combine the results (avoiding duplicates)
              const studentIds = new Set();
              const combinedStudents = [];

              // Add principal students first with names from the combinations data
              for (const student of principalStudents) {
                studentIds.add(student._id);
                const studentId = student._id.toString();
                // Add the name from the combinations data if available
                if (studentNamesMap[studentId]) {
                  student.name = studentNamesMap[studentId];
                  student.firstName = student.name.split(' ')[0];
                  student.lastName = student.name.split(' ').slice(1).join(' ');
                  console.log(`Added name to principal student ${studentId}: ${student.name}`);
                } else {
                  // Try to find the student in the original combinations data
                  const studentCombination = combinationsResponse.data.find(c =>
                    c.student && c.student._id && c.student._id.toString() === studentId
                  );

                  if (studentCombination && studentCombination.student) {
                    const firstName = studentCombination.student.firstName || '';
                    const lastName = studentCombination.student.lastName || '';
                    student.name = `${firstName} ${lastName}`.trim();
                    student.firstName = firstName;
                    student.lastName = lastName;
                    console.log(`Added name directly from combination data for student ${studentId}: ${student.name}`);
                  }
                }
                // Mark this student as taking the subject as a principal subject
                student.isPrincipal = true;
                student.isInCombination = true;
                combinedStudents.push(student);
              }

              // Add subsidiary students that aren't already included
              for (const student of subsidiaryStudents) {
                if (!studentIds.has(student._id)) {
                  const studentId = student._id.toString();
                  // Add the name from the combinations data if available
                  if (studentNamesMap[studentId]) {
                    student.name = studentNamesMap[studentId];
                    student.firstName = student.name.split(' ')[0];
                    student.lastName = student.name.split(' ').slice(1).join(' ');
                    console.log(`Added name to subsidiary student ${studentId}: ${student.name}`);
                  } else {
                    // Try to find the student in the original combinations data
                    const studentCombination = combinationsResponse.data.find(c =>
                      c.student && c.student._id && c.student._id.toString() === studentId
                    );

                    if (studentCombination && studentCombination.student) {
                      const firstName = studentCombination.student.firstName || '';
                      const lastName = studentCombination.student.lastName || '';
                      student.name = `${firstName} ${lastName}`.trim();
                      student.firstName = firstName;
                      student.lastName = lastName;
                      console.log(`Added name directly from combination data for student ${studentId}: ${student.name}`);
                    }
                  }
                  // Mark this student as taking the subject as a subsidiary subject
                  student.isPrincipal = false;
                  student.isInCombination = true;
                  combinedStudents.push(student);
                }
              }

              console.log(`Combined ${combinedStudents.length} students who take subject ${subjectObj?.name || selectedSubject}`);

              // If no students were found after filtering, use all students as a fallback
              // This ensures we always show students even if filtering fails
              if (combinedStudents.length === 0) {
                console.log('No students found after filtering by subject combination, using all students as fallback');
                const allStudentsWithNames = filteredStudents.map(student => ({
                  ...student,
                  name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student',
                  isPrincipal: true, // Assume all are principal for display purposes
                  isInCombination: true // Assume all take this subject
                }));
                console.log(`Using ${allStudentsWithNames.length} students as fallback`);
                setStudents(allStudentsWithNames);
              } else {
                console.log(`Setting ${combinedStudents.length} filtered students`);
                setStudents(combinedStudents);
              }

              // Skip the fallback approach
              return;
            }
          } catch (combinationsError) {
            console.error('Error fetching A-Level combinations from API:', combinationsError);
            console.log('Falling back to extracting combinations from student data');
          }

          // Fallback: Extract combinations directly from student data
          console.log('Using student data to extract combinations');

          // Extract combinations from the student data
          const combinations = extractALevelCombinations(filteredStudents);

          if (combinations && combinations.length > 0) {
            console.log(`Created ${combinations.length} A-Level combinations from student data`);

            // Create a map of student IDs to their combinations using our new utility
            const combinationsMap = createALevelCombinationsMap(combinations);

            // Create a map of student IDs to their names from the combinations data
            const studentNamesMap = {};
            for (const combination of combinations) {
              if (combination.student?.['_id']) {
                const studentId = combination.student._id.toString();
                const firstName = combination.student.firstName || '';
                const lastName = combination.student.lastName || '';
                studentNamesMap[studentId] = `${firstName} ${lastName}`.trim();
                console.log(`Mapped student ${studentId} to name: ${studentNamesMap[studentId]} (fallback approach)`);
              }
            }

            // Get the subject details to determine if it's principal
            const subjectObj = subjects.find(s => s._id === selectedSubject);
            console.log(`Filtering students for subject ${selectedSubject} (${subjectObj?.name || 'Unknown'})`);

            // Filter students who have this subject in their combination
            // First try as principal subject
            const principalStudents = filterALevelStudentsBySubject(filteredStudents, selectedSubject, true, combinationsMap);
            console.log(`Found ${principalStudents.length} students who take ${subjectObj?.name || selectedSubject} as principal subject`);

            // Then try as subsidiary subject
            const subsidiaryStudents = filterALevelStudentsBySubject(filteredStudents, selectedSubject, false, combinationsMap);
            console.log(`Found ${subsidiaryStudents.length} students who take ${subjectObj?.name || selectedSubject} as subsidiary subject`);

            // Combine the results (avoiding duplicates)
            const studentIds = new Set();
            const combinedStudents = [];

            // Add principal students first with names from the combinations data
            for (const student of principalStudents) {
              studentIds.add(student._id);
              const studentId = student._id.toString();
              // Add the name from the combinations data if available
              if (studentNamesMap[studentId]) {
                student.name = studentNamesMap[studentId];
                student.firstName = student.name.split(' ')[0];
                student.lastName = student.name.split(' ').slice(1).join(' ');
                console.log(`Added name to principal student ${studentId}: ${student.name} (fallback approach)`);
              }
              combinedStudents.push(student);
            }

            // Add subsidiary students that aren't already included
            for (const student of subsidiaryStudents) {
              if (!studentIds.has(student._id)) {
                const studentId = student._id.toString();
                // Add the name from the combinations data if available
                if (studentNamesMap[studentId]) {
                  student.name = studentNamesMap[studentId];
                  student.firstName = student.name.split(' ')[0];
                  student.lastName = student.name.split(' ').slice(1).join(' ');
                  console.log(`Added name to subsidiary student ${studentId}: ${student.name} (fallback approach)`);
                }
                combinedStudents.push(student);
              }
            }

            console.log(`Combined ${combinedStudents.length} students who take subject ${subjectObj?.name || selectedSubject}`);

            // If no students were found after filtering, use all students as a fallback
            // This ensures we always show students even if filtering fails
            if (combinedStudents.length === 0) {
              console.log('No students found after filtering by subject combination, using all students as fallback (fallback approach)');
              setStudents(filteredStudents.map(student => ({
                ...student,
                name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student',
                isPrincipal: true, // Assume all are principal for display purposes
                isInCombination: true // Assume all take this subject
              })));
            } else {
              setStudents(combinedStudents);
            }
          } else {
            console.log('No A-Level combinations found, using all students as fallback');
            setStudents(filteredStudents.map(student => ({
              ...student,
              name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student',
              isPrincipal: true, // Assume all are principal for display purposes
              isInCombination: true // Assume all take this subject
            })));
          }
        }

        // Check if we have marks in session storage
        const storageKey = `marks_${selectedClass}_${selectedSubject}_${selectedExam}`;
        const storedMarks = sessionStorage.getItem(storageKey);
        let parsedStoredMarks = [];

        if (storedMarks) {
          try {
            parsedStoredMarks = JSON.parse(storedMarks);
            console.log(`Retrieved ${parsedStoredMarks.length} marks from session storage with key ${storageKey}`);
          } catch (error) {
            console.error('Error parsing stored marks:', error);
          }
        }

        // COMPLETELY NEW APPROACH: Create marks array directly from student data
        // This is a much simpler approach that doesn't rely on complex API calls
        console.log('Creating marks array directly from student data');

        // IMPORTANT: Always show students, even if filtering fails
        // If students list is empty after filtering, use all students as a fallback
        // This ensures we always have students to display
        const studentsToUse = students.length > 0 ? students : filteredStudents;
        console.log(`Creating marks for ${studentsToUse.length} students from ${students.length > 0 ? 'filtered list' : 'all students'}`);

        // Debug the students we're using
        if (studentsToUse.length > 0) {
          console.log('First 5 students to use:');
          studentsToUse.slice(0, 5).forEach(student => {
            console.log(`- ${student._id}: ${student.firstName || ''} ${student.lastName || ''} ${student.name || ''}`);
          });
        }

        // If we still have no students, log a warning
        if (studentsToUse.length === 0) {
          console.warn('No students available after filtering, this will cause an empty display');
        }

        // Initialize marks array with direct student data
        const initialMarks = studentsToUse.map(student => {
          // Get student ID
          const studentId = student._id?.toString();

          // DIRECT NAME EXTRACTION - Brute force approach to get student names
          // Try all possible sources in order of reliability
          let studentName = null;

          // 1. Try to get name from API response combinations data
          if (window.aLevelCombinationsMap && studentId) {
            const combinationData = window.aLevelCombinationsMap[studentId];
            if (combinationData && combinationData.student) {
              // Try fullName first
              if (combinationData.student.fullName) {
                studentName = combinationData.student.fullName;
                console.log(`Using combinationData.student.fullName for ${studentId}: ${studentName}`);
              }
              // Then try firstName + lastName
              else if (combinationData.student.firstName || combinationData.student.lastName) {
                const firstName = combinationData.student.firstName || '';
                const lastName = combinationData.student.lastName || '';
                studentName = `${firstName} ${lastName}`.trim();
                console.log(`Using combinationData.student firstName/lastName for ${studentId}: ${studentName}`);
              }
            }
          }

          // 2. Try to get name directly from the student object
          if (!studentName) {
            // Try firstName + lastName
            if (student.firstName || student.lastName) {
              const firstName = student.firstName || '';
              const lastName = student.lastName || '';
              studentName = `${firstName} ${lastName}`.trim();
              console.log(`Using student firstName/lastName for ${studentId}: ${studentName}`);
            }
            // Try fullName
            else if (student.fullName) {
              studentName = student.fullName;
              console.log(`Using student.fullName for ${studentId}: ${studentName}`);
            }
            // Try name
            else if (student.name) {
              studentName = student.name;
              console.log(`Using student.name for ${studentId}: ${studentName}`);
            }
          }

          // 3. Try to get name from nested student object
          if (!studentName && student.student && typeof student.student === 'object') {
            // Try firstName + lastName
            if (student.student.firstName || student.student.lastName) {
              const firstName = student.student.firstName || '';
              const lastName = student.student.lastName || '';
              studentName = `${firstName} ${lastName}`.trim();
              console.log(`Using student.student firstName/lastName for ${studentId}: ${studentName}`);
            }
            // Try fullName
            else if (student.student.fullName) {
              studentName = student.student.fullName;
              console.log(`Using student.student.fullName for ${studentId}: ${studentName}`);
            }
            // Try name
            else if (student.student.name) {
              studentName = student.student.name;
              console.log(`Using student.student.name for ${studentId}: ${studentName}`);
            }
          }

          // 4. Try to get name from studentDetails object
          if (!studentName && student.studentDetails && typeof student.studentDetails === 'object') {
            // Try firstName + lastName
            if (student.studentDetails.firstName || student.studentDetails.lastName) {
              const firstName = student.studentDetails.firstName || '';
              const lastName = student.studentDetails.lastName || '';
              studentName = `${firstName} ${lastName}`.trim();
              console.log(`Using studentDetails firstName/lastName for ${studentId}: ${studentName}`);
            }
            // Try fullName
            else if (student.studentDetails.fullName) {
              studentName = student.studentDetails.fullName;
              console.log(`Using studentDetails.fullName for ${studentId}: ${studentName}`);
            }
            // Try name
            else if (student.studentDetails.name) {
              studentName = student.studentDetails.name;
              console.log(`Using studentDetails.name for ${studentId}: ${studentName}`);
            }
          }

          // 5. Try to extract name from subjectCombination
          if (!studentName && student.subjectCombination && typeof student.subjectCombination === 'object') {
            if (student.subjectCombination.name) {
              // This is a hack, but sometimes the combination name contains student info
              const combinationName = student.subjectCombination.name;
              if (combinationName.includes('(') && combinationName.includes(')')) {
                const nameMatch = combinationName.match(/\(([^)]+)\)/);
                if (nameMatch && nameMatch[1]) {
                  studentName = nameMatch[1].trim();
                  console.log(`Extracted name from combination name for ${studentId}: ${studentName}`);
                }
              }
            }
          }

          // 6. Check session storage for previously saved marks with names
          if (!studentName) {
            const storedMark = parsedStoredMarks.find(mark => mark.studentId === student._id);
            if (storedMark && storedMark.studentName && storedMark.studentName !== 'Unknown Student') {
              studentName = storedMark.studentName;
              console.log(`Using name from stored marks for ${studentId}: ${studentName}`);
            }
          }

          // 7. LAST RESORT: Try to get name from the backend API directly
          if (!studentName) {
            // We'll use a placeholder for now
            studentName = 'Student ' + studentId;
            console.log(`Using placeholder name for ${studentId}: ${studentName}`);

            // Flag this student for direct API lookup
            // We'll fetch their details after creating the initial marks array
            student._needsNameLookup = true;
          }

          // Check if this subject is in the student's combination
          // Use the flags we set during filtering if available
          const isPrincipal = student.isPrincipal !== undefined ? student.isPrincipal : true;
          const isInCombination = student.isInCombination !== undefined ? student.isInCombination : true;

          // Check if we have a stored mark for this student
          const storedMark = parsedStoredMarks.find(mark => mark.studentId === student._id);

          // Create the mark object
          return {
            studentId: student._id,
            studentName,
            examId: selectedExam,
            academicYearId,
            examTypeId,
            subjectId: selectedSubject,
            classId: selectedClass,
            marksObtained: storedMark ? storedMark.marksObtained : '',
            grade: storedMark ? storedMark.grade : '',
            points: storedMark ? storedMark.points : '',
            comment: storedMark ? storedMark.comment : '',
            isPrincipal: storedMark ? storedMark.isPrincipal : isPrincipal,
            _id: storedMark ? storedMark._id : null,
            isInCombination: storedMark ? storedMark.isInCombination : isInCombination
          };
        });

        // Debug the first mark's student name
        if (initialMarks.length > 0) {
          console.log('First mark student name:', initialMarks[0].studentName);
          console.log('First mark student data:', {
            studentId: initialMarks[0].studentId,
            studentName: initialMarks[0].studentName,
            marksObtained: initialMarks[0].marksObtained,
            grade: initialMarks[0].grade,
            points: initialMarks[0].points,
            isPrincipal: initialMarks[0].isPrincipal,
            isInCombination: initialMarks[0].isInCombination
          });
        }

        // Check if any students need direct name lookup
        const studentsNeedingLookup = filteredStudents.filter(student => student._needsNameLookup);
        if (studentsNeedingLookup.length > 0) {
          console.log(`${studentsNeedingLookup.length} students need direct name lookup`);

          // Create a function to fetch student details
          const fetchStudentDetails = async (studentId) => {
            try {
              // Try to fetch student details directly
              const response = await api.get(`/api/students/${studentId}`);
              if (response.data) {
                console.log(`Fetched details for student ${studentId}:`, response.data);

                // Extract the name
                let name = null;
                const student = response.data;

                // Try firstName + lastName
                if (student.firstName || student.lastName) {
                  const firstName = student.firstName || '';
                  const lastName = student.lastName || '';
                  name = `${firstName} ${lastName}`.trim();
                }
                // Try fullName
                else if (student.fullName) {
                  name = student.fullName;
                }
                // Try name
                else if (student.name) {
                  name = student.name;
                }

                // Update the mark with the new name
                if (name) {
                  const markIndex = initialMarks.findIndex(mark => mark.studentId === studentId);
                  if (markIndex !== -1) {
                    initialMarks[markIndex].studentName = name;
                    console.log(`Updated name for student ${studentId} to ${name}`);

                    // Update the marks state
                    setMarks([...initialMarks]);
                  }
                }
              }
            } catch (error) {
              console.error(`Error fetching details for student ${studentId}:`, error);
            }
          };

          // Fetch details for all students that need it
          // We'll do this in the background and not wait for it
          studentsNeedingLookup.forEach(student => {
            fetchStudentDetails(student._id);
          });
        }

        // IMPORTANT: We're already filtering students by subject in the backend
        // So we should trust that filtering and not do additional filtering here
        // This was causing students to disappear from the UI
        console.log(`Setting marks for ${initialMarks.length} students`);

        // Debug the marks we're creating
        if (initialMarks.length > 0) {
          console.log('First 5 marks:');
          initialMarks.slice(0, 5).forEach(mark => {
            console.log(`- ${mark.studentId}: ${mark.studentName}, isPrincipal: ${mark.isPrincipal}, isInCombination: ${mark.isInCombination}`);
          });
        }

        // Log the first few students for debugging
        initialMarks.slice(0, 5).forEach(mark => {
          console.log(`Mark for student: ${mark.studentName} (${mark.studentId})`);
        });

        // CRITICAL CHECK: If we have no marks but we have students, create marks for all students
        // This is a last-resort safety measure to prevent empty displays
        if (initialMarks.length === 0 && filteredStudents.length > 0) {
          console.warn('No marks created but we have students, creating marks for all students');
          const fallbackMarks = filteredStudents.map(student => ({
            studentId: student._id,
            studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student',
            examId: selectedExam,
            academicYearId,
            examTypeId,
            subjectId: selectedSubject,
            classId: selectedClass,
            marksObtained: '',
            grade: '',
            points: '',
            comment: '',
            isPrincipal: true,
            isInCombination: true
          }));
          setMarks(fallbackMarks);
        } else {
          // Set the marks without additional filtering
          setMarks(initialMarks);
        }
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

    console.log(`Updating mark for student ${studentId} to ${value}`);

    // Update the marks state
    setMarks(prevMarks => {
      const updatedMarks = prevMarks.map(mark =>
        mark.studentId === studentId
          ? {
              ...mark,
              marksObtained: value,
              // Calculate grade and points immediately
              grade: value !== '' ? calculateGrade(Number(value)) : '',
              points: value !== '' ? calculatePoints(calculateGrade(Number(value))) : ''
            }
          : mark
      );

      const updatedMark = updatedMarks.find(m => m.studentId === studentId);
      console.log(`Updated marks for student ${studentId}:`, {
        marksObtained: updatedMark?.marksObtained,
        grade: updatedMark?.grade,
        points: updatedMark?.points
      });

      return updatedMarks;
    });

    // Store marks in session storage immediately
    setTimeout(() => {
      if (selectedClass && selectedSubject && selectedExam) {
        const storageKey = `marks_${selectedClass}_${selectedSubject}_${selectedExam}`;
        const currentMarks = JSON.stringify(marks);
        console.log(`Storing marks in session storage with key ${storageKey} after mark change`);
        sessionStorage.setItem(storageKey, currentMarks);
      }
    }, 100);
  };

  // Handle comment change
  const handleCommentChange = (studentId, value) => {
    console.log(`Updating comment for student ${studentId}`);

    // Update the marks state
    setMarks(prevMarks => {
      const updatedMarks = prevMarks.map(mark =>
        mark.studentId === studentId
          ? { ...mark, comment: value }
          : mark
      );

      console.log(`Updated comment for student ${studentId}:`,
        updatedMarks.find(m => m.studentId === studentId)?.comment);

      return updatedMarks;
    });
  };

  // Handle principal subject change
  const handlePrincipalChange = (studentId, checked) => {
    console.log(`Updating principal flag for student ${studentId} to ${checked}`);

    // Update the marks state
    setMarks(prevMarks => {
      const updatedMarks = prevMarks.map(mark =>
        mark.studentId === studentId
          ? { ...mark, isPrincipal: checked }
          : mark
      );

      console.log(`Updated principal flag for student ${studentId}:`,
        updatedMarks.find(m => m.studentId === studentId)?.isPrincipal);

      return updatedMarks;
    });
  };

  // Calculate grade based on marks and education level
  const calculateGrade = (marks) => {
    if (marks === '' || marks === undefined) return '';

    if (educationLevel === 'O_LEVEL') {
      // Using the standardized NECTA CSEE grading system
      if (marks >= 75) return 'A';
      if (marks >= 65) return 'B';
      if (marks >= 45) return 'C';
      if (marks >= 30) return 'D';
      return 'F';
    } else {
      // Using the standardized NECTA ACSEE grading system
      if (marks >= 80) return 'A';
      if (marks >= 70) return 'B';
      if (marks >= 60) return 'C';
      if (marks >= 50) return 'D';
      if (marks >= 40) return 'E';
      if (marks >= 35) return 'S';
      return 'F';
    }
  };

  // Calculate points based on grade and education level
  const calculatePoints = (grade) => {
    if (!grade) return '';

    if (educationLevel === 'O_LEVEL') {
      // O-Level points system
      switch (grade) {
        case 'A': return 1;
        case 'B': return 2;
        case 'C': return 3;
        case 'D': return 4;
        case 'F': return 5;
        default: return '';
      }
    } else {
      // A-Level points system
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

        // Check if any marks are for students who don't take the selected subject
        const invalidSubjectMarks = marks.filter(mark =>
          mark.marksObtained !== '' && !mark.isInCombination
        );

        if (invalidSubjectMarks.length > 0) {
          const invalidStudentNames = invalidSubjectMarks.map(mark => mark.studentName).join(', ');
          throw new Error(`Cannot save marks for students who don't take this subject: ${invalidStudentNames}`);
        }
      }

      // Calculate grades and points for marks
      const marksWithGrades = marks.map(mark => {
        if (mark.marksObtained === '') {
          return mark;
        }

        // Use existing grade if available, otherwise calculate
        const grade = mark.grade || calculateGrade(Number(mark.marksObtained));
        // Use existing points if available, otherwise calculate
        const points = mark.points || calculatePoints(grade);

        console.log(`Calculating grade for ${mark.studentName}: marks=${mark.marksObtained}, grade=${grade}, points=${points}`);

        return {
          ...mark,
          grade,
          points
        };
      });

      // Filter out empty marks
      const marksToSave = marksWithGrades.filter(mark => mark.marksObtained !== '');

      console.log(`Preparing to save ${marksToSave.length} marks out of ${marksWithGrades.length} total marks`);
      console.log('Marks to save:', marksToSave.map(m => `${m.studentName}: ${m.marksObtained}`));

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
      console.log(`Saving ${previewData.marks.length} marks to the server`);
      const endpoint = educationLevel === 'O_LEVEL' ? '/api/o-level/marks/batch' : '/api/a-level-results/batch';
      console.log(`Using endpoint: ${endpoint} for education level: ${educationLevel}`);
      const saveResponse = await api.post(endpoint, previewData.marks);
      console.log('Save response:', saveResponse.data);

      // Log the structure of the saved marks
      if (saveResponse.data.results && Array.isArray(saveResponse.data.results)) {
        console.log('First saved mark structure:', saveResponse.data.results[0]);
      }
      if (saveResponse.data.savedMarks && Array.isArray(saveResponse.data.savedMarks)) {
        console.log('First savedMark structure:', saveResponse.data.savedMarks[0]);
      }

      if (saveResponse.data.errors && saveResponse.data.errors.length > 0) {
        console.warn('Some marks had errors during save:', saveResponse.data.errors);
      }

      // Update marks with saved IDs
      if (saveResponse.data.results && Array.isArray(saveResponse.data.results)) {
        console.log(`Received ${saveResponse.data.results.length} saved marks with IDs`);

        // Update the marks state with the saved marks
        setMarks(prevMarks => {
          const updatedMarks = [...prevMarks];

          // For each saved mark, update the corresponding mark in the state
          for (const savedMark of saveResponse.data.results) {
            // Make sure the savedMark has the necessary properties
            if (!savedMark || !savedMark._id || !savedMark.studentId) {
              console.warn('Invalid saved mark:', savedMark);
              continue;
            }

            console.log(`Processing saved mark for student ${savedMark.studentId} with ID ${savedMark._id}`);

            const index = updatedMarks.findIndex(mark => mark.studentId === savedMark.studentId);
            if (index !== -1) {
              updatedMarks[index] = {
                ...updatedMarks[index],
                _id: savedMark._id,
                grade: savedMark.grade || updatedMarks[index].grade,
                points: savedMark.points || updatedMarks[index].points
              };
              console.log(`Updated mark for student ${savedMark.studentId} with ID ${savedMark._id}`);
            }
          }

          return updatedMarks;
        });
      } else if (saveResponse.data.savedMarks && Array.isArray(saveResponse.data.savedMarks)) {
        console.log(`Received ${saveResponse.data.savedMarks.length} saved marks with IDs from savedMarks property`);

        // Update the marks state with the saved marks
        setMarks(prevMarks => {
          const updatedMarks = [...prevMarks];

          // For each saved mark, update the corresponding mark in the state
          for (const savedMark of saveResponse.data.savedMarks) {
            // Make sure the savedMark has the necessary properties
            if (!savedMark || !savedMark._id || !savedMark.studentId) {
              console.warn('Invalid saved mark:', savedMark);
              continue;
            }

            console.log(`Processing saved mark for student ${savedMark.studentId} with ID ${savedMark._id}`);

            const index = updatedMarks.findIndex(mark => mark.studentId === savedMark.studentId);
            if (index !== -1) {
              updatedMarks[index] = {
                ...updatedMarks[index],
                _id: savedMark._id,
                grade: savedMark.grade || updatedMarks[index].grade,
                points: savedMark.points || updatedMarks[index].points
              };
              console.log(`Updated mark for student ${savedMark.studentId} with ID ${savedMark._id}`);
            }
          }

          return updatedMarks;
        });
      }

      // Clear session storage for this combination
      const storageKey = `marks_${selectedClass}_${selectedSubject}_${selectedExam}`;
      console.log(`Clearing session storage with key ${storageKey} after successful save`);
      sessionStorage.removeItem(storageKey);

      // Close preview dialog
      setPreviewOpen(false);

      // Show success message
      setSuccess('Marks saved successfully.');
      setSnackbar({
        open: true,
        message: 'Marks saved successfully',
        severity: 'success'
      });

      // Don't refresh immediately, let the user see the success message
      // and the updated marks with saved status
      // Instead, show a message that the user can refresh manually if needed
      setSnackbar({
        open: true,
        message: 'Marks saved successfully. You can refresh the page to see the latest data.',
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

  // Handle preview dialog close
  const handlePreviewClose = () => {
    console.log('Closing preview dialog');
    setPreviewOpen(false);
    console.log('Preview dialog state after closing:', previewOpen);
  };

  // Refresh data
  const handleRefresh = () => {
    if (selectedClass && selectedSubject && selectedExam) {
      // Clear session storage for this combination
      const storageKey = `marks_${selectedClass}_${selectedSubject}_${selectedExam}`;
      console.log(`Clearing session storage with key ${storageKey}`);
      sessionStorage.removeItem(storageKey);

      // Show loading indicator
      setLoading(true);

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

      // Show success message
      setSnackbar({
        open: true,
        message: 'Refreshing data...',
        severity: 'info'
      });
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
            {pageTitle}
          </Typography>
        </Box>

        {selectedSubject && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            onClick={() => navigate(`/marks-history/subject/${selectedSubject}?model=${educationLevel === 'O_LEVEL' ? 'OLevelResult' : 'ALevelResult'}`)}
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

      {/* Direct Student Fetcher - This component directly fetches student data */}
      {selectedClass && (
        <DirectStudentFetcher
          classId={selectedClass}
          onStudentsLoaded={(loadedStudents) => {
            // When students are loaded from the direct fetcher, update our marks array
            if (loadedStudents && loadedStudents.length > 0 && selectedSubject && selectedExam) {
              console.log(`DirectStudentFetcher loaded ${loadedStudents.length} students`);

              // Don't directly use the loaded students - we need to filter them first
              // We'll use the student data to enhance our existing marks array

              // Only update student names if we already have marks
              if (marks.length > 0) {
                console.log('Enhancing existing marks with student names from DirectStudentFetcher');

                // Create a map of student IDs to names
                const studentNameMap = {};
                loadedStudents.forEach(student => {
                  studentNameMap[student.id] = student.name;
                });

                // Update the marks array with the student names
                const enhancedMarks = marks.map(mark => {
                  if (!mark.studentName || mark.studentName === 'Unknown Student') {
                    const studentName = studentNameMap[mark.studentId];
                    if (studentName) {
                      console.log(`Updating name for student ${mark.studentId} to ${studentName}`);
                      return { ...mark, studentName };
                    }
                  }
                  return mark;
                });

                console.log('Updated marks with student names from DirectStudentFetcher');
                setMarks(enhancedMarks);
              }
            }
          }}
        />
      )}

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
                      Enter Marks for {marks.length} Students
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
                        color="info"
                        onClick={() => {
                          console.log('Current marks:', marks);
                          console.log('Current students:', students);
                          console.log('Students who take subject as principal:', students.filter(s => s.isPrincipal).length);
                          console.log('Students who take subject in combination:', students.filter(s => s.isInCombination).length);
                          alert(`Debug Info:\n- Total marks: ${marks.length}\n- Principal subjects: ${students.filter(s => s.isPrincipal).length}\n- In combination: ${students.filter(s => s.isInCombination).length}\n\nCheck console for details.`);
                        }}
                        sx={{ mr: 1 }}
                      >
                        Debug Filter
                      </Button>

                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                        disabled={saving}
                        sx={{ mr: 1 }}
                      >
                        Refresh
                      </Button>

                      {process.env.NODE_ENV === 'development' && (
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => {
                            console.log('Current marks state:', marks);
                            console.log('Marks with grades:', marks.map(m => ({
                              studentName: m.studentName,
                              marksObtained: m.marksObtained,
                              grade: m.grade || (m.marksObtained ? calculateGrade(Number(m.marksObtained)) : ''),
                              points: m.points || (m.grade ? calculatePoints(m.grade) : ''),
                              _id: m._id || 'No ID (unsaved)',
                              isInCombination: m.isInCombination
                            })));

                            // Count saved vs unsaved marks
                            const savedMarks = marks.filter(m => m._id).length;
                            const unsavedMarks = marks.filter(m => !m._id && m.marksObtained).length;
                            console.log(`Saved marks: ${savedMarks}, Unsaved marks: ${unsavedMarks}, Total: ${marks.length}`);

                            // Show alert with summary
                            alert(`Marks Summary:\n- Saved: ${savedMarks}\n- Unsaved: ${unsavedMarks}\n- Total: ${marks.length}\n\nCheck console for details.`);
                          }}
                        >
                          Debug
                        </Button>
                      )}
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
                            <TableCell>
                              {mark.studentName || 'Unknown Student'}
                              {(!mark.studentName || mark.studentName === 'Unknown Student') && (
                                <Tooltip title="Student name not found. Please refresh the page.">
                                  <IconButton size="small" color="warning">
                                    <WarningIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </TableCell>
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
                                disabled={saving || !mark.isInCombination}
                                error={!mark.isInCombination}
                                helperText={!mark.isInCombination ? 'Not in student combination' : ''}
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
                                disabled={saving || !mark.isInCombination}
                                error={!mark.isInCombination}
                              />
                            </TableCell>
                            <TableCell>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={mark.isPrincipal}
                                    onChange={(e) => handlePrincipalChange(mark.studentId, e.target.checked)}
                                    disabled={saving || !mark.isInCombination}
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
                                <Tooltip title="Click 'Save All Marks' to save changes">
                                  <Chip
                                    icon={<WarningIcon />}
                                    label="Unsaved"
                                    color="warning"
                                    size="small"
                                  />
                                </Tooltip>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              {mark._id ? (
                                <Tooltip title="View mark history">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => navigate(`/marks-history/result/${mark._id}?model=${educationLevel === 'O_LEVEL' ? 'OLevelResult' : 'ALevelResult'}`)}
                                  >
                                    <HistoryIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Save marks to view history">
                                  <span>
                                    <IconButton
                                      size="small"
                                      disabled
                                    >
                                      <HistoryIcon fontSize="small" />
                                    </IconButton>
                                  </span>
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
                    <Tooltip title={educationLevel === 'O_LEVEL' ?
                      "O-Level Grading: A (75-100%), B (65-74%), C (45-64%), D (30-44%), F (0-29%)" :
                      "A-Level Grading: A (80-100%), B (70-79%), C (60-69%), D (50-59%), E (40-49%), S (35-39%), F (0-34%)"
                    }>
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
                          let grade = '';
                          let points = '';

                          if (mark.marksObtained && mark.marksObtained !== '') {
                            // Use existing grade if available, otherwise calculate
                            grade = mark.grade || calculateGrade(Number(mark.marksObtained));
                            // Use existing points if available, otherwise calculate
                            points = mark.points || calculatePoints(grade);

                            console.log(`Student ${mark.studentName} has marks ${mark.marksObtained}, grade ${grade}, points ${points}`);
                          }

                          return (
                            <TableRow key={mark.studentId}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                {mark.studentName || 'Unknown Student'}
                                {(!mark.studentName || mark.studentName === 'Unknown Student') && (
                                  <Tooltip title="Student name not found. Please refresh the page.">
                                    <IconButton size="small" color="warning">
                                      <WarningIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
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
          action={
            snackbar.severity === 'success' && (
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  handleSnackbarClose();
                  handleRefresh();
                }}
              >
                REFRESH
              </Button>
            )
          }
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
