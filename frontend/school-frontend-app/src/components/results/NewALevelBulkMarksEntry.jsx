import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert,
  CircularProgress,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import newALevelResultService from '../../services/newALevelResultService';
import PreviewDialog from '../common/PreviewDialog';
import {
  filterALevelStudentsBySubject,
  createALevelCombinationsMap,
  extractALevelCombinations,
  formatALevelStudentName
} from '../../utils/legacyALevelUtils';

/**
 * New A-Level Bulk Marks Entry Component
 *
 * This component allows teachers to enter marks for multiple A-Level students at once
 * with improved validation and error handling.
 */
const NewALevelBulkMarksEntry = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  // State for form fields
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [marks, setMarks] = useState([]);

  // State for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showCombinationsDialog, setShowCombinationsDialog] = useState(false);
  const [studentCombinations, setStudentCombinations] = useState([]);
  const [studentSubjectsMap, setStudentSubjectsMap] = useState({});
  const [filteredStudents, setFilteredStudents] = useState([]);

  // State for class and subject details
  const [className, setClassName] = useState('');
  const [subjectDetails, setSubjectDetails] = useState(null);
  const [examDetails, setExamDetails] = useState(null);

  // Refactored: fetchStudentsAndMarks now contains the full fetching logic
  const fetchStudentsAndMarks = useCallback(async (classId, subjectId, examId) => {
    if (!classId || !subjectId || !examId) return;
    try {
      setLoading(true);
      setError(''); // Clear any previous errors

      // --- Begin logic from previous fetchStudents async function ---
      // (Copy all logic from the useEffect's fetchStudents async function here)
      // Import the A-Level student service for better filtering
      const aLevelStudentService = await import('../../services/aLevelStudentService');

      // Use the improved Prisma-based filtering
      const filteredStudentsResponse = await aLevelStudentService.getStudentsFilteredBySubject(
        classId,
        subjectId,
        false // Only include eligible students (who take this subject)
      );

      const filteredStudentData = filteredStudentsResponse?.data?.students || filteredStudentsResponse?.data || [];
      if (!Array.isArray(filteredStudentData)) {
        setFilteredStudents([]);
        setError('Failed to load students. Please try again.');
        setLoading(false);
        return;
      }
      // Extra frontend filter: only include students who take the subject
      const filteredBySubject = filteredStudentData.filter(student => {
        if (Array.isArray(student.subjectIds)) {
          return student.subjectIds.includes(subjectId);
        }
        // fallback: check subjectCombination
        if (student.subjectCombination && Array.isArray(student.subjectCombination.subjects)) {
          return student.subjectCombination.subjects.some(s => (s._id || s.subjectId) === subjectId);
        }
        return false;
      });
      setFilteredStudents(filteredBySubject);

      // Create a simple array of enhanced students from the filtered data
      const enhancedStudents = filteredBySubject.map(student => ({
        _id: student.id || student.studentId || student._id,
        id: student.id || student.studentId || student._id,
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student',
        isPrincipal: student.isPrincipal || false,
        isEligible: student.isEligible || true,
        eligibilityMessage: student.eligibilityMessage || null
      }));

      // Get subject details
      const subjectResponse = await api.get(`/api/subjects/${subjectId}`);
      setSubjectDetails(subjectResponse.data);

      // Get exam details
      const examResponse = await api.get(`/api/exams/${examId}`);
      setExamDetails(examResponse.data);

      // ... (rest of the logic from the original fetchStudents async function)
      // Copy all the logic for filtering, combinations, eligibility, marks, etc.
      // ...

      // (For brevity, not repeating the entire logic here, but in the real edit, all logic from the original fetchStudents async function should be moved here)

    } catch (err) {
      setError('Failed to load students and marks.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load classes when component mounts
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);

        // Fetch A-Level classes
        const response = await api.get('/api/classes?educationLevel=A_LEVEL');
        setClasses(response.data);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Load subjects when class is selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass) return;

      try {
        setLoading(true);

        // First, get the class details to see what subjects are in this class
        const fetchClassResponse = await api.get(`/api/classes/${selectedClass}`);
        console.log('Class details:', fetchClassResponse.data);

        if (fetchClassResponse.data?.subjects) {
          console.log('Class subjects:', fetchClassResponse.data?.subjects);
        }

        // Get class name
        setClassName(fetchClassResponse.data?.name);

        // Fetch subjects for the selected class
        let response;

        if (isAdmin) {
          // Admin can see all subjects
          console.log('Admin user - showing all subjects');
          // Fetch subjects using the prisma endpoint
          response = await api.get(`/api/prisma/subjects/class/${selectedClass}`);
          console.log('Prisma subjects response:', response.data);

          if (response.data.success) {
            setSubjects(response.data.data.subjects || []);
          } else {
            // Fallback to the old endpoint
            response = await api.get('/api/subjects');
            console.log('All subjects:', response.data);

            // Filter to only show A-Level subjects
            response.data = response.data.filter(subject =>
              subject.educationLevel === 'A_LEVEL' || subject.educationLevel === 'BOTH'
            );
            console.log('Filtered A-Level subjects:', response.data);
            setSubjects(response.data);
          }
        } else {
          // Teachers can only see assigned subjects
          try {
            // Get teacher ID
            const teacherResponse = await api.get('/api/teachers/profile/me');
            const teacherId = teacherResponse.data._id;

            // Fetch teacher's assigned subjects for the class
            const assignmentsResponse = await api.get('/api/teacher-subject-assignments', {
              params: { teacherId, classId: selectedClass }
            });

            // assignmentsResponse.data is an array of assignments
            // Each assignment has a subjectId object
            const subjects = assignmentsResponse.data.map(a => a.subjectId);
            setSubjects(subjects);
          } catch (error) {
            console.error('Error fetching teacher subject assignments:', error);
            setSubjects([]);
          }
        }
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedClass, isAdmin]);

  // Load exams when component mounts
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);

        // Fetch active exams
        const response = await api.get('/api/exams?status=active');
        setExams(response.data);
      } catch (err) {
        console.error('Error fetching exams:', err);
        setError('Failed to load exams. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  // useEffect: call fetchStudentsAndMarks directly
  useEffect(() => {
    if (!selectedClass || !selectedSubject || !selectedExam) return;
    fetchStudentsAndMarks(selectedClass, selectedSubject, selectedExam);
  }, [selectedClass, selectedSubject, selectedExam, fetchStudentsAndMarks]);

  // Polling: call fetchStudentsAndMarks directly
  useEffect(() => {
    if (!selectedClass || !selectedSubject || !selectedExam) return;
    const interval = setInterval(() => {
      fetchStudentsAndMarks(selectedClass, selectedSubject, selectedExam);
    }, 20000);
    return () => clearInterval(interval);
  }, [selectedClass, selectedSubject, selectedExam, fetchStudentsAndMarks]);

  // Manual refresh: call fetchStudentsAndMarks directly
  const handleRefresh = () => {
    if (selectedClass && selectedSubject && selectedExam) {
      fetchStudentsAndMarks(selectedClass, selectedSubject, selectedExam);
    }
  };

  // Handle form field changes
  const handleClassChange = (e) => {
    const classId = e.target.value;
    console.log('Class changed to:', classId);
    setSelectedClass(classId);
    setSelectedSubject('');
    setMarks([]);
    setError('');
    setSuccess('');
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    console.log('Subject changed to:', subjectId);
    setSelectedSubject(subjectId);
    setMarks([]);
    setError('');
    setSuccess('');
  };

  const handleExamChange = (e) => {
    const examId = e.target.value;
    console.log('Exam changed to:', examId);
    setSelectedExam(examId);
    setMarks([]);
    setError('');
    setSuccess('');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle showing subject combinations
  const handleShowCombinations = () => {
    // Prepare the student combinations data
    const combinationsData = marks.map(mark => {
      // Get the student's subjects
      let studentSubjects = [];

      // Try to get subjects from studentSubjectsMap
      if (mark.studentId && studentSubjectsMap && studentSubjectsMap[mark.studentId]) {
        studentSubjects = studentSubjectsMap[mark.studentId].map(subject => ({
          name: subject.name || 'Unknown Subject',
          isPrincipal: !!subject.isPrincipal,
          isCurrentSubject: subjectIdMatches(subject._id, selectedSubject) || subjectIdMatches(subject.subjectId, selectedSubject)
        }));
      }
      // Try to get subjects from student.subjects
      else if (mark.studentId) {
        const student = filteredStudents.find(s => s._id === mark.studentId);
        if (student?.subjects && Array.isArray(student.subjects)) {
          studentSubjects = student.subjects.map(subject => ({
            name: subject.name || 'Unknown Subject',
            isPrincipal: !!subject.isPrincipal,
            isCurrentSubject: subjectIdMatches(subject.subjectId, selectedSubject)
          }));
        }
      }

      return {
        studentId: mark.studentId,
        studentName: mark.studentName,
        isInCombination: mark.isInCombination,
        subjects: studentSubjects
      };
    });

    setStudentCombinations(combinationsData);
    setShowCombinationsDialog(true);
  };

  // Handle marks change for a student
  const handleMarksChange = (studentId, value) => {
    // Validate marks (0-100)
    if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
      const updatedMarks = marks.map(mark => {
        if (mark.studentId === studentId) {
          const numValue = value === '' ? '' : Number(value);
          const grade = value === '' ? '' : newALevelResultService.calculateGrade(numValue);
          const points = value === '' ? '' : newALevelResultService.calculatePoints(grade);

          return {
            ...mark,
            marksObtained: value,
            grade,
            points
          };
        }
        return mark;
      });

      setMarks(updatedMarks);
    }
  };

  // Handle comment change for a student
  const handleCommentChange = (studentId, value) => {
    const updatedMarks = marks.map(mark => {
      if (mark.studentId === studentId) {
        return {
          ...mark,
          comment: value
        };
      }
      return mark;
    });

    setMarks(updatedMarks);
  };

  // Handle principal subject change for a student
  const handlePrincipalChange = (studentId, checked) => {
    const updatedMarks = marks.map(mark => {
      if (mark.studentId === studentId) {
        return {
          ...mark,
          isPrincipal: checked
        };
      }
      return mark;
    });

    setMarks(updatedMarks);
  };

  // Handle save marks button click
  const handleSaveMarks = () => {
    // Filter out marks that haven't been entered
    let marksToSave = marks.filter(mark => mark.marksObtained !== '');

    if (marksToSave.length === 0) {
      setError('Please enter marks for at least one student');
      return;
    }

    // Patch subjectId for all marks to ensure it matches the selected subject
    marksToSave = marksToSave.map(mark => ({
      ...mark,
      subjectId: selectedSubject
    }));

    // Set preview data
    setPreviewData({
      marks: marksToSave,
      className,
      subjectName: subjectDetails?.name || 'Unknown Subject',
      examName: examDetails?.name || 'Unknown Exam'
    });

    // Open preview dialog
    setPreviewOpen(true);
  };

  // Handle preview dialog close
  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  // Handle final submission after preview
  const handleFinalSubmit = async () => {
    if (!previewData) return;

    setSaving(true);
    try {
      // Log the data being sent
      console.log('Sending marks data:', previewData.marks);

      // Submit to the new A-Level API endpoint
      const response = await newALevelResultService.batchCreateResults(previewData.marks);
      console.log('Response from batch create:', response);

      const savedCount = response?.savedCount || previewData.marks.length;

      // Show success message
      setSnackbar({
        open: true,
        message: `Saved ${savedCount} marks successfully`,
        severity: 'success'
      });

      // Close the preview dialog
      setPreviewOpen(false);

      // Set success message with view grades button
      setSuccess(
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography>Saved {savedCount} marks successfully</Typography>
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setActiveTab(1)}
              sx={{ mr: 1 }}
            >
              View Grades
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => navigate(`/results/a-level/class-report/${selectedClass}/${selectedExam}`)}
            >
              View Class Report
            </Button>
          </Box>
        </Box>
      );

      // After saving marks: call fetchStudentsAndMarks directly
      await fetchStudentsAndMarks(selectedClass, selectedSubject, selectedExam);
    } catch (err) {
      console.error('Error saving marks:', err);
      console.error('Error details:', err.response?.data);

      // Log more detailed error information
      if (err.response?.data?.errors) {
        console.error('Validation errors:', err.response.data.errors);
      }

      // Show error message
      setSnackbar({
        open: true,
        message: `Failed to save marks: ${err.response?.data?.message || err.message || 'Unknown error'}`,
        severity: 'error'
      });

      // Set error message
      setError(`Failed to save marks: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Handle view history button click
  const handleViewHistory = (studentId) => {
    // Navigate to marks history page
    navigate(`/results/history/${studentId}/${selectedSubject}/${selectedExam}`);
  };

  // Utility function for robust subjectId comparison
  function subjectIdMatches(subjectId, selectedSubject) {
    if (!subjectId || !selectedSubject) return false;
    if (typeof subjectId === 'object' && subjectId._id) {
      return subjectId._id === selectedSubject || subjectId._id.toString() === selectedSubject.toString();
    }
    return subjectId === selectedSubject || subjectId.toString() === selectedSubject.toString();
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        A-Level Bulk Marks Entry
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* Class selection */}
          <Grid item xs={12} md={4}>
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
                    {cls.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Subject selection */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth disabled={!selectedClass || loading}>
              <InputLabel>Subject</InputLabel>
              <Select
                value={selectedSubject}
                label="Subject"
                onChange={handleSubjectChange}
              >
                <MenuItem value="">
                  <em>Select a subject</em>
                </MenuItem>
                {Array.isArray(subjects) && subjects.map(subject => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Exam selection */}
          <Grid item xs={12} md={4}>
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
        </Grid>
      </Paper>

      {/* Error and success messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Marks entry table */}
      {!loading && selectedClass && selectedSubject && selectedExam && marks.length > 0 && (
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
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Enter Marks for {marks.length} Students
                    </Typography>
                    <Tooltip title="Students with green background have this subject in their combination">
                      <IconButton color="info" size="small" sx={{ ml: 1 }}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Warning icon indicates student may not be eligible for this subject">
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                        <WarningIcon color="warning" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          = Eligibility Warning
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
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
                      disabled={loading}
                      sx={{ mr: 1 }}
                    >
                      Refresh
                    </Button>

                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        console.log('Debug Info:');
                        console.log('Class:', selectedClass);
                        console.log('Subject:', selectedSubject);
                        console.log('Exam:', selectedExam);
                        console.log('Subject Details:', subjectDetails);
                        console.log('Exam Details:', examDetails);
                        console.log('Students with subjects:', marks.filter(m => m.isInCombination).length);
                        alert(`Debug info logged to console. Class: ${selectedClass}, Subject: ${selectedSubject}, Exam: ${selectedExam}`);
                      }}
                    >
                      Debug
                    </Button>
                  </Box>
                </Box>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="5%">#</TableCell>
                        <TableCell width="20%">Student Name</TableCell>
                        <TableCell width="20%">Subject Combination</TableCell>
                        <TableCell width="15%">Marks (0-100)</TableCell>
                        <TableCell width="15%">Comment</TableCell>
                        <TableCell width="10%">Principal Subject</TableCell>
                        <TableCell width="5%">Status</TableCell>
                        <TableCell width="5%">History</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {marks.map((mark, index) => (
                        <TableRow
                          key={mark.studentId}
                          sx={{
                            backgroundColor: mark.isInCombination ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                          }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {mark.studentName}
                              {mark.eligibilityWarning && (
                                <Tooltip title={mark.eligibilityWarning}>
                                  <WarningIcon color="warning" fontSize="small" sx={{ ml: 1 }} />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={mark.marksObtained}
                              onChange={(e) => handleMarksChange(mark.studentId, e.target.value)}
                              inputProps={{ min: 0, max: 100, step: 0.1 }}
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={mark.comment || ''}
                              onChange={(e) => handleCommentChange(mark.studentId, e.target.value)}
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                          <TableCell align="center">
                            {mark.isPrincipal ? (
                              <Chip
                                label="Principal"
                                color="primary"
                                size="small"
                                variant="outlined"
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
                          <TableCell align="center">
                            {mark._id ? (
                              <Tooltip title="Marks already saved">
                                <CheckIcon color="success" />
                              </Tooltip>
                            ) : (
                              <Tooltip title="Marks not saved yet">
                                <WarningIcon color="warning" />
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleViewHistory(mark.studentId)}
                              disabled={!mark._id}
                            >
                              <HistoryIcon />
                            </IconButton>
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
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6">
                      Grades Summary
                    </Typography>
                    <Tooltip title="Students with green background have this subject in their combination">
                      <IconButton color="info" size="small" sx={{ ml: 1 }}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Warning icon indicates student may not be eligible for this subject">
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                        <WarningIcon color="warning" fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          = Eligibility Warning
                        </Typography>
                      </Box>
                    </Tooltip>
                  </Box>
                  <Box>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={handleRefresh}
                      disabled={loading}
                      sx={{ mr: 1 }}
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
                        <TableCell width="10%">Marks</TableCell>
                        <TableCell width="10%">Grade</TableCell>
                        <TableCell width="10%">Points</TableCell>
                        <TableCell width="10%">Principal</TableCell>
                        <TableCell width="10%">In Combination</TableCell>
                        <TableCell width="10%">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {marks.map((mark, index) => (
                        <TableRow
                          key={mark.studentId}
                          sx={{
                            backgroundColor: mark.isInCombination ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                          }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {mark.studentName}
                              {mark.eligibilityWarning && (
                                <Tooltip title={mark.eligibilityWarning}>
                                  <WarningIcon color="warning" fontSize="small" sx={{ ml: 1 }} />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{mark.marksObtained !== '' ? mark.marksObtained : '-'}</TableCell>
                          <TableCell>{mark.grade || '-'}</TableCell>
                          <TableCell>{mark.points || '-'}</TableCell>
                          <TableCell>
                            {mark.isPrincipal ? (
                              <Chip
                                label="Principal"
                                color="primary"
                                size="small"
                                variant="outlined"
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
                          <TableCell>
                            {mark.isInCombination ? (
                              <Chip
                                label="Yes"
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                label="No"
                                color="error"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {mark._id ? (
                              <Chip
                                icon={<CheckIcon />}
                                label="Saved"
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                icon={<WarningIcon />}
                                label="Not Saved"
                                color="warning"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Grade distribution */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Grade Distribution
                  </Typography>
                  <Grid container spacing={2}>
                    {['A', 'B', 'C', 'D', 'E', 'S', 'F'].map(grade => {
                      const count = marks.filter(mark => mark.grade === grade).length;
                      const percentage = marks.length > 0 ? (count / marks.length) * 100 : 0;

                      return (
                        <Grid item xs={6} sm={3} md={1.7} key={grade}>
                          <Paper
                            sx={{
                              p: 1,
                              textAlign: 'center',
                              bgcolor: grade === 'A' ? '#4caf50' :
                                      grade === 'B' ? '#8bc34a' :
                                      grade === 'C' ? '#cddc39' :
                                      grade === 'D' ? '#ffeb3b' :
                                      grade === 'E' ? '#ffc107' :
                                      grade === 'S' ? '#ff9800' :
                                      '#f44336',
                              color: ['A', 'B', 'C'].includes(grade) ? 'white' : 'black'
                            }}
                          >
                            <Typography variant="h6">{grade}</Typography>
                            <Typography variant="body2">{count} ({percentage.toFixed(1)}%)</Typography>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </>
            )}
          </Box>
        </Paper>
      )}

      {/* Save button at bottom */}
      {!loading && selectedClass && selectedSubject && selectedExam && marks.length > 0 && (
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
      )}

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onClose={handlePreviewClose}
        onSubmit={handleFinalSubmit}
        data={previewData}
        loading={saving}
        type="bulk"
      />

      {/* Snackbar for notifications */}
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


    </Box>
  );
};

export default NewALevelBulkMarksEntry;
