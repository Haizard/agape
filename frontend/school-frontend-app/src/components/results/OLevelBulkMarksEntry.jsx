import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../utils/api';
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
  Tooltip,
  IconButton,
  Tabs,
  Tab
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
import { API_URL } from '../../config/index';
import { useAuth } from '../../contexts/AuthContext';

/**
 * O-Level Bulk Marks Entry Component
 * Allows teachers to enter marks for multiple O-Level students at once
 */
const OLevelBulkMarksEntry = () => {
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

  // Fetch classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const response = await api.get('/classes', {
          params: {
            educationLevel: 'O_LEVEL'
          }
        });
        setClasses(response.data || []);
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
        const response = await api.get('/exams');
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
        const response = await api.get(`/classes/${selectedClass}/subjects`);

        // Filter for O-Level subjects only
        const oLevelSubjects = response.data.filter(subject =>
          subject.educationLevel === 'O_LEVEL'
        );

        setSubjects(oLevelSubjects);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setError('Failed to fetch subjects. Please try again.');
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

        // Get students in the class
        const studentsResponse = await api.get(`/classes/${selectedClass}/students`);

        // Get existing marks for the selected class, subject, and exam
        const marksResponse = await api.get(`/check-marks/check-existing`, {
          params: {
            classId: selectedClass,
            subjectId: selectedSubject,
            examId: selectedExam
          }
        });

        // Get exam details to get academic year
        const examResponse = await api.get(`/exams/${selectedExam}`);

        const academicYearId = examResponse.data.academicYear;
        const examTypeId = examResponse.data.examType;

        // Filter for O-Level students only
        const oLevelStudents = studentsResponse.data.filter(student =>
          student.educationLevel === 'O_LEVEL'
        );

        setStudents(oLevelStudents);

        // Initialize marks array with existing marks
        const initialMarks = oLevelStudents.map(student => {
          const existingMark = marksResponse.data.find(mark =>
            mark.studentId === student._id
          );

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
            _id: existingMark ? existingMark._id : null
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
  }, [selectedClass, selectedSubject, selectedExam]);

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
    if (value !== '' && (isNaN(value) || value < 0 || value > 100)) {
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

  // Calculate grade based on marks (O-Level grading system)
  const calculateGrade = (marks) => {
    if (marks === '' || marks === undefined) return '';
    if (marks >= 81) return 'A';
    if (marks >= 61) return 'B';
    if (marks >= 41) return 'C';
    if (marks >= 21) return 'D';
    return 'F';
  };

  // Calculate points based on grade (O-Level points system)
  const calculatePoints = (grade) => {
    if (!grade) return '';
    switch (grade) {
      case 'A': return 1;
      case 'B': return 2;
      case 'C': return 3;
      case 'D': return 4;
      case 'F': return 5;
      default: return '';
    }
  };

  // Save marks
  const handleSaveMarks = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

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

      // Save marks
      await api.post(`/o-level-results/batch`, marksToSave);

      // Update marks state with calculated grades and points
      setMarks(marksWithGrades);

      // Show success message
      setSuccess('Marks saved successfully.');
      setSnackbar({
        open: true,
        message: 'Marks saved successfully',
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
            O-Level Bulk Marks Entry
          </Typography>
        </Box>

        {selectedSubject && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            onClick={() => navigate(`/marks-history/subject/${selectedSubject}?model=OLevelResult`)}
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
                          <TableCell width="30%">Student Name</TableCell>
                          <TableCell width="25%">Marks (0-100)</TableCell>
                          <TableCell width="25%">Comment</TableCell>
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
                                    onClick={() => navigate(`/marks-history/result/${mark._id}?model=OLevelResult`)}
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
                    <Tooltip title="O-Level Grading: A (81-100%), B (61-80%), C (41-60%), D (21-40%), F (0-20%)">
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
                                      grade === 'D' ? 'warning' : 'error'
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
    </Box>
  );
};

export default OLevelBulkMarksEntry;
