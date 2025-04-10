import React, { useState, useEffect, useContext, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { useSelector } from 'react-redux';
import api from '../../services/api';

const SubjectMarksEntry = () => {
  const user = useSelector((state) => state.user.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [exams, setExams] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [marks, setMarks] = useState({});
  const [existingResults, setExistingResults] = useState([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState({});
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingMarksData, setPendingMarksData] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');

  useEffect(() => {
    // Always fetch these regardless of teacher profile
    fetchExamTypes();
    fetchAcademicYears();

    // If user is admin, fetch all classes immediately
    if (user && user.role === 'admin') {
      console.log('User is admin, fetching all classes...');
      fetchAllClasses();
    } else {
      // For teachers, fetch their assigned classes
      // This will internally try to get the teacher profile
      fetchTeacherClasses();
    }

    // No need for additional error handling here since fetchTeacherClasses handles it
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchTeacherSubjectsForClass();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchExams();
    }
  }, [selectedClass, selectedSubject]);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedExam) {
      fetchExistingResults();
    }
  }, [selectedClass, selectedSubject, selectedExam, fetchExistingResults]);

  // Separate effect for setting exam type to avoid dependency issues
  useEffect(() => {
    if (selectedExam && exams.length > 0) {
      // Set the exam type based on the selected exam
      const selectedExamObj = exams.find(exam => exam._id === selectedExam);
      if (selectedExamObj?.examType?._id) {
        console.log('Setting exam type from selected exam:', selectedExamObj.examType._id);
        setSelectedExamType(selectedExamObj.examType._id);
      }
    }
  }, [selectedExam, exams]);

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/api/academic-years');
      setAcademicYears(response.data);

      // Set the active academic year as default
      const activeYear = response.data.find(year => year.isActive);
      if (activeYear) {
        setSelectedAcademicYear(activeYear._id);
      } else if (response.data.length > 0) {
        setSelectedAcademicYear(response.data[0]._id);
      }
    } catch (err) {
      setError('Failed to fetch academic years');
    }
  };

  const fetchExamTypes = async () => {
    try {
      const response = await api.get('/api/exam-types');
      setExamTypes(response.data);
    } catch (err) {
      setError('Failed to fetch exam types');
    }
  };

  const fetchTeacherClasses = async (teacherIdParam) => {
    try {
      // If teacherId is provided, use it; otherwise, try to get it from the profile
      let teacherId = teacherIdParam;
      if (!teacherId) {
        try {
          const profileResponse = await api.get('/api/teachers/profile/me');
          teacherId = profileResponse.data._id;
        } catch (profileErr) {
          console.error('Error fetching teacher profile:', profileErr);
          // If we can't get the teacher profile, try fetching all classes as a fallback
          await fetchAllClasses();
          return;
        }
      }

      // Use the new simple-classes endpoint which is more reliable
      const response = await api.get(`/api/teachers/${teacherId}/simple-classes`);
      setTeacherClasses(response.data);
    } catch (err) {
      console.error('Error fetching teacher classes:', err);

      // Try to fetch all classes as a fallback
      try {
        await fetchAllClasses();
      } catch (fallbackErr) {
        console.error('Error in fallback class fetch:', fallbackErr);
        setError('Failed to fetch any classes. Please contact the administrator.');
      }
    }
  };

  // For admins who don't have a teacher profile
  const fetchAllClasses = async () => {
    try {
      console.log('Fetching all classes for admin user...');
      const response = await api.get('/api/classes');
      console.log('All classes:', response.data);
      setTeacherClasses(response.data);
    } catch (err) {
      console.error('Error fetching all classes:', err);
      setError(err.response?.data?.message || 'Failed to fetch classes');
    }
  };

  const fetchTeacherSubjectsForClass = async () => {
    if (!selectedClass) {
      console.log('No class selected, skipping subject fetch');
      return;
    }

    try {
      // If user is admin, fetch all subjects for the selected class
      if (user && user.role === 'admin') {
        console.log('Fetching all subjects for class as admin...');
        try {
          const subjectsResponse = await api.get(`/api/classes/${selectedClass}/subjects`);
          console.log('Subjects for class:', subjectsResponse.data);
          setTeacherSubjects(subjectsResponse.data);

          // If no subjects found, try to fetch all subjects from the database
          if (subjectsResponse.data.length === 0) {
            console.log('No subjects found for class, fetching all subjects...');
            const allSubjectsResponse = await api.get('/api/subjects');
            setTeacherSubjects(allSubjectsResponse.data);
          }
        } catch (adminErr) {
          console.error('Error fetching subjects as admin:', adminErr);
          // Fallback to fetching all subjects
          try {
            console.log('Falling back to fetching all subjects...');
            const allSubjectsResponse = await api.get('/api/subjects');
            setTeacherSubjects(allSubjectsResponse.data);
          } catch (fallbackErr) {
            console.error('Error in fallback subject fetch:', fallbackErr);
            setError(fallbackErr.response?.data?.message || 'Failed to fetch subjects');
          }
        }
      } else {
        // For teachers, fetch only assigned subjects
        console.log('Fetching teacher-specific subjects...');
        const response = await api.get('/api/teachers/profile/me');
        const teacherId = response.data._id;
        // Use the new simple-subjects endpoint which is more reliable
        const subjectsResponse = await api.get(`/api/teachers/${teacherId}/classes/${selectedClass}/simple-subjects`);
        console.log('Teacher subjects for class:', subjectsResponse.data);
        setTeacherSubjects(subjectsResponse.data);
      }
    } catch (err) {
      console.error('Error fetching subjects for class:', err);

      // If teacher profile not found but user is admin, try to fetch all subjects
      if (err.response?.status === 404 && user && user.role === 'admin') {
        try {
          console.log('Falling back to fetching all subjects as admin...');
          const subjectsResponse = await api.get(`/api/classes/${selectedClass}/subjects`);
          setTeacherSubjects(subjectsResponse.data);

          // If no subjects found, try to fetch all subjects from the database
          if (subjectsResponse.data.length === 0) {
            console.log('No subjects found for class, fetching all subjects...');
            const allSubjectsResponse = await api.get('/api/subjects');
            setTeacherSubjects(allSubjectsResponse.data);
          }
        } catch (fallbackErr) {
          console.error('Error in fallback subject fetch:', fallbackErr);
          setError(fallbackErr.response?.data?.message || 'Failed to fetch subjects for this class');
        }
      } else {
        setError(err.response?.data?.message || 'Failed to fetch assigned subjects for this class');
      }
    }
  };

  const fetchExams = async () => {
    if (!selectedAcademicYear) {
      console.log('No academic year selected, skipping exam fetch');
      return;
    }

    try {
      console.log('Fetching exams for academic year:', selectedAcademicYear);
      console.log('Selected class:', selectedClass);
      console.log('Selected subject:', selectedSubject);

      // Build query parameters
      const params = {
        academicYearId: selectedAcademicYear,
        classId: selectedClass // Filter exams by class
      };

      const response = await api.get('/api/exams', { params });
      console.log('Exams response:', response.data);

      // Process the exams to include exam type information
      const processedExams = response.data.map(exam => ({
        ...exam,
        displayName: `${exam.name} (${exam.type})${exam.examType ? ` - ${exam.examType.name}` : ''}`
      }));

      setExams(processedExams);

      // If no exams found, create a default exam option for all users
      if (processedExams.length === 0) {
        console.log('No exams found, creating default exam option');
        setExams([{
          _id: 'default-exam',
          name: 'Default Exam',
          type: 'Default',
          academicYear: selectedAcademicYear,
          displayName: 'Default Exam'
        }]);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError(err.response?.data?.message || 'Failed to fetch exams');

      // If error, create a default exam option for all users
      console.log('Error fetching exams, creating default exam option');
      setExams([{
        _id: 'default-exam',
        name: 'Default Exam',
        type: 'Default',
        academicYear: selectedAcademicYear,
        displayName: 'Default Exam'
      }]);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get(`/api/students/class/${selectedClass}`);
      setStudents(response.data);
      // Initialize marks object for all students
      const initialMarks = {};
      for (const student of response.data) {
        initialMarks[student._id] = '';
      }
      setMarks(initialMarks);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.response?.data?.message || 'Failed to fetch students');
    }
  };

  const fetchExistingResults = useCallback(async () => {
    try {
      // Skip if any required field is missing
      if (!selectedClass || !selectedSubject || !selectedExam) {
        console.log('Missing required fields for fetching results');
        return;
      }

      // Get the selected exam to check if it has an exam type
      const selectedExamObj = exams.find(exam => exam._id === selectedExam);
      const examTypeFromExam = selectedExamObj?.examType?._id;

      console.log('Fetching existing results with params:', {
        examId: selectedExam,
        subjectId: selectedSubject,
        examTypeId: examTypeFromExam,
        classId: selectedClass,
        academicYearId: selectedAcademicYear
      });

      const response = await api.get(`/api/results/class/${selectedClass}`, {
        params: {
          examId: selectedExam,
          subjectId: selectedSubject,
          examTypeId: examTypeFromExam,
          academicYearId: selectedAcademicYear
        }
      });

      console.log('Existing results:', response.data);
      setExistingResults(response.data);

      // Pre-fill marks with existing results
      const updatedMarks = {}; // Start with a fresh object to avoid stale data
      for (const result of response.data) {
        if (result.studentId && result.marksObtained !== undefined) {
          const studentId = typeof result.studentId === 'object' ? result.studentId._id : result.studentId;
          updatedMarks[studentId] = result.marksObtained.toString();
          console.log(`Pre-filled marks for student ${studentId}: ${result.marksObtained}`);
        }
      }
      setMarks(updatedMarks);

      // If results have an exam type, set it
      if (response.data.length > 0 && response.data[0].examTypeId) {
        console.log('Setting exam type from existing results:', response.data[0].examTypeId);
        setSelectedExamType(response.data[0].examTypeId);
      } else if (examTypeFromExam) {
        // Otherwise use the exam's exam type if available
        console.log('Setting exam type from selected exam:', examTypeFromExam);
        setSelectedExamType(examTypeFromExam);
      }
    } catch (err) {
      console.error('Error fetching existing results:', err);
      setError(err.response?.data?.message || 'Failed to fetch existing results');
    }
  }, [selectedClass, selectedSubject, selectedExam, selectedAcademicYear, exams]);

  const handleMarkChange = (studentId, value) => {
    // Clear any existing warnings for this student
    setDuplicateWarnings(prev => {
      const newWarnings = { ...prev };
      delete newWarnings[studentId];
      return newWarnings;
    });

    // Check if this mark is being duplicated across multiple students
    if (value !== '') {
      const studentsWithSameMark = Object.entries(marks)
        .filter(([id, mark]) => id !== studentId && mark === value)
        .map(([id]) => {
          // Get student name for better warning messages
          const student = students.find(s => s._id === id);
          return student ? `${student.firstName} ${student.lastName}` : id;
        });

      if (studentsWithSameMark.length > 0) {
        console.warn(`Warning: Same mark (${value}) is being assigned to multiple students:`, {
          currentStudent: studentId,
          otherStudents: studentsWithSameMark
        });

        // Add a warning for this student
        setDuplicateWarnings(prev => ({
          ...prev,
          [studentId]: {
            message: `Same mark (${value}) assigned to other students: ${studentsWithSameMark.join(', ')}`,
            value
          }
        }));
      }
    }

    setMarks(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  const [selectedExamType, setSelectedExamType] = useState('');

  const submitMarks = async (marksData) => {
    try {
      console.log('Submitting marks data:', marksData);

      const response = await api.post('/api/results/enter-marks/batch', {
        marksData: marksData
      });

      console.log('Marks saved successfully:', response.data);
      setSuccess('Marks saved successfully');

      // Clear the marks state to avoid stale data
      setMarks({});

      // Clear any duplicate warnings
      setDuplicateWarnings({});

      // Refresh the results after a short delay to ensure the server has processed the data
      setTimeout(() => {
        fetchExistingResults();
      }, 1000);
    } catch (err) {
      console.error('Error saving marks:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save marks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get the selected exam to check if it has an exam type
      const selectedExamObj = exams.find(exam => exam._id === selectedExam);
      const examTypeFromExam = selectedExamObj?.examType?._id;

      console.log('Selected exam:', selectedExamObj);
      console.log('Exam type from exam:', examTypeFromExam);
      console.log('Manually selected exam type:', selectedExamType);

      // Filter out empty marks
      const validMarks = Object.entries(marks)
        .filter(([_, value]) => value !== '')
        .map(([studentId, marksObtained]) => {
          // If the exam is the default one created for admin users, we need to create a real exam
          const examId = selectedExam === 'default-exam' ? null : selectedExam;

          // Use exam type in this priority:
          // 1. Exam's own exam type if available
          // 2. Manually selected exam type
          // 3. First available exam type
          const effectiveExamTypeId = examTypeFromExam ||
                                     selectedExamType ||
                                     (examTypes.length > 0 ? examTypes[0]._id : null);

          // Parse marks as a number and ensure it's valid
          const parsedMarks = Number.parseFloat(marksObtained);
          if (Number.isNaN(parsedMarks)) {
            throw new Error(`Invalid marks value for student ${studentId}: ${marksObtained}`);
          }

          return {
            studentId,
            examId,
            academicYearId: selectedAcademicYear,
            examTypeId: effectiveExamTypeId,
            subjectId: selectedSubject,
            classId: selectedClass, // Add classId
            marksObtained: parsedMarks,
            // If using default exam, include exam name
            examName: selectedExam === 'default-exam' ? 'Default Exam' : undefined
          };
        });

      if (validMarks.length === 0) {
        setError('Please enter at least one mark');
        setLoading(false);
        return;
      }

      // Check for duplicate marks across subjects
      if (Object.keys(duplicateWarnings).length > 0) {
        // Show a confirmation dialog before submitting
        console.warn('Potential duplicate marks detected:', duplicateWarnings);
        setPendingMarksData(validMarks);
        setShowDuplicateDialog(true);
        setLoading(false);
        return;
      }

      // If no duplicate warnings, submit directly
      await submitMarks(validMarks);
    } catch (err) {
      console.error('Error saving marks:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save marks');
    } finally {
      setLoading(false);
    }
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
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
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
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={teacherClasses.length === 0 && !(user && user.role === 'admin')}
            >
              {teacherClasses.map((cls) => (
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
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedClass || (teacherSubjects.length === 0 && !(user && user.role === 'admin'))}
            >
              {teacherSubjects.map((subject) => (
                <MenuItem key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Exam</InputLabel>
            <Select
              value={selectedExam}
              label="Exam"
              onChange={(e) => setSelectedExam(e.target.value)}
              disabled={!selectedClass || !selectedSubject || (exams.length === 0 && !(user && user.role === 'admin'))}
            >
              {exams.map((exam) => (
                <MenuItem key={exam._id} value={exam._id}>
                  {exam.displayName || `${exam.name} (${exam.type})`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Exam Type</InputLabel>
            <Select
              value={selectedExamType}
              label="Exam Type"
              onChange={(e) => setSelectedExamType(e.target.value)}
              disabled={exams.find(exam => exam._id === selectedExam)?.examType?._id}
            >
              {examTypes.map((examType) => (
                <MenuItem key={examType._id} value={examType._id}>
                  {examType.name} (Max: {examType.maxMarks})
                </MenuItem>
              ))}
            </Select>
            {exams.find(exam => exam._id === selectedExam)?.examType?._id && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Using exam type from selected exam: {exams.find(exam => exam._id === selectedExam)?.examType?.name}
              </Typography>
            )}
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            {error.includes('Teacher profile not found') && user && user.role === 'admin' && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                As an admin, you can still enter marks for any class and subject. Please select from the dropdowns below.
              </Typography>
            )}
            {error.includes('Teacher profile not found') && user && user.role === 'teacher' && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Your user account is not linked to a teacher profile. Please contact the administrator to set up your teacher profile.
              </Typography>
            )}
          </Alert>
        )}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {students.length > 0 ? (
              <>
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
                        const existingResult = existingResults.find(
                          r => r.studentId?._id === student._id
                        );
                        const hasExistingResult = !!existingResult;

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
                                error={!!duplicateWarnings[student._id]}
                                helperText={duplicateWarnings[student._id]?.message}
                              />
                            </TableCell>
                            <TableCell>
                              {calculateGrade(Number.parseFloat(marks[student._id]))}
                            </TableCell>
                            <TableCell>
                              {hasExistingResult ? (
                                <Chip
                                  label="Updated"
                                  color="primary"
                                  size="small"
                                  variant="outlined"
                                />
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
                    disabled={!selectedClass || !selectedSubject || !selectedExam}
                  >
                    Save Marks
                  </Button>
                </Box>
              </>
            ) : selectedClass ? (
              <Alert severity="info">No students found in this class.</Alert>
            ) : (
              <Alert severity="info">Please select a class to view students.</Alert>
            )}
          </>
        )}
      </Paper>

      {/* Confirmation Dialog for Duplicate Marks */}
      <Dialog
        open={showDuplicateDialog}
        onClose={() => setShowDuplicateDialog(false)}
        aria-labelledby="duplicate-marks-dialog-title"
        aria-describedby="duplicate-marks-dialog-description"
      >
        <DialogTitle id="duplicate-marks-dialog-title">
          Potential Duplicate Marks Detected
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="duplicate-marks-dialog-description">
            Some students have the same marks for different subjects, which might indicate duplicate entries.
            Please review the following warnings:
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            {Object.entries(duplicateWarnings).map(([studentId, warning]) => {
              const student = students.find(s => s._id === studentId);
              const studentName = student ? `${student.firstName} ${student.lastName}` : studentId;

              return (
                <Alert severity="warning" key={studentId} sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>{studentName}:</strong> {warning.message}
                  </Typography>
                </Alert>
              );
            })}
          </Box>
          <DialogContentText sx={{ mt: 2 }}>
            Do you want to proceed with saving these marks anyway?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDuplicateDialog(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              setShowDuplicateDialog(false);
              setLoading(true);
              submitMarks(pendingMarksData);
            }}
            color="primary"
            variant="contained"
          >
            Save Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubjectMarksEntry;








