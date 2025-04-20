import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import api from '../../utils/api';
import teacherAuthService from '../../services/teacherAuthService';
import teacherApi from '../../services/teacherApi';

/**
 * O-Level Marks Entry Component
 * Allows teachers to enter marks for O-Level students
 */
const OLevelMarksEntry = () => {
  // State for form fields
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [marks, setMarks] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingResults, setExistingResults] = useState([]);
  const [hasExistingMarks, setHasExistingMarks] = useState(false);
  const [existingMarkDetails, setExistingMarkDetails] = useState(null);
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
          const response = await api.get('/api/classes?educationLevel=O_LEVEL');
          classesData = response.data || [];
        } else {
          // Teachers can only see assigned classes
          try {
            const assignedClasses = await teacherApi.getAssignedClasses();
            // Filter for O-Level classes
            classesData = assignedClasses.filter(cls =>
              cls.educationLevel === 'O_LEVEL' || !cls.educationLevel
            );
          } catch (error) {
            console.error('Error fetching assigned classes:', error);
            classesData = [];
          }
        }

        setClasses(classesData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes');
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch exams on component mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/exams');
        setExams(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching exams:', err);
        setError('Failed to load exams');
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Fetch subjects when class or student is selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass) {
        setSubjects([]);
        return;
      }

      try {
        setLoading(true);

        // Check if user is admin
        const isAdmin = teacherAuthService.isAdmin();

        let subjectsData;
        if (isAdmin) {
          // Admin can see all subjects in the class
          // If student is selected, only show subjects the student takes
          const endpoint = selectedStudent
            ? `/api/enhanced-teacher/o-level/classes/${selectedClass}/subjects?studentId=${selectedStudent}`
            : `/api/classes/${selectedClass}/subjects`;

          const response = await api.get(endpoint);
          subjectsData = selectedStudent ? (response.data.subjects || []) : (response.data || []);
        } else {
          // Teachers can only see assigned subjects
          // If student is selected, only show subjects the student takes
          try {
            if (selectedStudent) {
              // Use enhanced API with student filtering
              const response = await api.get(`/api/enhanced-teacher/o-level/classes/${selectedClass}/subjects?studentId=${selectedStudent}`);
              subjectsData = response.data.subjects || [];
            } else {
              subjectsData = await teacherApi.getAssignedSubjects(selectedClass);
            }
          } catch (error) {
            console.error('Error fetching assigned subjects:', error);
            subjectsData = [];
          }
        }

        // Filter for O-Level subjects
        const oLevelSubjects = subjectsData.filter(subject =>
          subject.educationLevel === 'O_LEVEL' || subject.educationLevel === 'BOTH' || !subject.educationLevel
        );

        setSubjects(oLevelSubjects);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects');
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedClass, selectedStudent]);

  // Fetch students when class and subject are selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) {
        setStudents([]);
        return;
      }

      try {
        setLoading(true);

        // Check if user is admin
        const isAdmin = teacherAuthService.isAdmin();

        let studentsData;
        if (isAdmin) {
          // Admin can see all students in the class
          if (selectedSubject) {
            // If subject is selected, get only students who take this subject
            console.log(`[OLevelMarksEntry] Admin fetching students for class ${selectedClass} and subject ${selectedSubject}`);
            try {
              const response = await api.get(`/api/enhanced-teachers/o-level/classes/${selectedClass}/subject/${selectedSubject}/students`);
              studentsData = response.data?.students || [];
              console.log(`[OLevelMarksEntry] Admin found ${studentsData.length} students who take subject ${selectedSubject}`);
            } catch (error) {
              console.error('[OLevelMarksEntry] Error fetching students for subject:', error);
              // Fallback to all students in class
              const fallbackResponse = await api.get(`/api/students/class/${selectedClass}`);
              studentsData = fallbackResponse.data || [];
              console.log(`[OLevelMarksEntry] Admin fallback: found ${studentsData.length} students in class`);
            }
          } else {
            // If no subject selected, get all students in class
            const response = await api.get(`/api/students/class/${selectedClass}`);
            studentsData = response.data || [];
            console.log(`[OLevelMarksEntry] Admin found ${studentsData.length} students in class ${selectedClass}`);
          }
        } else {
          // Teachers can only see assigned students
          if (selectedSubject) {
            // If subject is selected, get only students who take this subject
            console.log(`[OLevelMarksEntry] Teacher fetching students for class ${selectedClass} and subject ${selectedSubject}`);
            try {
              const response = await api.get(`/api/enhanced-teachers/o-level/classes/${selectedClass}/subject/${selectedSubject}/students`);
              studentsData = response.data?.students || [];
              console.log(`[OLevelMarksEntry] Teacher found ${studentsData.length} students who take subject ${selectedSubject}`);
            } catch (error) {
              console.error('[OLevelMarksEntry] Error fetching students for subject:', error);
              studentsData = [];
            }
          } else {
            // If no subject selected, get all assigned students
            try {
              studentsData = await teacherApi.getAssignedStudents(selectedClass);
              console.log(`[OLevelMarksEntry] Teacher found ${studentsData.length} assigned students in class ${selectedClass}`);
            } catch (error) {
              console.error('[OLevelMarksEntry] Error fetching assigned students:', error);
              studentsData = [];
            }
          }
        }

        // Filter for O-Level students only
        const oLevelStudents = studentsData.filter(student =>
          student.educationLevel === 'O_LEVEL' || !student.educationLevel
        );

        setStudents(oLevelStudents);
        setLoading(false);
      } catch (err) {
        console.error('[OLevelMarksEntry] Error fetching students:', err);
        setError('Failed to load students');
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, selectedSubject]);

  // Fetch existing results when class, subject, and exam are selected
  useEffect(() => {
    const fetchExistingResults = async () => {
      if (!selectedClass || !selectedSubject || !selectedExam) {
        setExistingResults([]);
        return;
      }

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
            setExistingResults([]);
            setLoading(false);
            return;
          }
        }

        // Get the exam details to get the academic year
        const examResponse = await api.get(`/exams/${selectedExam}`);
        const exam = examResponse.data;

        if (!exam.academicYear) {
          setError('Exam has no academic year assigned');
          setLoading(false);
          return;
        }

        // Check for existing marks
        const response = await api.get('/marks/check-existing', {
          params: {
            classId: selectedClass,
            subjectId: selectedSubject,
            examId: selectedExam,
            academicYearId: exam.academicYear
          }
        });

        // If not admin, filter results to only show students assigned to the teacher
        let resultsData = response.data.studentsWithMarks || [];

        if (!isAdmin) {
          const assignedStudents = await teacherAuthService.getAssignedStudents(selectedClass);
          const assignedStudentIds = assignedStudents.map(student => student._id);

          resultsData = resultsData.filter(result =>
            assignedStudentIds.includes(result.studentId)
          );
        }

        setExistingResults(resultsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching existing results:', err);
        setError('Failed to load existing results');
        setLoading(false);
      }
    };

    fetchExistingResults();
  }, [selectedClass, selectedSubject, selectedExam]);

  // Check if student has existing marks when student is selected
  useEffect(() => {
    const checkExistingMarks = async () => {
      if (!selectedStudent || !selectedSubject || !selectedExam) {
        setHasExistingMarks(false);
        setExistingMarkDetails(null);
        return;
      }

      try {
        // Check if user is admin
        const isAdmin = teacherAuthService.isAdmin();

        // If not admin, verify authorization
        if (!isAdmin) {
          // Check if teacher is authorized for this student, class, and subject
          const isAuthorizedForClass = await teacherAuthService.isAuthorizedForClass(selectedClass);
          const isAuthorizedForSubject = await teacherAuthService.isAuthorizedForSubject(selectedClass, selectedSubject);
          const isAuthorizedForStudent = await teacherAuthService.isAuthorizedForStudent(selectedClass, selectedStudent);

          if (!isAuthorizedForClass || !isAuthorizedForSubject || !isAuthorizedForStudent) {
            setHasExistingMarks(false);
            setExistingMarkDetails(null);
            setMarks('');
            return;
          }
        }

        // Get the exam details to get the academic year
        const examResponse = await api.get(`/exams/${selectedExam}`);
        const exam = examResponse.data;

        if (!exam.academicYear) {
          setError('Exam has no academic year assigned');
          return;
        }

        // Check if student has existing marks using the new standardized API
        const response = await api.get('/api/o-level/marks/student', {
          params: {
            studentId: selectedStudent,
            subjectId: selectedSubject,
            examId: selectedExam,
            academicYearId: exam.academicYear
          }
        });

        setHasExistingMarks(response.data.hasExistingMarks);
        if (response.data.hasExistingMarks) {
          setExistingMarkDetails(response.data);
          setMarks(response.data.marksObtained.toString());
        } else {
          setExistingMarkDetails(null);
          setMarks('');
        }
      } catch (err) {
        console.error('Error checking existing marks:', err);
      }
    };

    checkExistingMarks();
  }, [selectedStudent, selectedSubject, selectedExam, selectedClass]);

  // Calculate grade based on marks (O-Level grading system)
  const calculateGrade = (marks) => {
    if (marks >= 75) return 'A';
    if (marks >= 65) return 'B';
    if (marks >= 45) return 'C';
    if (marks >= 30) return 'D';
    return 'F';
  };

  // Calculate points based on grade (O-Level points system)
  const calculatePoints = (grade) => {
    switch (grade) {
      case 'A': return 1;
      case 'B': return 2;
      case 'C': return 3;
      case 'D': return 4;
      case 'F': return 5;
      default: return 0;
    }
  };

  // Calculate division based on points (O-Level division system)
  const calculateDivision = (points) => {
    if (points >= 7 && points <= 14) return 'I';
    if (points >= 15 && points <= 21) return 'II';
    if (points >= 22 && points <= 25) return 'III';
    if (points >= 26 && points <= 32) return 'IV';
    return '0';
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStudent || !selectedSubject || !selectedExam || !marks) {
      setError('Please fill in all required fields');
      return;
    }

    if (Number.isNaN(Number(marks)) || Number(marks) < 0 || Number(marks) > 100) {
      setError('Marks must be a number between 0 and 100');
      return;
    }

    try {
      setLoading(true);
      setError('');

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
        const isAuthorizedForStudent = await teacherAuthService.isAuthorizedForStudent(selectedClass, selectedStudent);
        if (!isAuthorizedForStudent) {
          throw new Error('You are not authorized to enter marks for this student');
        }
      }

      // Get the exam details to get the academic year
      const examResponse = await api.get(`/exams/${selectedExam}`);
      const exam = examResponse.data;

      if (!exam.academicYear) {
        setError('Exam has no academic year assigned');
        setLoading(false);
        return;
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
        educationLevel: 'O_LEVEL'
      };

      console.log('Submitting O-Level result:', resultData);

      // Use the new standardized API endpoint for entering marks
      const response = await api.post('/api/o-level/marks/single', resultData);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Marks saved successfully',
        severity: 'success'
      });

      // Reset form
      setMarks('');
      setComment('');

      // Refresh existing results using the new standardized API
      const updatedResponse = await api.get('/api/o-level/marks/check', {
        params: {
          classId: selectedClass,
          subjectId: selectedSubject,
          examId: selectedExam,
          academicYearId: exam.academicYear
        }
      });

      setExistingResults(updatedResponse.data.studentsWithMarks || []);
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enter O-Level Marks
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedStudent('');
                    setSelectedSubject('');
                  }}
                  label="Class"
                  disabled={loading}
                >
                  <MenuItem value="">Select a class</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.name} {cls.section || ''} {cls.stream || ''}
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
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedStudent('');
                  }}
                  label="Subject"
                  disabled={!selectedClass || loading}
                >
                  <MenuItem value="">Select a subject</MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Exam</InputLabel>
                <Select
                  value={selectedExam}
                  onChange={(e) => {
                    setSelectedExam(e.target.value);
                    setSelectedStudent('');
                  }}
                  label="Exam"
                  disabled={loading}
                >
                  <MenuItem value="">Select an exam</MenuItem>
                  {exams.map((exam) => (
                    <MenuItem key={exam._id} value={exam._id}>
                      {exam.name}
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
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  label="Student"
                  disabled={!selectedClass || !selectedSubject || !selectedExam || loading}
                >
                  <MenuItem value="">Select a student</MenuItem>
                  {students.map((student) => (
                    <MenuItem key={student._id} value={student._id}>
                      {student.firstName} {student.lastName} ({student.rollNumber || 'No Roll'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Marks"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                type="number"
                inputProps={{ min: 0, max: 100 }}
                disabled={!selectedStudent || loading}
                required
                helperText={
                  hasExistingMarks
                    ? `Existing marks: ${existingMarkDetails?.marksObtained} (Grade: ${existingMarkDetails?.grade}, Points: ${existingMarkDetails?.points})`
                    : 'Enter marks between 0 and 100'
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Comment (Optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                rows={2}
                disabled={!selectedStudent || loading}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!selectedStudent || !selectedSubject || !selectedExam || !marks || loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                fullWidth
              >
                {loading ? 'Saving...' : 'Save Marks'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Existing Results Table */}
      {selectedClass && selectedSubject && selectedExam && existingResults.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Existing Results
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Roll Number</TableCell>
                  <TableCell align="center">Marks</TableCell>
                  <TableCell align="center">Grade</TableCell>
                  <TableCell align="center">Points</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {existingResults.map((result) => (
                  <TableRow key={result.studentId}>
                    <TableCell>{result.studentName}</TableCell>
                    <TableCell>{result.rollNumber}</TableCell>
                    <TableCell align="center">{result.marksObtained}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={result.grade}
                        color={
                          result.grade === 'A' ? 'success' :
                          result.grade === 'B' ? 'primary' :
                          result.grade === 'C' ? 'info' :
                          result.grade === 'D' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">{result.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* O-Level Grading Guide */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          O-Level Grading Guide
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Grade</TableCell>
                    <TableCell>Marks Range</TableCell>
                    <TableCell>Points</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>A</TableCell>
                    <TableCell>75-100%</TableCell>
                    <TableCell>1</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>B</TableCell>
                    <TableCell>65-74%</TableCell>
                    <TableCell>2</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>C</TableCell>
                    <TableCell>50-64%</TableCell>
                    <TableCell>3</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>D</TableCell>
                    <TableCell>30-49%</TableCell>
                    <TableCell>4</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>F</TableCell>
                    <TableCell>0-29%</TableCell>
                    <TableCell>5</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid item xs={12} md={6}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Division</TableCell>
                    <TableCell>Points Range (Best 7 Subjects)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Division I</TableCell>
                    <TableCell>7-14 points</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Division II</TableCell>
                    <TableCell>15-21 points</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Division III</TableCell>
                    <TableCell>22-25 points</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Division IV</TableCell>
                    <TableCell>26-32 points</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Division 0</TableCell>
                    <TableCell>33+ points</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default OLevelMarksEntry;
