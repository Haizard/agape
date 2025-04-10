import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import ResultService from '../../services/resultService';
import StudentService from '../../services/studentService';
import ExamService from '../../services/examService';
import SubjectService from '../../services/subjectService';
import ClassService from '../../services/classService';
import { useAuth } from '../../contexts/AuthContext';

const BatchMarksEntry = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form data
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');

  // Options for dropdowns
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  // Batch marks data
  const [marksData, setMarksData] = useState([]);

  // Existing marks tracking
  const [existingResults, setExistingResults] = useState({});
  const [updateMode, setUpdateMode] = useState({});
  const [marksExistForSubject, setMarksExistForSubject] = useState(false);

  // Results dialog
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [submissionResults, setSubmissionResults] = useState(null);

  // Load teacher's classes, exams, and subjects
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [classesResponse, examsResponse, subjectsResponse] = await Promise.all([
          ClassService.getTeacherClasses(currentUser.id),
          ExamService.getAllExams(),
          SubjectService.getTeacherSubjects(currentUser.id)
        ]);

        setClasses(classesResponse);
        setExams(examsResponse);
        setSubjects(subjectsResponse);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Failed to load initial data. Please try again.');
      }
    };

    if (currentUser && currentUser.id) {
      fetchInitialData();
    }
  }, [currentUser]);

  // Load students when class is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) return;

      try {
        setLoading(true);
        const response = await StudentService.getStudentsByClass(selectedClass);
        setStudents(response);

        // Initialize marks data
        const initialMarksData = response.map(student => ({
          studentId: student._id,
          examId: selectedExam,
          academicYearId: academicYearId,
          subjectId: selectedSubject,
          marksObtained: '',
          comment: ''
        }));

        setMarksData(initialMarksData);

        // Check for existing marks if all required fields are selected
        if (selectedExam && selectedSubject) {
          await checkExistingMarks(response, selectedExam, selectedSubject);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('Failed to load students. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (selectedClass && selectedExam && selectedSubject && academicYearId) {
      fetchStudents();
    }
  }, [selectedClass, selectedExam, selectedSubject, academicYearId]);

  // Function to check for existing marks
  const checkExistingMarks = async (studentsList, examId, subjectId) => {
    if (!studentsList || !studentsList.length || !examId || !subjectId) {
      return;
    }

    try {
      // Get class results with filters
      const results = await ResultService.getClassResults(selectedClass, {
        examId: examId,
        subjectId: subjectId
      });

      // Create a map of existing results by student ID
      const existingResultsMap = {};
      const updateModeMap = {};

      results.forEach(result => {
        if (result.studentId && result.studentId._id) {
          existingResultsMap[result.studentId._id] = result;
          updateModeMap[result.studentId._id] = true;
        }
      });

      setExistingResults(existingResultsMap);
      setUpdateMode(updateModeMap);

      // If there are any existing results, set marksExistForSubject to true
      setMarksExistForSubject(results.length > 0);

      // Update marks data with existing values
      if (marksData.length > 0) {
        const updatedMarksData = marksData.map(item => {
          const existingResult = existingResultsMap[item.studentId];
          if (existingResult) {
            return {
              ...item,
              resultId: existingResult._id, // Add result ID for update
              marksObtained: existingResult.marksObtained,
              comment: existingResult.comment || ''
            };
          }
          return item;
        });

        setMarksData(updatedMarksData);
      }
    } catch (error) {
      console.error('Error checking existing marks:', error);
    }
  };

  // Check for existing marks when class, exam, and subject are selected
  useEffect(() => {
    const checkExistingMarks = async () => {
      if (!selectedClass || !selectedExam || !selectedSubject || !students.length) {
        setExistingResults({});
        setUpdateMode({});
        return;
      }

      try {
        setLoading(true);

        // Get class results with filters
        const results = await ResultService.getClassResults(selectedClass, { examId: selectedExam, subjectId: selectedSubject });

        // Create a map of existing results by student ID
        const existingResultsMap = {};
        const updateModeMap = {};

        results.forEach(result => {
          if (result.studentId && result.studentId._id) {
            existingResultsMap[result.studentId._id] = result;
            updateModeMap[result.studentId._id] = true;
          }
        });

        setExistingResults(existingResultsMap);
        setUpdateMode(updateModeMap);

        // Update marks data with existing values
        if (marksData.length > 0) {
          const updatedMarksData = marksData.map(item => {
            const existingResult = existingResultsMap[item.studentId];
            if (existingResult) {
              return {
                ...item,
                resultId: existingResult._id, // Add result ID for update
                marksObtained: existingResult.marksObtained,
                comment: existingResult.comment || ''
              };
            }
            return item;
          });

          setMarksData(updatedMarksData);
        }
      } catch (error) {
        console.error('Error checking existing marks:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingMarks();
  }, [selectedClass, selectedExam, selectedSubject, students]);

  // Handle selection changes
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    // Reset marks data
    setMarksData([]);
  };

  const handleExamChange = (e) => {
    setSelectedExam(e.target.value);
    // Update marks data
    if (marksData.length > 0) {
      setMarksData(marksData.map(item => ({
        ...item,
        examId: e.target.value
      })));
    }
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    // Update marks data
    if (marksData.length > 0) {
      setMarksData(marksData.map(item => ({
        ...item,
        subjectId: e.target.value
      })));
    }
  };

  const handleAcademicYearChange = (e) => {
    setAcademicYearId(e.target.value);
    // Update marks data
    if (marksData.length > 0) {
      setMarksData(marksData.map(item => ({
        ...item,
        academicYearId: e.target.value
      })));
    }
  };

  // Handle marks input change
  const handleMarksChange = (studentId, value) => {
    // Validate marks
    let marks = value;
    if (marks !== '') {
      marks = Number.parseFloat(marks);
      if (Number.isNaN(marks) || marks < 0 || marks > 100) {
        return; // Invalid marks
      }
    }

    // Update marks data
    setMarksData(marksData.map(item => {
      if (item.studentId === studentId) {
        return {
          ...item,
          marksObtained: marks
        };
      }
      return item;
    }));
  };

  // Handle comment input change
  const handleCommentChange = (studentId, value) => {
    // Update marks data
    setMarksData(marksData.map(item => {
      if (item.studentId === studentId) {
        return {
          ...item,
          comment: value
        };
      }
      return item;
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      // Filter out entries with no marks
      const validMarksData = marksData.filter(item => item.marksObtained !== '');

      if (validMarksData.length === 0) {
        setError('No marks entered. Please enter marks for at least one student.');
        return;
      }

      // Prepare data for submission - include resultId for updates
      const preparedData = validMarksData.map(item => {
        // If this is an update (existing result), include the resultId
        if (updateMode[item.studentId] && existingResults[item.studentId]) {
          return {
            ...item,
            resultId: existingResults[item.studentId]._id,
            marksObtained: Number.parseFloat(item.marksObtained)
          };
        }

        // Otherwise, it's a new entry
        return {
          ...item,
          marksObtained: Number.parseFloat(item.marksObtained)
        };
      });

      // Submit the batch marks
      const response = await ResultService.enterBatchMarks(preparedData);

      // Count updates vs new entries
      const updateCount = preparedData.filter(item => item.resultId).length;
      const newCount = preparedData.length - updateCount;

      // Show success message
      setSuccessMessage(`Successfully processed ${response.results.length} results (${updateCount} updates, ${newCount} new entries).`);

      // Show results dialog if there are errors
      if (response.errors && response.errors.length > 0) {
        setSubmissionResults(response);
        setResultsDialogOpen(true);
      }

      // Don't reset marks data for updates, just show success
      // Instead, refresh the existing results data
      if (selectedClass && selectedExam && selectedSubject) {
        await checkExistingMarks(students, selectedExam, selectedSubject);
      }

    } catch (error) {
      console.error('Error entering batch marks:', error);
      setError(error.response?.data?.message || 'Failed to enter batch marks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get student name by ID
  const getStudentName = (studentId) => {
    const student = students.find(s => s._id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
  };

  // Close results dialog
  const handleCloseResultsDialog = () => {
    setResultsDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Batch Marks Entry
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardHeader title="Select Class, Exam, and Subject" />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={handleClassChange}
                  label="Class"
                  required
                >
                  <MenuItem value="">Select Class</MenuItem>
                  {classes.map((classItem) => (
                    <MenuItem key={classItem._id} value={classItem._id}>
                      {classItem.name} {classItem.section} {classItem.stream}
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
                  required
                >
                  <MenuItem value="">Select Exam</MenuItem>
                  {exams.map((exam) => (
                    <MenuItem key={exam._id} value={exam._id}>
                      {exam.name} ({exam.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  label="Subject"
                  required
                >
                  <MenuItem value="">Select Subject</MenuItem>
                  {subjects.map((subject) => (
                    <MenuItem key={subject._id} value={subject._id}>
                      {subject.name} ({subject.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Academic Year ID"
                value={academicYearId}
                onChange={handleAcademicYearChange}
                required
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      {marksData.length > 0 && (
        <Card>
          <CardHeader
            title={Object.keys(updateMode).length > 0 ? "Enter/Update Marks" : "Enter Marks"}
            subheader={Object.keys(updateMode).length > 0 ?
              `${Object.keys(updateMode).length} students have existing marks that will be updated` :
              "No existing marks found - all entries will be new"}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {Object.keys(updateMode).length > 0 && (
                  <Tooltip title="Some students have existing marks that will be updated">
                    <Chip
                      icon={<EditIcon />}
                      label="Update Mode"
                      color="primary"
                      variant="outlined"
                    />
                  </Tooltip>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save All Marks'}
                </Button>
              </Box>
            }
          />
          <Divider />
          <CardContent>
            {marksExistForSubject && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WarningIcon sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    Marks already exist for this subject, class, exam, and academic year. You can only edit existing marks.
                  </Typography>
                </Box>
              </Alert>
            )}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Roll Number</TableCell>
                    <TableCell>Marks (0-100)</TableCell>
                    <TableCell>Comment</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {marksData.map((item, index) => {
                    const student = students.find(s => s._id === item.studentId);
                    const isUpdateMode = updateMode[item.studentId];
                    const existingResult = existingResults[item.studentId];

                    return (
                      <TableRow
                        key={item.studentId}
                        sx={isUpdateMode ? { backgroundColor: 'rgba(25, 118, 210, 0.05)' } : {}}
                      >
                        <TableCell>
                          {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
                        </TableCell>
                        <TableCell>
                          {student ? student.rollNumber : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.marksObtained}
                            onChange={(e) => handleMarksChange(item.studentId, e.target.value)}
                            inputProps={{ min: 0, max: 100, step: 0.1 }}
                            size="small"
                            sx={{ width: '100px' }}
                            disabled={marksExistForSubject && !isUpdateMode}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={item.comment}
                            onChange={(e) => handleCommentChange(item.studentId, e.target.value)}
                            size="small"
                            sx={{ width: '200px' }}
                            disabled={marksExistForSubject && !isUpdateMode}
                          />
                        </TableCell>
                        <TableCell>
                          {isUpdateMode ? (
                            <Tooltip title={`Existing marks: ${existingResult?.marksObtained || 'N/A'}, Grade: ${existingResult?.grade || 'N/A'}`}>
                              <Chip
                                icon={<EditIcon fontSize="small" />}
                                label="Update"
                                color="primary"
                                size="small"
                                variant="outlined"
                              />
                            </Tooltip>
                          ) : marksExistForSubject ? (
                            <Tooltip title="Cannot enter marks because marks already exist for other students in this subject">
                              <Chip
                                icon={<WarningIcon fontSize="small" />}
                                label="Locked"
                                color="error"
                                size="small"
                                variant="outlined"
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip title="New entry">
                              <Chip
                                icon={<InfoIcon fontSize="small" />}
                                label="New"
                                color="success"
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
          </CardContent>
        </Card>
      )}

      {/* Results Dialog */}
      <Dialog
        open={resultsDialogOpen}
        onClose={handleCloseResultsDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Batch Marks Submission Results</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {submissionResults && (
              <>
                <Typography variant="body1" gutterBottom>
                  Successfully processed {submissionResults.results.length} results.
                </Typography>

                {submissionResults.errors && submissionResults.errors.length > 0 && (
                  <>
                    <Typography variant="body1" color="error" gutterBottom>
                      The following errors occurred:
                    </Typography>
                    <Box sx={{ mt: 2, mb: 2 }}>
                      {submissionResults.errors.map((error, index) => (
                        <Chip
                          key={index}
                          label={error}
                          color="error"
                          sx={{ m: 0.5 }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResultsDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BatchMarksEntry;
