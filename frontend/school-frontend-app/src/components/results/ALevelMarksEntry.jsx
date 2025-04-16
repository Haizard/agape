import React, { useState, useEffect } from 'react';
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
        } catch (teacherError) {
          console.error('Error fetching assigned students:', teacherError);

          // If the teacher-specific endpoint fails, try the general endpoint
          console.log('Falling back to general students endpoint');
          const response = await api.get(`/api/students/class/${classId}`);
          studentsData = response.data || [];
        }
      }

      // Log raw student data for debugging
      console.log('Raw student data:', studentsData.slice(0, 3));

      // Filter for A-Level students by educationLevel OR form level (5 or 6)
      const aLevelStudents = studentsData.filter(student => {
        // Check if student is explicitly marked as A_LEVEL
        const isALevel = student.educationLevel === 'A_LEVEL';

        // Check if student is in Form 5 or 6 (A-Level forms)
        const isFormFiveOrSix = student.form === 5 || student.form === 6;

        // For debugging
        if (isFormFiveOrSix && !isALevel) {
          console.log(`Student in Form ${student.form} but not marked as A_LEVEL:`,
            student.firstName, student.lastName, student.educationLevel);
        }

        // Return true if either condition is met
        return isALevel || isFormFiveOrSix;
      });

      // Log the students for debugging
      console.log(`Found ${aLevelStudents.length} A-Level students out of ${studentsData.length} total students`);

      // If no A-Level students found, show a message
      if (aLevelStudents.length === 0 && studentsData.length > 0) {
        console.log('No A-Level students found, but found other students');
        setError('No A-Level students found in this class.');
      } else if (studentsData.length === 0) {
        console.log('No students found at all');
        setError('No students found in this class.');
      }

      setStudents(aLevelStudents);
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

      let classSubjects;
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
        } else {
          classSubjects = [];
        }
      } else {
        // Teachers can only see assigned subjects
        classSubjects = await teacherApi.getAssignedSubjects(classId);
      }

      // Filter for A-Level subjects
      const aLevelSubjects = classSubjects.filter(subject =>
        subject.educationLevel === 'A_LEVEL' || subject.educationLevel === 'BOTH'
      );

      setSubjects(aLevelSubjects);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Failed to load subjects. Please try again.');
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

        if (selectedStudentObj && selectedStudentObj.educationLevel === 'A_LEVEL') {
          console.log(`Selected A-Level student: ${selectedStudentObj.firstName} ${selectedStudentObj.lastName}`);

          // Check if student has a subject combination
          if (selectedStudentObj.subjectCombination) {
            console.log(`Student has subject combination: ${selectedStudentObj.subjectCombination.name || selectedStudentObj.subjectCombination._id}`);

            // Get subjects from the student's combination
            const combinationSubjects = studentSubjectsApi.getSubjectsFromCombination(selectedStudentObj);

            if (combinationSubjects.length > 0) {
              console.log(`Found ${combinationSubjects.length} subjects from student's combination`);
              setSubjects(combinationSubjects);
            } else {
              // If no subjects found in combination, fetch them from the API
              const studentSubjects = await studentSubjectsApi.getStudentSubjects(studentId);
              if (studentSubjects.length > 0) {
                console.log(`Found ${studentSubjects.length} subjects for student from API`);
                setSubjects(studentSubjects);
              } else {
                // If still no subjects, fall back to class subjects
                console.log('No subjects found for student, falling back to class subjects');
                await fetchSubjectsByClass(selectedClass);
              }
            }
          } else {
            console.log('Student has no subject combination, fetching subjects from API');
            // Fetch subjects specifically for this student
            const studentSubjects = await studentSubjectsApi.getStudentSubjects(studentId);
            if (studentSubjects.length > 0) {
              console.log(`Found ${studentSubjects.length} subjects for student from API`);
              setSubjects(studentSubjects);
            } else {
              // If no subjects found, fall back to class subjects
              console.log('No subjects found for student, falling back to class subjects');
              await fetchSubjectsByClass(selectedClass);
            }
          }
        } else {
          console.log('Selected student is not A-Level or not found');
          // Fall back to class subjects
          await fetchSubjectsByClass(selectedClass);
        }
      } catch (error) {
        console.error('Error fetching student subjects:', error);
        setError('Failed to load subjects for this student. Please try again.');
        // Fall back to class subjects
        await fetchSubjectsByClass(selectedClass);
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

  // Calculate A-Level points based on grade
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

      // Prepare data for API call
      const resultData = {
        studentId: selectedStudent,
        examId: selectedExam,
        academicYearId: exam.academicYear,
        examTypeId: exam.examType,
        subjectId: selectedSubject,
        classId: selectedClass,
        marksObtained: Number(marks),
        grade,
        points,
        comment,
        educationLevel: 'A_LEVEL',
        isPrincipal: isPrincipal // Use the state value for isPrincipal
      };

      console.log(`Subject ${subject.name} is ${subject.isPrincipal ? 'a principal' : 'a subsidiary'} subject`);

      console.log('Submitting A-Level result:', resultData);

      // Submit to the ALevelResult model
      const response = await api.post('/api/a-level-results/enter-marks', resultData);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Marks saved successfully',
        severity: 'success'
      });

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
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !selectedStudent || !selectedSubject || !selectedExam || !marks}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Marks'}
            </Button>
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
    </Paper>
  );
};

export default ALevelMarksEntry;
