import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import InfoIcon from '@mui/icons-material/Info';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import ResultCalculationTypeSelector from './ResultCalculationTypeSelector';

const WorkingSubjectMarksEntry = () => {
  // State variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('67f2fd57dcc60fd7fef2ef1c'); // Default academic year ID
  const [marks, setMarks] = useState({});
  const [marksExistForSubject, setMarksExistForSubject] = useState(false);
  const [studentsWithMarks, setStudentsWithMarks] = useState([]);
  const [calculationType, setCalculationType] = useState('O_LEVEL');
  const user = useSelector((state) => state.user?.user);

  // Fetch initial data when component mounts
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch academic years separately to ensure they're always loaded
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await api.get('/api/academic-years');
        console.log('Academic years loaded:', response.data);

        if (response.data && response.data.length > 0) {
          setAcademicYears(response.data);

          // Set active academic year as default if not already set
          if (!selectedAcademicYear) {
            const activeYear = response.data.find(year => year.isActive);
            if (activeYear) {
              console.log('Setting active academic year:', activeYear);
              setSelectedAcademicYear(activeYear._id);
            } else {
              // If no active year, use the first one
              console.log('No active year found, using first year:', response.data[0]);
              setSelectedAcademicYear(response.data[0]._id);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching academic years:', err);
      }
    };

    fetchAcademicYears();
  }, [selectedAcademicYear]);

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch academic years
      try {
        const academicYearsResponse = await api.get('/api/academic-years');
        console.log('Academic years:', academicYearsResponse.data);

        if (academicYearsResponse.data && academicYearsResponse.data.length > 0) {
          setAcademicYears(academicYearsResponse.data);

          // Set active academic year as default
          const activeYear = academicYearsResponse.data.find(year => year.isActive);
          if (activeYear) {
            console.log('Setting active academic year:', activeYear);
            setSelectedAcademicYear(activeYear._id);
          } else {
            // If no active year, use the first one
            console.log('No active year found, using first year:', academicYearsResponse.data[0]);
            setSelectedAcademicYear(academicYearsResponse.data[0]._id);
          }
        } else {
          console.error('No academic years found');
          setError('No academic years found. Please contact an administrator.');
        }
      } catch (err) {
        console.error('Error fetching academic years:', err);
        setError('Failed to load academic years. Please try again.');
      }

      // Fetch classes
      await fetchClasses();
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchSubjects();
      fetchStudents();
    }
  }, [selectedClass]);

  // Fetch exams when subject is selected
  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchExams();
    }
  }, [selectedClass, selectedSubject]);

  // Check if marks exist for the selected subject, class, exam, and academic year
  const checkExistingMarks = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !selectedExam || !selectedAcademicYear) {
      setMarksExistForSubject(false);
      setStudentsWithMarks([]);
      return;
    }

    try {
      setLoading(true);

      // Call the API to check for existing marks
      const response = await api.get('/marks/check-existing', {
        params: {
          classId: selectedClass,
          subjectId: selectedSubject,
          examId: selectedExam,
          academicYearId: selectedAcademicYear
        }
      });

      if (response.data) {
        setMarksExistForSubject(response.data.hasExistingMarks || false);
        setStudentsWithMarks(response.data.studentsWithMarks || []);

        // Pre-populate marks from existing results
        const newMarks = {};
        if (response.data.studentsWithMarks && response.data.studentsWithMarks.length > 0) {
          for (const student of response.data.studentsWithMarks) {
            if (student.studentId) {
              newMarks[student.studentId] = student.marksObtained.toString();
            }
          }
        }

        setMarks(newMarks);
      }
    } catch (err) {
      console.error('Failed to check for existing marks:', err);
      setError('Failed to check for existing marks');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSubject, selectedExam, selectedAcademicYear]);

  // Fetch classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError('');

      // Use a try-catch block to handle potential errors
      try {
        // First try to get teacher-specific classes
        const response = await api.get('/api/teacher-classes/my-classes');
        console.log('Teacher classes response:', response.data);
        setClasses(response.data);
      } catch (err) {
        console.log('Error fetching teacher classes, falling back to all classes');

        // If that fails, try to get all classes (for admin users)
        if (user?.role === 'admin') {
          console.log('User is admin, fetching all classes');
          const fallbackResponse = await api.get('/api/classes');
          console.log('All classes response:', fallbackResponse.data);
          setClasses(fallbackResponse.data);
        } else {
          // If not admin and teacher classes failed, create a default class
          console.log('Creating default class as fallback');
          setClasses([{
            _id: 'default-class',
            name: 'Default Class',
            stream: 'A',
            section: 'General'
          }]);
        }
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects for selected class
  const fetchSubjects = async () => {
    if (!selectedClass || selectedClass === 'default-class') return;

    try {
      setLoading(true);
      setError('');
      setSubjects([]);

      console.log('Current user:', user);

      // If user is a teacher, use the new dedicated endpoint
      if (user?.role === 'teacher') {
        try {
          console.log('Fetching teacher-specific subjects for class using new endpoint');

          // Get the teacher profile
          const teacherResponse = await api.get('/api/teachers/profile');
          const teacherId = teacherResponse.data._id;
          console.log('Teacher ID:', teacherId);

          // Use the new dedicated endpoint to get teacher-specific subjects for this class
          const response = await api.get(`/api/fixed-subjects/teacher/${teacherId}/class/${selectedClass}`);
          const teacherSubjects = response.data;

          console.log(`Found ${teacherSubjects.length} subjects for teacher in this class:`, teacherSubjects);

          if (teacherSubjects.length > 0) {
            setSubjects(teacherSubjects);
          } else {
            console.log('No subjects found for this teacher in this class');
            setError('You are not assigned to teach any subjects in this class. Please contact an administrator.');
          }
        } catch (err) {
          console.error('Error fetching teacher-specific subjects:', err);
          setError('Failed to load your assigned subjects. Please try again.');
        } finally {
          setLoading(false);
        }
        return; // Exit early for teachers
      }

      // For admin users
      if (user?.role === 'admin') {
        try {
          // Admin users can see all subjects
          console.log('User is admin, fetching all subjects for class');
          const response = await api.get(`/api/fixed-subjects/class/${selectedClass}`);
          const allSubjects = response.data;

          if (allSubjects.length > 0) {
            console.log('All subjects for class:', allSubjects);
            setSubjects(allSubjects);
          } else {
            setError('No subjects found for this class');
          }
        } catch (err) {
          console.error('Error fetching all class subjects:', err);
          setError('Failed to load subjects. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Error in fetchSubjects:', err);
      setError('Failed to load subjects. Please try again.');
      setLoading(false);
    }
  };

  // Fetch students for selected class
  const fetchStudents = async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);
      setError('');

      const response = await api.get(`/api/students/class/${selectedClass}`);
      setStudents(response.data);

      // Initialize marks object
      const initialMarks = {};
      for (const student of response.data) {
        initialMarks[student._id] = '';
      }
      setMarks(initialMarks);

      // Check if marks exist for this subject, class, exam, and academic year
      if (selectedSubject && selectedExam && selectedAcademicYear) {
        await checkExistingMarks();
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch exams
  const fetchExams = async () => {
    if (!selectedClass || !selectedSubject) return;

    try {
      setLoading(true);
      setError('');

      console.log('Fetching exams with params:', {
        classId: selectedClass,
        academicYearId: selectedAcademicYear
      });

      const response = await api.get('/api/exams', {
        params: {
          classId: selectedClass,
          academicYearId: selectedAcademicYear
        }
      });

      console.log('Exams response:', response.data);

      // Add a display name for each exam
      const processedExams = response.data.map(exam => ({
        ...exam,
        displayName: `${exam.name} (${exam.type})`
      }));

      setExams(processedExams);

      // If no exams found, create a default one only for admin users
      if (processedExams.length === 0) {
        console.log('No exams found');
        if (user?.role === 'admin') {
          console.log('User is admin, creating a default exam');
          setExams([{
            _id: 'default-exam',
            name: 'Default Exam',
            type: 'Default',
            academicYear: selectedAcademicYear,
            displayName: 'Default Exam'
          }]);
        } else {
          // For teachers, show an empty list and display a message
          setExams([]);
          setError('No exams found for this class and subject. Please contact an administrator to create exams.');
        }
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Failed to load exams. Please try again.');

      // Create a default exam as fallback only for admin users
      console.log('Error fetching exams');
      if (user?.role === 'admin') {
        console.log('User is admin, creating a default exam');
        setExams([{
          _id: 'default-exam',
          name: 'Default Exam',
          type: 'Default',
          academicYear: selectedAcademicYear,
          displayName: 'Default Exam'
        }]);
      } else {
        // For teachers, show an empty list
        setExams([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle mark change
  const handleMarkChange = (studentId, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  // Handle calculation type change
  const handleCalculationTypeChange = (type) => {
    setCalculationType(type);
  };

  // Calculate grade based on marks
  const calculateGrade = (marks) => {
    if (!marks && marks !== 0) return '-';
    if (marks >= 75) return 'A';
    if (marks >= 65) return 'B';
    if (marks >= 45) return 'C';
    if (marks >= 30) return 'D';
    return 'F';
  };

  // Check if teacher is authorized to enter marks for this subject
  const checkTeacherAuthorization = async () => {
    if (user?.role !== 'teacher') return true; // Admins are always authorized

    try {
      // Get the teacher profile
      const teacherResponse = await api.get('/api/teachers/profile');
      const teacherId = teacherResponse.data._id;

      // Get the class details
      const classResponse = await api.get(`/api/classes/${selectedClass}`);
      const classData = classResponse.data;

      // Check if this teacher is assigned to teach this subject in this class
      const isAssigned = classData.subjects?.some(s =>
        (s.subject._id === selectedSubject || s.subject === selectedSubject) &&
        (s.teacher?._id === teacherId || s.teacher === teacherId)
      );

      if (isAssigned) {
        console.log('Teacher is assigned to teach this subject in this class');
        return true;
      }

      // Also check if the teacher has this subject in their profile
      const teacherProfileResponse = await api.get(`/api/teachers/${teacherId}`);
      const teacherProfile = teacherProfileResponse.data;
      const teacherSubjectIds = teacherProfile.subjects?.map(s =>
        typeof s === 'object' ? s._id : s
      ) || [];

      const isQualified = teacherSubjectIds.includes(selectedSubject);

      if (isQualified) {
        console.log('Teacher is qualified to teach this subject');
        return true;
      }

      console.log('Teacher is not authorized to enter marks for this subject');
      return false;
    } catch (err) {
      console.error('Error checking teacher authorization:', err);
      return false; // Fail closed - if we can't verify, don't allow
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Clear previous messages
    setError('');
    setSuccess('');

    // Validate all required fields
    if (!selectedAcademicYear) {
      setError('Please select an academic year');
      return;
    }

    if (!selectedClass) {
      setError('Please select a class');
      return;
    }

    // Check if subjects list is empty (teacher not assigned to any subjects)
    if (subjects.length === 0) {
      setError('You are not assigned to teach any subjects in this class. Please contact an administrator.');
      return;
    }

    if (!selectedSubject) {
      setError('Please select a subject');
      return;
    }

    if (!selectedExam) {
      setError('Please select an exam');
      return;
    }

    // Check if exams list is empty
    if (exams.length === 0) {
      setError('No exams are available for this class and subject. Please contact an administrator.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Since we're now using the dedicated endpoint that only returns subjects
      // the teacher is assigned to, we don't need to do additional authorization checks
      console.log('Teacher is authorized to enter marks for this subject');

      console.log('Preparing to save marks with:', {
        academicYear: selectedAcademicYear,
        class: selectedClass,
        subject: selectedSubject,
        exam: selectedExam,
        marks
      });

      // Filter out empty marks
      const validMarks = Object.entries(marks)
        .filter(([_, value]) => value !== '')
        .map(([studentId, marksObtained]) => {
          // Create the mark object with all required fields
          const markData = {
            studentId,
            examId: selectedExam === 'default-exam' ? null : selectedExam,
            subjectId: selectedSubject,
            classId: selectedClass,
            academicYearId: selectedAcademicYear,
            marksObtained: Number.parseFloat(marksObtained)
          };

          // Add examName only if using default exam
          if (selectedExam === 'default-exam') {
            markData.examName = 'Default Exam';
          }

          // Ensure classId is a valid string and not undefined
          if (!markData.classId || markData.classId === 'default-class') {
            console.log('Using fallback class ID');
            // Use a fallback class ID if needed
            markData.classId = selectedClass || '67f2fd57dcc60fd7fef2ef1e';
          }

          console.log('Created mark data:', markData);
          return markData;
        });

      if (validMarks.length === 0) {
        setError('Please enter at least one mark');
        setLoading(false);
        return;
      }

      console.log('Sending marks data:', validMarks);

      // Validate that all required fields are present in each mark
      const missingFields = [];
      validMarks.forEach((mark, index) => {
        if (!mark.studentId) missingFields.push(`Mark ${index + 1}: studentId`);
        if (!mark.subjectId) missingFields.push(`Mark ${index + 1}: subjectId`);
        if (!mark.classId) missingFields.push(`Mark ${index + 1}: classId`);
        if (!mark.academicYearId) missingFields.push(`Mark ${index + 1}: academicYearId`);
        if (mark.marksObtained === undefined) missingFields.push(`Mark ${index + 1}: marksObtained`);
      });

      if (missingFields.length > 0) {
        const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
        console.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Prepare marks data for the new standardized API
      const marksData = validMarks.map(mark => {
        // Create a clean object with only the required fields
        const cleanMark = {
          studentId: mark.studentId,
          subjectId: selectedSubject, // Use the selected subject directly
          classId: selectedClass, // Use the selected class directly
          academicYearId: selectedAcademicYear, // Use the selected academic year directly
          examId: selectedExam, // Use the selected exam directly
          marksObtained: mark.marksObtained,
          // Include the manually selected calculation type
          educationLevel: calculationType
        };

          // Ensure classId is a valid string
          if (!cleanMark.classId || cleanMark.classId === 'default-class') {
            console.warn('Invalid classId, using fallback');
            cleanMark.classId = '67f2fe0fdcc60fd7fef2ef36'; // Fallback to a known valid class ID
          }

          // Log the clean mark object with types for debugging
          console.log('Clean mark object:', {
            ...cleanMark,
            studentId_type: typeof cleanMark.studentId,
            subjectId_type: typeof cleanMark.subjectId,
            classId_type: typeof cleanMark.classId,
            academicYearId_type: typeof cleanMark.academicYearId,
            examId_type: typeof cleanMark.examId,
            marksObtained_type: typeof cleanMark.marksObtained
          });

          // Add optional fields only if they exist
          if (mark.examId) cleanMark.examId = mark.examId;
          if (mark.examName) cleanMark.examName = mark.examName;
          if (mark.examTypeId) cleanMark.examTypeId = mark.examTypeId;

          return cleanMark;
        });

      // Make the API call with the new standardized endpoint
      const response = await api.post('/api/o-level/marks/batch', marksData);

      // Log the response for debugging
      console.log('API Response:', response.status, response.statusText);

      console.log('Save marks response:', response.data);
      setSuccess('Marks saved successfully');
    } catch (err) {
      console.error('Error saving marks:', err);
      let errorMessage = 'Failed to save marks. Please try again.';

      if (err.response) {
        console.error('Error response:', err.response.data);

        // Handle different types of error responses
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.errors) {
          // If there are validation errors, format them nicely
          if (typeof err.response.data.errors === 'object') {
            const errorFields = Object.keys(err.response.data.errors);
            errorMessage = `Error entering marks: ${errorFields.join(', ')}`;
          } else {
            errorMessage = `Error entering marks: ${err.response.data.errors}`;
          }
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Enter Subject Marks</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Academic Year</InputLabel>
            <Select
              value={selectedAcademicYear}
              label="Academic Year"
              onChange={(e) => {
                setSelectedAcademicYear(e.target.value);
                // Reset other selections when academic year changes
                setSelectedExam('');
              }}
              disabled={loading || academicYears.length === 0}
            >
              {academicYears.map((year) => (
                <MenuItem key={year._id} value={year._id}>
                  {year.year} {year.isActive && '(Active)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              label="Class"
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSubject('');
                setSelectedExam('');
              }}
              disabled={loading || classes.length === 0}
            >
              {classes.map((cls) => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.name} {cls.section}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Subject</InputLabel>
            <Select
              value={selectedSubject}
              label="Subject"
              onChange={async (e) => {
                const subjectId = e.target.value;

                // If user is a teacher, check authorization before setting the subject
                if (user?.role === 'teacher') {
                  // Save the selected subject temporarily to check authorization
                  const tempSelectedSubject = subjectId;

                  // Set loading state
                  setLoading(true);
                  setError('');

                  try {
                    // Since we're now using the dedicated endpoint that only returns
                    // subjects the teacher is assigned to, we can simply set the subject
                    console.log('Setting subject for teacher');
                    setSelectedSubject(subjectId);
                    setSelectedExam('');
                    setLoading(false);
                  } catch (err) {
                    console.error('Error checking teacher authorization:', err);
                    setError('Error checking authorization. Please try again.');
                    setLoading(false);
                  }
                } else {
                  // For admin users, just set the subject
                  setSelectedSubject(subjectId);
                  setSelectedExam('');
                }
              }}
              disabled={loading || !selectedClass || subjects.length === 0}
            >
              {subjects.length > 0 ? (
                subjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  No subjects available
                </MenuItem>
              )}
            </Select>
            {selectedClass && subjects.length === 0 && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                You are not assigned to teach any subjects in this class.
              </Typography>
            )}
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Exam</InputLabel>
            <Select
              value={selectedExam}
              label="Exam"
              onChange={(e) => setSelectedExam(e.target.value)}
              disabled={loading || !selectedClass || !selectedSubject || exams.length === 0}
            >
              {exams.length > 0 ? (
                exams.map((exam) => (
                  <MenuItem key={exam._id} value={exam._id}>
                    {exam.displayName}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  No exams available
                </MenuItem>
              )}
            </Select>
            {selectedClass && selectedSubject && exams.length === 0 && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                No exams available for this subject. Please contact an administrator.
              </Typography>
            )}
          </FormControl>
        </Box>

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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {students.length > 0 && selectedClass && selectedSubject && selectedExam ? (
              <>
                <Divider sx={{ my: 2 }} />

                {/* Result Calculation Type Selector */}
                <ResultCalculationTypeSelector
                  defaultType="O_LEVEL"
                  onChange={handleCalculationTypeChange}
                  disabled={marksExistForSubject}
                />

                {marksExistForSubject && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LockIcon sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        Marks already exist for this subject, class, exam, and academic year. You can only edit existing marks.
                      </Typography>
                    </Box>
                  </Alert>
                )}

                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Student Marks
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enter marks for each student below. Marks should be between 0 and 100.
                  </Typography>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student Name</TableCell>
                        <TableCell>Roll Number</TableCell>
                        <TableCell>Marks (0-100)</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((student) => {
                        // Check if this student already has marks
                        const hasExistingMarks = studentsWithMarks.some(s =>
                          s.studentId && student._id &&
                          (s.studentId === student._id.toString() || s.studentId === student._id)
                        );
                        const isDisabled = marksExistForSubject && !hasExistingMarks;

                        return (
                          <TableRow key={student._id}>
                            <TableCell>
                              {student.firstName} {student.lastName}
                            </TableCell>
                            <TableCell>{student.rollNumber}</TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                value={marks[student._id] || ''}
                                onChange={(e) => handleMarkChange(student._id, e.target.value)}
                                inputProps={{ min: 0, max: 100 }}
                                size="small"
                                fullWidth
                                disabled={isDisabled}
                              />
                            </TableCell>
                            <TableCell>
                              {calculateGrade(Number.parseFloat(marks[student._id]))}
                            </TableCell>
                            <TableCell>
                              {hasExistingMarks ? (
                                <Tooltip title="Marks already exist and can be edited">
                                  <Chip
                                    icon={<EditIcon fontSize="small" />}
                                    label="Edit Mode"
                                    color="primary"
                                    size="small"
                                    variant="outlined"
                                  />
                                </Tooltip>
                              ) : marksExistForSubject ? (
                                <Tooltip title="Cannot enter marks because marks already exist for other students in this subject">
                                  <Chip
                                    icon={<LockIcon fontSize="small" />}
                                    label="Locked"
                                    color="error"
                                    size="small"
                                    variant="outlined"
                                  />
                                </Tooltip>
                              ) : marks[student._id] ? (
                                <Chip
                                  label="New"
                                  color="success"
                                  size="small"
                                  variant="outlined"
                                />
                              ) : (
                                <Chip
                                  label="Not Set"
                                  color="default"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || !selectedClass || !selectedSubject || !selectedExam}
                  >
                    Save Marks
                  </Button>
                </Box>
              </>
            ) : selectedClass ? (
              <Alert severity="info">
                {!selectedSubject
                  ? 'Please select a subject to continue.'
                  : !selectedExam
                    ? 'Please select an exam to continue.'
                    : 'No students found in this class.'}
              </Alert>
            ) : (
              <Alert severity="info">
                Please select a class to view students.
              </Alert>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default WorkingSubjectMarksEntry;
