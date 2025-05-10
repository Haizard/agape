import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Tooltip,
  IconButton,
  Snackbar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  Help as HelpIcon,
  Check as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useAssessment } from '../../contexts/AssessmentContext';
import api from '../../utils/api';
import { calculateGrade } from '../../utils/gradeCalculator';
import { filterStudentsBySubject, createStudentSubjectsMap, isSubjectCore } from '../../utils/student-utils';
import { filterALevelStudentsBySubject, createALevelCombinationsMap } from '../../utils/a-level-student-utils';

/**
 * Unified Bulk Marks Entry Component
 * Replaces multiple mark entry methods with a single unified approach
 * Works for both A-Level and O-Level education levels
 */
const UnifiedBulkMarksEntry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { assessments, fetchAssessments } = useAssessment();
  const isAdmin = user && user.role === 'admin';

  // Determine education level from location state or default to O_LEVEL
  const [educationLevel, setEducationLevel] = useState(
    location.state?.educationLevel || 'O_LEVEL'
  );

  // State for form fields
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1');
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // Store all students before filtering
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [activeTab, setActiveTab] = useState(0);
  // Always initialize as an empty array to prevent filter errors
  const [subjectAssessments, setSubjectAssessments] = useState([]);
  const [studentSubjectsMap, setStudentSubjectsMap] = useState({});
  const [subjectIsCoreSubject, setSubjectIsCoreSubject] = useState(false);

  // Simplified active assessments logic
  const activeAssessments = useMemo(() => {
    // Ensure subjectAssessments is an array before filtering
    if (!Array.isArray(subjectAssessments)) {
      console.warn('subjectAssessments is not an array:', subjectAssessments);
      return [];
    }

    // Create a stable filtered array
    const filteredAssessments = subjectAssessments
      .filter(a => {
        // Check if the assessment has the required properties
        if (!a) return false;

        // Handle isVisible property (default to true if not present)
        const isVisible = a.isVisible !== undefined ? a.isVisible : true;

        // Check term match
        const termMatch = a.term === selectedTerm;

        return isVisible && termMatch;
      })
      .sort((a, b) => {
        // Handle missing displayOrder (default to 0)
        const orderA = a.displayOrder !== undefined ? a.displayOrder : 0;
        const orderB = b.displayOrder !== undefined ? b.displayOrder : 0;
        return orderA - orderB;
      });

    console.log('Filtered assessments:', filteredAssessments.length);
    return filteredAssessments;
  }, [subjectAssessments, selectedTerm]);

  // Fetch assessments on component mount
  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // Fetch academic years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/academic-years', {
          params: { educationLevel }
        });
        setAcademicYears(response.data);

        // Set the current academic year if available
        if (response.data.length > 0) {
          const currentYear = response.data.find(year => year.isActive) || response.data[0];
          setSelectedAcademicYear(currentYear._id);
        }
      } catch (error) {
        console.error('Error fetching academic years:', error);
        setError('Failed to fetch academic years');
      } finally {
        setLoading(false);
      }
    };

    fetchAcademicYears();
  }, [educationLevel]);

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/classes', {
          params: { educationLevel, academicYearId: selectedAcademicYear }
        });
        setClasses(response.data);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError('Failed to fetch classes');
      } finally {
        setLoading(false);
      }
    };

    if (selectedAcademicYear) {
      fetchClasses();
    }
  }, [educationLevel, selectedAcademicYear]);

  // Fetch subjects when class is selected
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);

        // Try multiple endpoints to get subjects
        let subjectsData = [];

        try {
          // First try the class subjects endpoint
          const response = await api.get(`/api/classes/${selectedClass}/subjects`);
          subjectsData = response.data;
          console.log('Subjects from class endpoint:', subjectsData);
        } catch (error) {
          console.log('Class subjects endpoint failed, trying teacher subjects endpoint');

          try {
            // Then try the teacher subjects endpoint
            const response = await api.get(`/api/teachers/classes/${selectedClass}/subjects`);
            subjectsData = response.data;
            console.log('Subjects from teacher endpoint:', subjectsData);
          } catch (error) {
            console.error('All subject endpoints failed:', error);
            throw new Error('Failed to fetch subjects');
          }
        }

        setSubjects(subjectsData);

        // Reset selected subject
        setSelectedSubject('');
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setError('Failed to fetch subjects');
      } finally {
        setLoading(false);
      }
    };

    if (selectedClass) {
      fetchSubjects();
    } else {
      setSubjects([]);
    }
  }, [selectedClass]);

  // Fetch assessments when subject is selected
  useEffect(() => {
    const fetchSubjectAssessments = async () => {
      try {
        setLoading(true);

        // Try to get assessments for the selected subject
        const response = await api.get('/api/assessments', {
          params: {
            subjectId: selectedSubject,
            term: selectedTerm,
            academicYearId: selectedAcademicYear
          }
        });

        console.log('Subject assessments:', response.data);

        // Ensure we're setting an array
        const assessmentsArray = Array.isArray(response.data)
          ? response.data
          : response.data?.data && Array.isArray(response.data.data)
            ? response.data.data
            : [];

        console.log('Processed assessments array:', assessmentsArray);
        setSubjectAssessments(assessmentsArray);
      } catch (error) {
        console.error('Error fetching subject assessments:', error);
        setError('Failed to fetch assessments');
        setSubjectAssessments([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedSubject && selectedTerm && selectedAcademicYear) {
      fetchSubjectAssessments();
    } else {
      setSubjectAssessments([]);
    }
  }, [selectedSubject, selectedTerm, selectedAcademicYear]);

  // Function to fetch student subject selections
  const fetchStudentSubjectSelections = useCallback(async (classId) => {
    try {
      console.log(`Fetching student subject selections for class ${classId}`);
      const response = await api.get(`/api/student-subject-selections/class/${classId}`);
      console.log(`Found ${response.data.length} student subject selections for class ${classId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching student subject selections:', error);
      return [];
    }
  }, []);

  // Check if a subject is a core subject
  const checkIfSubjectIsCore = useCallback(async (subjectId) => {
    try {
      if (!subjectId) return false;

      console.log(`Checking if subject ${subjectId} is a core subject...`);
      const response = await api.get(`/api/subjects/${subjectId}`);
      const subject = response.data;

      const isCore = subject && subject.type === 'CORE';
      console.log(`Subject ${subjectId} is ${isCore ? 'a core' : 'not a core'} subject`);

      return isCore;
    } catch (error) {
      console.error(`Error checking if subject ${subjectId} is core:`, error);
      return false;
    }
  }, []);

  // Filter students based on subject
  const filterStudentsForSubject = useCallback((students, subjectId, isCoreSubject, studentSubjectsMap) => {
    if (educationLevel === 'A_LEVEL') {
      // For A-Level, use the A-Level specific filtering logic
      return filterALevelStudentsBySubject(students, subjectId, false, studentSubjectsMap);
    }
    // For O-Level, use the standard filtering logic
    return filterStudentsBySubject(students, subjectId, isCoreSubject, studentSubjectsMap);
  }, [educationLevel]);

  // Fetch students when class is selected - with subject filtering
  useEffect(() => {
    if (!selectedClass) return;

    const fetchStudents = async () => {
      try {
        setLoading(true);

        // First, fetch all students in the class
        const response = await api.get(`/api/students/class/${selectedClass}`);
        const allStudentsData = response.data;
        setAllStudents(allStudentsData);

        // If no subject is selected yet, show all students
        if (!selectedSubject) {
          setStudents(allStudentsData);
          return;
        }

        // Check if the selected subject is a core subject
        const isCore = await checkIfSubjectIsCore(selectedSubject);
        setSubjectIsCoreSubject(isCore);

        // Get student subject selections to filter students
        const selections = await fetchStudentSubjectSelections(selectedClass);

        // Create a map of student IDs to their selected subjects
        const subjectsMap = createStudentSubjectsMap(selections);
        setStudentSubjectsMap(subjectsMap);

        // Filter students based on subject
        const filteredStudents = filterStudentsForSubject(
          allStudentsData,
          selectedSubject,
          isCore,
          subjectsMap
        );

        console.log(`Filtered from ${allStudentsData.length} to ${filteredStudents.length} students for subject ${selectedSubject}`);

        // If no students were found after filtering, we'll still set the filtered list
        // This will show the "No students found" message in the UI
        setStudents(filteredStudents);

        // Show a warning if no students were found
        if (filteredStudents.length === 0) {
          // Get the subject name directly from the subjects array
          const subjectName = subjects.find(s => s._id === selectedSubject)?.name || 'this subject';
          setError(`No students found who take ${subjectName}. Please check student subject assignments.`);
        } else {
          // Clear any previous error
          setError('');
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('Failed to fetch students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, selectedSubject, filterStudentsForSubject, checkIfSubjectIsCore, fetchStudentSubjectSelections, subjects]);

  // Initialize marks when students or assessments change - with proper dependencies
  useEffect(() => {
    // Skip if no students or assessments
    if (students.length === 0 || activeAssessments.length === 0) return;

    console.log('Initializing marks for students and assessments');

    // Use functional update to avoid dependency on marks
    setMarks(prevMarks => {
      // Initialize marks object
      const initialMarks = {};
      for (const student of students) {
        initialMarks[student._id] = {};
        for (const assessment of activeAssessments) {
          // Preserve existing marks if they exist
          if (prevMarks[student._id]?.[assessment._id] !== undefined) {
            initialMarks[student._id][assessment._id] = prevMarks[student._id][assessment._id];
          } else {
            initialMarks[student._id][assessment._id] = '';
          }
        }
      }

      // Only update if there are changes
      if (JSON.stringify(initialMarks) !== JSON.stringify(prevMarks)) {
        return initialMarks;
      }
      return prevMarks;
    });
  }, [students, activeAssessments]);

  // We've simplified our approach and don't need the extra effects anymore

  // Handle mark change - use a stable implementation
  const handleMarkChange = useCallback((studentId, assessmentId, value) => {
    setMarks(prevMarks => ({
      ...prevMarks,
      [studentId]: {
        ...prevMarks[studentId],
        [assessmentId]: value
      }
    }));
  }, []);

  // Handle tab change - use a stable implementation
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  // Save marks - use a stable implementation with dependencies
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const marksData = [];
      for (const [studentId, studentMarks] of Object.entries(marks)) {
        for (const [assessmentId, mark] of Object.entries(studentMarks)) {
          if (mark !== '') {
            marksData.push({
              studentId,
              assessmentId,
              marksObtained: Number(mark),
              educationLevel,
              subjectId: selectedSubject,
              academicYearId: selectedAcademicYear,
              classId: selectedClass,
              term: selectedTerm
            });
          }
        }
      }

      if (marksData.length === 0) {
        setError('No marks to save. Please enter at least one mark.');
        setSaving(false);
        return;
      }

      console.log('Saving marks data:', marksData);
      const response = await api.post('/api/assessments/bulk-marks', { marks: marksData });

      if (response.data.success) {
        setSuccess('Marks saved successfully');
        setSnackbar({
          open: true,
          message: 'Marks saved successfully',
          severity: 'success'
        });
      } else {
        throw new Error(response.data.message || 'Failed to save marks');
      }
    } catch (error) {
      console.error('Error saving marks:', error);
      setError(error.response?.data?.message || error.message || 'Failed to save marks');
      setSnackbar({
        open: true,
        message: error.response?.data?.message || error.message || 'Failed to save marks',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  }, [
    marks,
    educationLevel,
    selectedSubject,
    selectedAcademicYear,
    selectedClass,
    selectedTerm
  ]);

  // Handle snackbar close - use a stable implementation
  const handleSnackbarClose = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Helper function to get the selected subject name - memoized to avoid issues
  const getSelectedSubjectName = useCallback(() => {
    const subject = subjects.find(s => s._id === selectedSubject);
    return subject ? subject.name : 'Unknown Subject';
  }, [subjects, selectedSubject]);

  // Helper function to get the selected class name - memoized to avoid issues
  const getSelectedClassName = useCallback(() => {
    const classObj = classes.find(c => c._id === selectedClass);
    return classObj ? `${classObj.name} ${classObj.section || ''}` : 'Unknown Class';
  }, [classes, selectedClass]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {educationLevel === 'A_LEVEL' ? 'A-Level' : 'O-Level'} Bulk Marks Entry
        {selectedSubject && (
          <Typography component="span" variant="h5" color="primary" sx={{ ml: 2 }}>
            - {getSelectedSubjectName()}
          </Typography>
        )}
      </Typography>

      {/* Subject information banner when subject is selected */}
      {selectedSubject && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: '#e3f2fd',
            border: '1px solid #2196f3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box>
            <Typography variant="h5" color="primary" gutterBottom>
              Subject: {getSelectedSubjectName()}
            </Typography>
            <Typography variant="body1">
              Class: {getSelectedClassName()} | Term: {selectedTerm}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={loading || saving || !activeAssessments.length}
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {saving ? 'Saving...' : 'Save Marks'}
          </Button>
        </Paper>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Education Level</InputLabel>
              <Select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                label="Education Level"
              >
                <MenuItem value="O_LEVEL">O-Level</MenuItem>
                <MenuItem value="A_LEVEL">A-Level</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                label="Academic Year"
                disabled={academicYears.length === 0}
              >
                <MenuItem value="">Select an academic year</MenuItem>
                {academicYears.map((year) => (
                  <MenuItem key={year._id} value={year._id}>
                    {year.name} {year.isActive ? '(Current)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Term</InputLabel>
              <Select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                label="Term"
              >
                <MenuItem value="1">Term 1</MenuItem>
                <MenuItem value="2">Term 2</MenuItem>
                <MenuItem value="3">Term 3</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                label="Class"
                disabled={classes.length === 0}
              >
                <MenuItem value="">Select a class</MenuItem>
                {classes.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name} {cls.section || ''}
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
                onChange={(e) => setSelectedSubject(e.target.value)}
                label="Subject"
                disabled={subjects.length === 0}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: selectedSubject ? '#2196f3' : undefined,
                      borderWidth: selectedSubject ? 2 : undefined,
                    },
                  },
                  bgcolor: selectedSubject ? '#e3f2fd' : undefined
                }}
              >
                <MenuItem value="">Select a subject</MenuItem>
                {subjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {subjects.length === 0 && selectedClass && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                No subjects found for this class. Please assign subjects to the class first.
              </Typography>
            )}
          </Grid>
        </Grid>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {selectedClass && selectedSubject && activeAssessments.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading || saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{ mr: 1 }}
            >
              {saving ? 'Saving...' : 'Save Marks'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {selectedClass && selectedSubject && activeAssessments.length > 0 ? (
              <>
                <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                  <Tab label="Enter Marks" />
                  <Tab label="View Grades" />
                </Tabs>

                {students.length === 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No students found who take this subject. Please check student subject assignments.
                  </Alert>
                ) : activeTab === 0 ? (
                  <TableContainer>
                    {/* Subject information header */}
                    <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        Subject: {getSelectedSubjectName()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Education Level: {educationLevel === 'A_LEVEL' ? 'A-Level' : 'O-Level'} |
                        Term: {selectedTerm} |
                        Class: {getSelectedClassName()}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        Showing {students.length} students who take this subject
                      </Typography>
                    </Box>

                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                          <TableCell colSpan={2 + activeAssessments.length} sx={{ py: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Subject: {getSelectedSubjectName()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Student Name</TableCell>
                          <TableCell>Registration Number</TableCell>
                          {activeAssessments.map(assessment => (
                            <TableCell key={assessment._id} align="right">
                              <Tooltip title={`${assessment.name} (${assessment.weightage}%)`}>
                                <span>{assessment.name}</span>
                              </Tooltip>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.map(student => (
                          <TableRow key={student._id}>
                            <TableCell>{student.firstName} {student.lastName}</TableCell>
                            <TableCell>{student.registrationNumber}</TableCell>
                            {activeAssessments.map(assessment => (
                              <TableCell key={assessment._id} align="right">
                                <TextField
                                  type="number"
                                  value={marks[student._id]?.[assessment._id] || ''}
                                  onChange={(e) => handleMarkChange(student._id, assessment._id, e.target.value)}
                                  inputProps={{
                                    min: 0,
                                    max: assessment.maxMarks,
                                    style: { textAlign: 'right' }
                                  }}
                                  size="small"
                                  sx={{ width: '80px' }}
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <TableContainer>
                    {/* Subject information header */}
                    <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        Subject: {getSelectedSubjectName()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Education Level: {educationLevel === 'A_LEVEL' ? 'A-Level' : 'O-Level'} |
                        Term: {selectedTerm} |
                        Class: {getSelectedClassName()}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        Showing {students.length} students who take this subject
                      </Typography>
                    </Box>

                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                          <TableCell colSpan={3 + activeAssessments.length} sx={{ py: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              Subject: {getSelectedSubjectName()} - Grades
                            </Typography>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Student Name</TableCell>
                          <TableCell>Registration Number</TableCell>
                          {activeAssessments.map(assessment => (
                            <TableCell key={assessment._id} align="right">
                              {assessment.name} Grade
                            </TableCell>
                          ))}
                          <TableCell align="right">Final Grade</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {students.map(student => (
                          <TableRow key={student._id}>
                            <TableCell>{student.firstName} {student.lastName}</TableCell>
                            <TableCell>{student.registrationNumber}</TableCell>
                            {activeAssessments.map(assessment => {
                              const mark = marks[student._id]?.[assessment._id];
                              const grade = mark ? calculateGrade(Number(mark), educationLevel) : '-';
                              return (
                                <TableCell key={assessment._id} align="right">
                                  {grade}
                                </TableCell>
                              );
                            })}
                            <TableCell align="right">
                              {/* Calculate final grade based on weighted average */}
                              {calculateFinalGrade(student._id, marks, activeAssessments, educationLevel)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            ) : (
              <Alert severity="info">
                {!selectedClass ?
                  'Please select a class to view students.' :
                  !selectedSubject ?
                  'Please select a subject to view assessments.' :
                  'No assessments found for the selected subject and term. Please create assessments first.'}
              </Alert>
            )}
          </>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
      />
    </Box>
  );
};

// Helper function to calculate final grade - memoized within the component
const calculateFinalGrade = (studentId, marks, assessments, educationLevel) => {
  // Early return if no marks for student
  if (!marks || !marks[studentId]) return '-';

  // Early return if no assessments
  if (!assessments || !Array.isArray(assessments) || assessments.length === 0) return '-';

  try {
    let totalWeightedMarks = 0;
    let totalWeightage = 0;

    for (const assessment of assessments) {
      // Skip invalid assessments
      if (!assessment || !assessment._id) continue;

      const mark = marks[studentId][assessment._id];
      if (mark) {
        // Use default maxMarks if not provided
        const maxMarks = assessment.maxMarks || 100;
        // Use default weightage if not provided
        const weightage = assessment.weightage || 1;

        totalWeightedMarks += (Number(mark) / maxMarks) * weightage;
        totalWeightage += weightage;
      }
    }

    if (totalWeightage === 0) return '-';

    const finalMark = (totalWeightedMarks / totalWeightage) * 100;
    return calculateGrade(finalMark, educationLevel);
  } catch (error) {
    console.error('Error calculating final grade:', error);
    return '-';
  }
};

export default UnifiedBulkMarksEntry;
