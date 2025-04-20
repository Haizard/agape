import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Divider,
  Tabs,
  Tab,
  IconButton,
  Tooltip
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
import unifiedApi from '../../services/unifiedApi';
import TeacherSubjectSelector from '../common/TeacherSubjectSelector';

/**
 * UnifiedMarksEntry Component
 *
 * A unified component for entering marks for both O-Level and A-Level students,
 * with proper role-based access control and consistent UI/UX.
 */
const UnifiedMarksEntry = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const queryParams = new URLSearchParams(location.search);

  // State variables
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedClass, setSelectedClass] = useState(queryParams.get('class') || '');
  const [selectedExam, setSelectedExam] = useState(queryParams.get('exam') || '');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [educationLevel, setEducationLevel] = useState('O_LEVEL');
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Determine if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch academic years
        const academicYearResponse = await unifiedApi.getAcademicYears();
        setAcademicYears(academicYearResponse);

        // Set default academic year (current)
        const currentYear = academicYearResponse.find(year => year.isCurrent);
        if (currentYear) {
          setSelectedAcademicYear(currentYear._id);

          // Fetch classes for this academic year
          const classResponse = await unifiedApi.getClassesByAcademicYear(currentYear._id);
          setClasses(classResponse);

          // If class is provided in URL, set it and fetch exams
          if (selectedClass) {
            // Find the selected class to determine education level
            const classObj = classResponse.find(c => c._id === selectedClass);
            if (classObj) {
              setEducationLevel(classObj.educationLevel || 'O_LEVEL');

              // Fetch exams for this class
              const examResponse = await unifiedApi.getExamsByClass(selectedClass, currentYear._id);
              setExams(examResponse);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load initial data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [selectedClass]);

  // Fetch students and existing marks when class, exam, and subject are selected
  useEffect(() => {
    const fetchStudentsAndMarks = async () => {
      if (!selectedClass || !selectedExam || !selectedSubject) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch students for this class
        const studentsResponse = await unifiedApi.getStudentsByClass(selectedClass);
        setStudents(studentsResponse);

        // Fetch existing marks for this exam, class, and subject
        const endpoint = educationLevel === 'A_LEVEL'
          ? `/a-level-results?examId=${selectedExam}&subjectId=${selectedSubject}`
          : `/o-level-results?examId=${selectedExam}&subjectId=${selectedSubject}`;

        const marksResponse = await unifiedApi.get(endpoint);

        // Create a map of student IDs to marks
        const marksMap = {};
        marksResponse.forEach(mark => {
          marksMap[mark.studentId] = mark;
        });

        // Create marks array with all students
        const marksArray = studentsResponse.map(student => {
          const existingMark = marksMap[student._id];
          return {
            studentId: student._id,
            studentName: `${student.firstName} ${student.lastName}`,
            examId: selectedExam,
            subjectId: selectedSubject,
            marksObtained: existingMark ? existingMark.marksObtained : '',
            grade: existingMark ? existingMark.grade : '',
            points: existingMark ? existingMark.points : '',
            _id: existingMark ? existingMark._id : null
          };
        });

        setMarks(marksArray);
      } catch (err) {
        console.error('Error fetching students and marks:', err);
        setError('Failed to load students and marks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndMarks();
  }, [selectedClass, selectedExam, selectedSubject, educationLevel]);

  // Handle academic year change
  const handleAcademicYearChange = async (event) => {
    const yearId = event.target.value;
    setSelectedAcademicYear(yearId);

    try {
      setLoading(true);
      const response = await unifiedApi.getClassesByAcademicYear(yearId);
      setClasses(response);
      setSelectedClass('');
      setSelectedExam('');
      setSelectedSubject('');
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle class change
  const handleClassChange = async (event) => {
    const classId = event.target.value;
    setSelectedClass(classId);

    // Find the selected class to determine education level
    const selectedClassObj = classes.find(c => c._id === classId);
    if (selectedClassObj) {
      setEducationLevel(selectedClassObj.educationLevel || 'O_LEVEL');
    }

    try {
      setLoading(true);
      const response = await unifiedApi.getExamsByClass(classId, selectedAcademicYear);
      setExams(response);
      setSelectedExam('');
      setSelectedSubject('');
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Failed to load exams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle exam change
  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
    setSelectedSubject('');
  };

  // Handle subject change
  const handleSubjectChange = (subjectId) => {
    setSelectedSubject(subjectId);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle mark change
  const handleMarkChange = (studentId, value) => {
    // Validate input (only numbers and decimal point)
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return;
    }

    // Update marks
    setMarks(prevMarks =>
      prevMarks.map(mark =>
        mark.studentId === studentId
          ? { ...mark, marksObtained: value }
          : mark
      )
    );
  };

  // Calculate grade and points based on marks
  const calculateGradeAndPoints = (marks) => {
    if (marks === '' || isNaN(marks)) return { grade: '', points: '' };

    const numericMarks = parseFloat(marks);

    if (educationLevel === 'A_LEVEL') {
      // A-Level grading
      if (numericMarks >= 80) return { grade: 'A', points: 1 };
      if (numericMarks >= 70) return { grade: 'B', points: 2 };
      if (numericMarks >= 60) return { grade: 'C', points: 3 };
      if (numericMarks >= 50) return { grade: 'D', points: 4 };
      if (numericMarks >= 40) return { grade: 'E', points: 5 };
      if (numericMarks >= 35) return { grade: 'S', points: 6 };
      return { grade: 'F', points: 7 };
    } else {
      // O-Level grading
      if (numericMarks >= 81) return { grade: 'A', points: 1 };
      if (numericMarks >= 61) return { grade: 'B', points: 2 };
      if (numericMarks >= 41) return { grade: 'C', points: 3 };
      if (numericMarks >= 21) return { grade: 'D', points: 4 };
      return { grade: 'F', points: 5 };
    }
  };

  // Save marks
  const handleSaveMarks = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate marks
      const invalidMarks = marks.filter(mark =>
        mark.marksObtained !== '' &&
        (isNaN(mark.marksObtained) ||
         parseFloat(mark.marksObtained) < 0 ||
         parseFloat(mark.marksObtained) > 100)
      );

      if (invalidMarks.length > 0) {
        setError('Some marks are invalid. Please enter values between 0 and 100.');
        setSaving(false);
        return;
      }

      // Calculate grades and points for all marks
      const marksWithGrades = marks.map(mark => {
        if (mark.marksObtained === '') {
          return mark;
        }

        const { grade, points } = calculateGradeAndPoints(mark.marksObtained);
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

      // Save marks
      const endpoint = educationLevel === 'A_LEVEL'
        ? '/a-level-results/batch'
        : '/o-level/marks/batch';

      await unifiedApi.post(endpoint, marksToSave);

      // Update marks state with calculated grades and points
      setMarks(marksWithGrades);

      // Show success message
      setSuccess('Marks saved successfully.');
      setSnackbar({
        open: true,
        message: 'Marks saved successfully',
        severity: 'success'
      });

      // Refresh marks
      const refreshedMarksResponse = await unifiedApi.get(
        educationLevel === 'A_LEVEL'
          ? `/a-level-results?examId=${selectedExam}&subjectId=${selectedSubject}`
          : `/o-level-results?examId=${selectedExam}&subjectId=${selectedSubject}`
      );

      // Create a map of student IDs to marks
      const refreshedMarksMap = {};
      refreshedMarksResponse.forEach(mark => {
        refreshedMarksMap[mark.studentId] = mark;
      });

      // Update marks array with refreshed data
      setMarks(prevMarks =>
        prevMarks.map(mark => {
          const refreshedMark = refreshedMarksMap[mark.studentId];
          if (refreshedMark) {
            return {
              ...mark,
              marksObtained: refreshedMark.marksObtained,
              grade: refreshedMark.grade,
              points: refreshedMark.points,
              _id: refreshedMark._id
            };
          }
          return mark;
        })
      );
    } catch (err) {
      console.error('Error saving marks:', err);
      setError(`Failed to save marks: ${err.message}`);
      setSnackbar({
        open: true,
        message: `Failed to save marks: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    // Reload the current page
    window.location.reload();
  };

  // Handle go back
  const handleGoBack = () => {
    navigate(-1);
  };

  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Render loading state
  if (loading && !selectedSubject) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleGoBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            {educationLevel === 'A_LEVEL' ? 'A-Level' : 'O-Level'} Marks Entry
          </Typography>
        </Box>

        {selectedSubject && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            onClick={() => navigate(`/marks-history/subject/${selectedSubject}?model=${educationLevel === 'A_LEVEL' ? 'ALevelResult' : 'OLevelResult'}`)}
          >
            View Marks History
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Class, Exam, and Subject
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={selectedAcademicYear}
                onChange={handleAcademicYearChange}
                label="Academic Year"
              >
                {academicYears.map((year) => (
                  <MenuItem key={year._id} value={year._id}>
                    {year.name} {year.isCurrent && '(Current)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={handleClassChange}
                label="Class"
                disabled={!selectedAcademicYear}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name} {cls.section ? `- ${cls.section}` : ''}
                    {cls.educationLevel === 'A_LEVEL' && (
                      <Chip
                        label="A-Level"
                        size="small"
                        color="primary"
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Exam</InputLabel>
              <Select
                value={selectedExam}
                onChange={handleExamChange}
                label="Exam"
                disabled={!selectedClass}
              >
                {exams.map((exam) => (
                  <MenuItem key={exam._id} value={exam._id}>
                    {exam.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <TeacherSubjectSelector
              classId={selectedClass}
              value={selectedSubject}
              onChange={handleSubjectChange}
              showAll={isAdmin}
              label="Subject"
            />
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
                          <TableCell width="35%">Student Name</TableCell>
                          <TableCell width="25%">Marks (0-100)</TableCell>
                          <TableCell width="15%">Status</TableCell>
                          <TableCell width="10%">History</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {marks.map((mark, index) => (
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
                                    onClick={() => navigate(`/marks-history/result/${mark._id}?model=${educationLevel === 'A_LEVEL' ? 'ALevelResult' : 'OLevelResult'}`)}
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
                    <Tooltip title={
                      educationLevel === 'A_LEVEL'
                        ? 'A-Level Grading: A (80-100%), B (70-79%), C (60-69%), D (50-59%), E (40-49%), S (35-39%), F (0-34%)'
                        : 'O-Level Grading: A (81-100%), B (61-80%), C (41-60%), D (21-40%), F (0-20%)'
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
                          <TableCell width="40%">Student Name</TableCell>
                          <TableCell width="15%" align="center">Marks</TableCell>
                          <TableCell width="15%" align="center">Grade</TableCell>
                          <TableCell width="15%" align="center">Points</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {marks.map((mark, index) => {
                          // Calculate grade and points for display
                          const { grade, points } = mark.marksObtained
                            ? (mark.grade && mark.points
                              ? { grade: mark.grade, points: mark.points }
                              : calculateGradeAndPoints(mark.marksObtained))
                            : { grade: '', points: '' };

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
              {saving ? 'Saving...' : 'Save All Marks'}
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

export default UnifiedMarksEntry;
