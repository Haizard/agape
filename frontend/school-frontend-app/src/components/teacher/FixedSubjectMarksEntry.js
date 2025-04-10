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
  Divider
} from '@mui/material';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import PropTypes from 'prop-types';

const FixedSubjectMarksEntry = () => {
  const user = useSelector((state) => state.user.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teacherProfile, setTeacherProfile] = useState(null);
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
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching initial data...');
      
      // Fetch academic years, exam types, and teacher profile in parallel
      const [academicYearsResponse, examTypesResponse, teacherProfileResponse] = await Promise.all([
        api.get('/api/academic-years'),
        api.get('/api/exam-types'),
        api.get('/api/teachers/profile/me').catch(err => {
          console.log('Teacher profile not found, user might be admin');
          return { data: null };
        })
      ]);
      
      // Set academic years
      setAcademicYears(academicYearsResponse.data);
      
      // Set active academic year as default
      const activeYear = academicYearsResponse.data.find(year => year.isActive);
      if (activeYear) {
        setSelectedAcademicYear(activeYear._id);
      } else if (academicYearsResponse.data.length > 0) {
        setSelectedAcademicYear(academicYearsResponse.data[0]._id);
      }
      
      // Set exam types
      setExamTypes(examTypesResponse.data);
      
      // Set teacher profile if available
      if (teacherProfileResponse.data) {
        setTeacherProfile(teacherProfileResponse.data);
        console.log('Teacher profile found:', teacherProfileResponse.data);
      }
      
      // Fetch teacher's classes using the new endpoint
      try {
        const classesResponse = await api.get('/api/teacher-classes/my-classes');
        console.log('Teacher classes:', classesResponse.data);
        setTeacherClasses(classesResponse.data);
      } catch (classesError) {
        console.error('Error fetching teacher classes:', classesError);
        
        // If user is admin, fetch all classes as fallback
        if (user && user.role === 'admin') {
          console.log('User is admin, fetching all classes...');
          const allClassesResponse = await api.get('/api/classes');
          setTeacherClasses(allClassesResponse.data);
        } else {
          setError('Failed to fetch your assigned classes. Please contact the administrator.');
        }
      }
      
      setInitialDataLoaded(true);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch teacher's subjects for the selected class
  const fetchTeacherSubjectsForClass = useCallback(async () => {
    if (!selectedClass) {
      console.log('No class selected, skipping subject fetch');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching subjects for class:', selectedClass);
      
      // Use the new endpoint to get teacher's subjects
      const subjectsResponse = await api.get('/api/teacher-classes/my-subjects');
      console.log('Teacher subjects:', subjectsResponse.data);
      
      // Filter subjects that are taught in the selected class
      const subjectsForClass = subjectsResponse.data.filter(subject => 
        subject.classes && subject.classes.some(cls => cls._id === selectedClass)
      );
      
      console.log('Subjects for selected class:', subjectsForClass);
      setTeacherSubjects(subjectsForClass);
      
      // If no subjects found and user is admin, fetch all subjects for the class
      if (subjectsForClass.length === 0 && user && user.role === 'admin') {
        console.log('No subjects found for class, fetching all subjects as admin...');
        const allSubjectsResponse = await api.get(`/api/classes/${selectedClass}/subjects`);
        setTeacherSubjects(allSubjectsResponse.data);
      }
    } catch (err) {
      console.error('Error fetching subjects for class:', err);
      
      // If user is admin, try to fetch all subjects for the class
      if (user && user.role === 'admin') {
        try {
          console.log('Fetching all subjects for class as admin...');
          const allSubjectsResponse = await api.get(`/api/classes/${selectedClass}/subjects`);
          setTeacherSubjects(allSubjectsResponse.data);
        } catch (fallbackErr) {
          console.error('Error in fallback subject fetch:', fallbackErr);
          setError('Failed to fetch subjects for this class');
        }
      } else {
        setError('Failed to fetch your assigned subjects for this class');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedClass, user]);

  // Fetch exams for the selected class and subject
  const fetchExams = useCallback(async () => {
    if (!selectedAcademicYear || !selectedClass || !selectedSubject) {
      console.log('Missing required selections, skipping exam fetch');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching exams for:', {
        academicYear: selectedAcademicYear,
        class: selectedClass,
        subject: selectedSubject
      });
      
      // Build query parameters
      const params = {
        academicYearId: selectedAcademicYear,
        classId: selectedClass
      };
      
      const response = await api.get('/api/exams', { params });
      console.log('Exams response:', response.data);
      
      // Process the exams to include exam type information
      const processedExams = response.data.map(exam => ({
        ...exam,
        displayName: `${exam.name} (${exam.type})${exam.examType ? ` - ${exam.examType.name}` : ''}`
      }));
      
      setExams(processedExams);
      
      // If no exams found, create a default exam option
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
      setError('Failed to fetch exams');
      
      // If error, create a default exam option
      console.log('Error fetching exams, creating default exam option');
      setExams([{
        _id: 'default-exam',
        name: 'Default Exam',
        type: 'Default',
        academicYear: selectedAcademicYear,
        displayName: 'Default Exam'
      }]);
    } finally {
      setLoading(false);
    }
  }, [selectedAcademicYear, selectedClass, selectedSubject]);

  // Fetch students for the selected class
  const fetchStudents = useCallback(async () => {
    if (!selectedClass) {
      console.log('No class selected, skipping student fetch');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching students for class:', selectedClass);
      
      const response = await api.get(`/api/students/class/${selectedClass}`);
      console.log('Students response:', response.data);
      setStudents(response.data);
      
      // Initialize marks object for all students
      const initialMarks = {};
      for (const student of response.data) {
        initialMarks[student._id] = '';
      }
      setMarks(initialMarks);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students for this class');
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  // Fetch existing results for the selected class, subject, and exam
  const fetchExistingResults = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !selectedExam) {
      console.log('Missing required selections, skipping results fetch');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching existing results for:', {
        class: selectedClass,
        subject: selectedSubject,
        exam: selectedExam
      });
      
      // Get the selected exam to check if it has an exam type
      const selectedExamObj = exams.find(exam => exam._id === selectedExam);
      const examTypeFromExam = selectedExamObj?.examType?._id;
      
      const response = await api.get(`/api/results/class/${selectedClass}`, {
        params: {
          examId: selectedExam,
          subjectId: selectedSubject,
          examTypeId: examTypeFromExam
        }
      });
      
      console.log('Existing results:', response.data);
      setExistingResults(response.data);
      
      // Pre-fill marks with existing results
      const updatedMarks = { ...marks };
      for (const result of response.data) {
        if (result.studentId && result.marksObtained !== undefined) {
          updatedMarks[result.studentId._id] = result.marksObtained.toString();
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
      setError('Failed to fetch existing results');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSubject, selectedExam, exams, marks]);

  // Handle mark change
  const handleMarkChange = (studentId, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: value
    }));
  };

  // Handle form submission
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
          
          return {
            studentId,
            examId,
            academicYearId: selectedAcademicYear,
            examTypeId: effectiveExamTypeId,
            subjectId: selectedSubject,
            classId: selectedClass,
            marksObtained: Number.parseFloat(marksObtained),
            // If using default exam, include exam name
            examName: selectedExam === 'default-exam' ? 'Default Exam' : undefined
          };
        });
      
      if (validMarks.length === 0) {
        setError('Please enter at least one mark');
        setLoading(false);
        return;
      }
      
      await api.post('/api/results/enter-marks/batch', {
        marksData: validMarks
      });
      
      setSuccess('Marks saved successfully');
      fetchExistingResults(); // Refresh the results
    } catch (err) {
      console.error('Error saving marks:', err);
      setError(err.response?.data?.message || 'Failed to save marks');
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

  // Effect to fetch initial data on component mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Effect to fetch subjects when class is selected
  useEffect(() => {
    if (selectedClass && initialDataLoaded) {
      fetchTeacherSubjectsForClass();
      fetchStudents();
    }
  }, [selectedClass, initialDataLoaded, fetchTeacherSubjectsForClass, fetchStudents]);

  // Effect to fetch exams when class and subject are selected
  useEffect(() => {
    if (selectedClass && selectedSubject && initialDataLoaded) {
      fetchExams();
    }
  }, [selectedClass, selectedSubject, initialDataLoaded, fetchExams]);

  // Effect to fetch existing results when class, subject, and exam are selected
  useEffect(() => {
    if (selectedClass && selectedSubject && selectedExam && initialDataLoaded) {
      fetchExistingResults();
    }
  }, [selectedClass, selectedSubject, selectedExam, initialDataLoaded, fetchExistingResults]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Enter Subject Marks</Typography>
      
      {teacherProfile && (
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1">
              Teacher: {teacherProfile.firstName} {teacherProfile.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You can only enter marks for classes and subjects assigned to you.
            </Typography>
          </Paper>
        </Box>
      )}
      
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
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSubject('');
                setSelectedExam('');
              }}
              disabled={teacherClasses.length === 0}
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
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedExam('');
              }}
              disabled={!selectedClass || teacherSubjects.length === 0}
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
              disabled={!selectedClass || !selectedSubject || exams.length === 0}
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
                        <TableCell>Admission Number</TableCell>
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
                            <TableCell>{student.admissionNumber}</TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                value={marks[student._id] || ''}
                                onChange={(e) => handleMarkChange(student._id, e.target.value)}
                                inputProps={{ min: 0, max: 100 }}
                                size="small"
                                fullWidth
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
            ) : selectedClass && selectedSubject && selectedExam ? (
              <Alert severity="info">No students found in this class.</Alert>
            ) : (
              <Alert severity="info">
                Please select a class, subject, and exam to enter marks.
              </Alert>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default FixedSubjectMarksEntry;
