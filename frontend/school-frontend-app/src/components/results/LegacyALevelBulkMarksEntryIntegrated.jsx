import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  IconButton,
  Divider,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  ArrowBack as ArrowBackIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import PreviewDialog from '../common/PreviewDialog';
import aLevelGradeCalculator from '../../utils/aLevelGradeUtils';
import DirectStudentFetcher from './DirectStudentFetcher';
import {
  filterALevelStudentsBySubject,
  createALevelCombinationsMap,
  extractALevelCombinations,
  formatALevelStudentName
} from '../../utils/legacyALevelUtils';

/**
 * Legacy A-Level Bulk Marks Entry Integrated Component
 *
 * This component provides a complete implementation of A-Level bulk marks entry
 * using the legacy approach but with modern UI elements and integration with
 * the existing dashboard.
 */
const LegacyALevelBulkMarksEntryIntegrated = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';
  const location = useLocation();

  // State for form fields
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Class, subject, and exam details
  const [className, setClassName] = useState('');
  const [subjectDetails, setSubjectDetails] = useState(null);
  const [examDetails, setExamDetails] = useState(null);
  const [showInfoCard, setShowInfoCard] = useState(true);

  // Load classes on component mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/api/classes', {
          params: { educationLevel: 'A_LEVEL' }
        });
        setClasses(response.data);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes');
      }
    };

    fetchClasses();
  }, []);

  // Load subjects when class is selected
  useEffect(() => {
    if (!selectedClass) return;

    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/subjects', {
          params: { educationLevel: 'A_LEVEL' }
        });
        setSubjects(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects');
        setLoading(false);
      }
    };

    fetchSubjects();

    // Get class name
    const selectedClassObj = classes.find(c => c._id === selectedClass);
    if (selectedClassObj) {
      setClassName(selectedClassObj.name);
    }
  }, [selectedClass, classes]);

  // Load exams when class is selected
  useEffect(() => {
    if (!selectedClass) return;

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
  }, [selectedClass]);

  // Load marks when class, subject, and exam are selected
  useEffect(() => {
    if (!selectedClass || !selectedSubject || !selectedExam) return;

    const fetchMarks = async () => {
      try {
        setLoading(true);
        setError('');
        setSuccess('');

        // Get subject details
        const subjectObj = subjects.find(s => s._id === selectedSubject);
        setSubjectDetails(subjectObj);

        // Get exam details
        const examObj = exams.find(e => e._id === selectedExam);
        setExamDetails(examObj);

        // Fetch students in the class
        const studentsResponse = await api.get('/api/students', {
          params: { classId: selectedClass, educationLevel: 'A_LEVEL' }
        });

        // Filter for A-Level students by educationLevel OR form level (5 or 6)
        const aLevelStudents = studentsResponse.data.filter(student => {
          // Check if student is explicitly marked as A_LEVEL
          const isALevel = student.educationLevel === 'A_LEVEL';

          // Check if student is in Form 5 or 6 (A-Level forms)
          const isFormFiveOrSix =
            student.form === 5 || student.form === 6 ||
            student.form === '5' || student.form === '6' ||
            (typeof student.form === 'string' &&
              (student.form.includes('Form 5') ||
               student.form.includes('Form 6') ||
               student.form.includes('Form V') ||
               student.form.includes('Form VI')));

          // Determine if this is an A-Level student
          return isALevel || isFormFiveOrSix;
        });

        console.log(`Found ${aLevelStudents.length} A-Level students out of ${studentsResponse.data.length} total students`);

        // Check if any students have subject combinations
        const anyStudentHasSubjectCombination = aLevelStudents.some(student =>
          student.subjectCombination || student.combination
        );

        console.log(`Any student has subject combination: ${anyStudentHasSubjectCombination}`);

        // Create a map of student IDs to their subject combinations
        let combinationsMap = {};
        let filteredStudents = [];

        if (anyStudentHasSubjectCombination) {
          try {
            // Extract combinations from the student data
            const combinations = extractALevelCombinations(aLevelStudents);
            combinationsMap = createALevelCombinationsMap(combinations);

            // Get the subject details to determine if it's principal
            console.log(`Filtering students for subject ${selectedSubject} (${subjectObj?.name || 'Unknown'})`);

            // Filter students who have this subject in their combination
            // First try as principal subject
            const principalStudents = filterALevelStudentsBySubject(aLevelStudents, selectedSubject, true, combinationsMap);
            console.log(`Found ${principalStudents.length} students who take ${subjectObj?.name || selectedSubject} as principal subject`);

            // Then try as subsidiary subject
            const subsidiaryStudents = filterALevelStudentsBySubject(aLevelStudents, selectedSubject, false, combinationsMap);
            console.log(`Found ${subsidiaryStudents.length} students who take ${subjectObj?.name || selectedSubject} as subsidiary subject`);

            // Combine the results (avoiding duplicates)
            const studentIds = new Set();
            const combinedStudents = [];

            // Add principal students first
            principalStudents.forEach(student => {
              studentIds.add(student._id);
              combinedStudents.push({
                ...student,
                isPrincipal: true
              });
            });

            // Add subsidiary students if not already added
            subsidiaryStudents.forEach(student => {
              if (!studentIds.has(student._id)) {
                studentIds.add(student._id);
                combinedStudents.push({
                  ...student,
                  isPrincipal: false
                });
              }
            });

            console.log(`Combined ${combinedStudents.length} students who take ${subjectObj?.name || selectedSubject}`);

            // If we found students who take this subject, use them
            if (combinedStudents.length > 0) {
              filteredStudents = combinedStudents;
            } else {
              // If no students take this subject, show all students
              console.log('No students found who take this subject, showing all students');
              filteredStudents = aLevelStudents;
            }
          } catch (error) {
            console.error('Error filtering students by subject combination:', error);
            // Fallback to showing all students
            filteredStudents = aLevelStudents;
          }
        } else {
          // If no students have subject combinations, show all students
          console.log('No students have subject combinations, showing all students');
          filteredStudents = aLevelStudents;
        }

        // Fetch existing marks
        let marksResponse;
        try {
          // Try to fetch A-Level results first
          const aLevelResponse = await api.get('/api/a-level-results', {
            params: {
              classId: selectedClass,
              subjectId: selectedSubject,
              examId: selectedExam
            }
          });

          // Filter results for the selected subject and exam
          const filteredResults = aLevelResponse.data.filter(result =>
            result.subjectId === selectedSubject &&
            result.examId === selectedExam
          );

          console.log(`Found ${filteredResults.length} A-Level results for subject ${selectedSubject}`);

          // Format the response to match the expected format
          marksResponse = {
            data: {
              studentsWithMarks: filteredResults.map(result => ({
                studentId: result.studentId,
                marksObtained: result.marksObtained,
                grade: result.grade,
                points: result.points,
                comment: result.comment,
                isPrincipal: result.isPrincipal,
                _id: result._id
              }))
            }
          };
        } catch (aLevelError) {
          console.error('Error fetching A-Level results:', aLevelError);

          // Fallback to the check-marks endpoint
          console.log('Falling back to check-marks endpoint');
          marksResponse = await api.get('/api/check-marks/check-existing', {
            params: {
              classId: selectedClass,
              subjectId: selectedSubject,
              examId: selectedExam
            }
          });
        }

        // Combine students with existing marks
        const studentsWithMarks = filteredStudents.map(student => {
          // Find existing mark for this student
          const existingMark = marksResponse.data.studentsWithMarks.find(
            mark => mark.studentId === student._id
          );

          // Determine if this student takes this subject (isInCombination)
          const isInCombination = anyStudentHasSubjectCombination ?
            (combinationsMap[student._id] && combinationsMap[student._id].subjects &&
             combinationsMap[student._id].subjects.some(s => s.subjectId === selectedSubject)) :
            true;

          // Determine if this is a principal subject for this student
          const isPrincipal = existingMark ? existingMark.isPrincipal :
                            (student.isPrincipal !== undefined ? student.isPrincipal :
                             (combinationsMap[student._id] && combinationsMap[student._id].subjects &&
                              combinationsMap[student._id].subjects.find(s => s.subjectId === selectedSubject)?.isPrincipal));

          return {
            studentId: student._id,
            studentName: formatALevelStudentName(student),
            marksObtained: existingMark ? existingMark.marksObtained : '',
            grade: existingMark ? existingMark.grade : '',
            points: existingMark ? existingMark.points : '',
            comment: existingMark ? existingMark.comment : '',
            isPrincipal: isPrincipal || false,
            isInCombination: isInCombination,
            _id: existingMark ? existingMark._id : null
          };
        });

        setMarks(studentsWithMarks);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchMarks();
  }, [selectedClass, selectedSubject, selectedExam, subjects, exams]);

  // Handle class change
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
    setSelectedSubject('');
    setSelectedExam('');
    setMarks([]);
    setError('');
    setSuccess('');
  };

  // Handle subject change
  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
    setMarks([]);
    setError('');
    setSuccess('');
  };

  // Handle exam change
  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
    setMarks([]);
    setError('');
    setSuccess('');
  };

  // Handle marks change
  const handleMarksChange = (studentId, value) => {
    const numericValue = value === '' ? '' : Number(value);

    setMarks(prevMarks =>
      prevMarks.map(mark => {
        if (mark.studentId === studentId) {
          // Calculate grade and points based on marks
          let grade = '';
          let points = '';

          if (numericValue !== '') {
            grade = aLevelGradeCalculator.calculateGrade(numericValue);
            points = aLevelGradeCalculator.calculatePoints(grade);
          }

          return {
            ...mark,
            marksObtained: numericValue,
            grade,
            points
          };
        }
        return mark;
      })
    );
  };

  // Handle comment change
  const handleCommentChange = (studentId, value) => {
    setMarks(prevMarks =>
      prevMarks.map(mark =>
        mark.studentId === studentId ? { ...mark, comment: value } : mark
      )
    );
  };

  // Handle principal change
  const handlePrincipalChange = (studentId, checked) => {
    setMarks(prevMarks =>
      prevMarks.map(mark =>
        mark.studentId === studentId ? { ...mark, isPrincipal: checked } : mark
      )
    );
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle refresh
  const handleRefresh = () => {
    if (selectedClass && selectedSubject && selectedExam) {
      // Trigger re-fetch by changing a dependency
      setSelectedExam(prev => {
        setTimeout(() => setSelectedExam(prev), 10);
        return '';
      });
    }
  };

  // Handle save marks button click
  const handleSaveMarks = () => {
    // Validate marks
    if (marks.length === 0) {
      setError('No students found for this class and subject');
      return;
    }

    // Filter out marks that haven't been entered
    const marksToSave = marks.filter(mark => mark.marksObtained !== '');

    if (marksToSave.length === 0) {
      setError('Please enter marks for at least one student');
      return;
    }

    // Prepare marks for saving
    const preparedMarks = marksToSave.map(mark => ({
      studentId: mark.studentId,
      examId: selectedExam,
      academicYearId: examDetails?.academicYear || '',
      examTypeId: examDetails?.examType || selectedExam, // Fallback to examId if examType is not available
      subjectId: selectedSubject,
      classId: selectedClass,
      marksObtained: Number(mark.marksObtained),
      grade: mark.grade,
      points: mark.points,
      comment: mark.comment || '',
      isPrincipal: mark.isPrincipal,
      _id: mark._id || undefined
    }));

    // Set preview data
    setPreviewData({
      marks: preparedMarks,
      className,
      subjectName: subjectDetails ? subjectDetails.name : 'Unknown Subject',
      examName: examDetails ? examDetails.name : 'Unknown Exam'
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
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!previewData || !previewData.marks || previewData.marks.length === 0) {
        throw new Error('No marks to save');
      }

      // Save marks using the legacy endpoint
      console.log(`Saving ${previewData.marks.length} marks to the server using legacy endpoint`);
      const saveResponse = await api.post('/api/legacy-a-level-results/batch', previewData.marks);
      console.log('Save response:', saveResponse.data);

      // Log the structure of the saved marks
      if (saveResponse.data.results && Array.isArray(saveResponse.data.results)) {
        console.log('First saved mark structure:', saveResponse.data.results[0]);
      }

      // Close the preview dialog
      setPreviewOpen(false);

      // Update marks with saved IDs
      if (saveResponse.data.results) {
        const savedResults = saveResponse.data.results;

        setMarks(prevMarks =>
          prevMarks.map(mark => {
            const savedMark = savedResults.find(result => result.studentId === mark.studentId);
            if (savedMark) {
              return {
                ...mark,
                _id: savedMark._id,
                grade: savedMark.grade,
                points: savedMark.points
              };
            }
            return mark;
          })
        );
      }

      // Show success message
      setSuccess('Marks saved successfully');
      setSnackbar({
        open: true,
        message: 'Marks saved successfully',
        severity: 'success'
      });

      setSaving(false);
    } catch (err) {
      console.error('Error saving marks:', err);
      setError(`Failed to save marks: ${err.message || 'Unknown error'}`);
      setSnackbar({
        open: true,
        message: `Failed to save marks: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
      setSaving(false);
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

  // Calculate grade statistics
  const calculateGradeStats = () => {
    const stats = {
      A: 0, B: 0, C: 0, D: 0, E: 0, S: 0, F: 0
    };

    const marksWithGrades = marks.filter(mark => mark.grade);

    marksWithGrades.forEach(mark => {
      if (stats.hasOwnProperty(mark.grade)) {
        stats[mark.grade]++;
      }
    });

    return {
      stats,
      total: marksWithGrades.length
    };
  };

  const { stats, total } = calculateGradeStats();

  return (
    <Box sx={{ p: 3 }}>
      {showInfoCard && (
        <Card sx={{ mb: 3, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" color="primary">
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Legacy A-Level Bulk Marks Entry
              </Typography>
              <Button
                size="small"
                onClick={() => setShowInfoCard(false)}
                variant="outlined"
              >
                Hide
              </Button>
            </Box>
            <Typography variant="body2" paragraph>
              You are using the legacy implementation of A-Level bulk marks entry. This implementation uses the old version's approach to bypass issues with the new implementation.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This component uses the endpoint <code>/api/legacy-a-level-results/batch</code> for saving marks.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleGoBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            A-Level Bulk Marks Entry (Legacy)
          </Typography>
        </Box>

        {selectedSubject && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<HistoryIcon />}
            onClick={() => navigate(`/marks-history/subject/${selectedSubject}?model=ALevelResult`)}
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
                <MenuItem value="">
                  <em>Select a class</em>
                </MenuItem>
                {classes.map(classItem => (
                  <MenuItem key={classItem._id} value={classItem._id}>
                    {classItem.name}
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
                <MenuItem value="">
                  <em>Select a subject</em>
                </MenuItem>
                {subjects.map(subject => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
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
                <MenuItem value="">
                  <em>Select an exam</em>
                </MenuItem>
                {exams.map(exam => (
                  <MenuItem key={exam._id} value={exam._id}>
                    {exam.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

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

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* DirectStudentFetcher for enhanced student data - hidden in production */}
      {false && selectedClass && (
        <DirectStudentFetcher
          classId={selectedClass}
          onStudentsLoaded={(students) => {
            if (students && students.length > 0 && marks.length > 0) {
              // Enhance marks with additional student data
              const enhancedMarks = marks.map(mark => {
                const student = students.find(s => s.id === mark.studentId);
                if (student) {
                  return {
                    ...mark,
                    studentName: student.name || mark.studentName
                  };
                }
                return mark;
              });

              console.log('Updated marks with student names from DirectStudentFetcher');
              setMarks(enhancedMarks);
            }
          }}
        />
      )}

      {!loading && selectedClass && selectedSubject && selectedExam && marks.length > 0 && (
        <>
          <Box sx={{ mb: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Enter Marks" />
              <Tab label="View Summary" />
            </Tabs>
          </Box>

          {activeTab === 0 && (
            <Box>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveMarks}
                    disabled={loading || saving}
                    sx={{ mr: 1 }}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Save All Marks'}
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={loading || saving}
                  >
                    Refresh
                  </Button>
                </Box>

                <Box>
                  <Tooltip title="Principal subjects are used for division calculation">
                    <IconButton color="info">
                      <HelpIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="'In Combination' shows whether this subject is part of the student's subject combination">
                    <IconButton color="info" sx={{ ml: 1 }}>
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>No.</TableCell>
                      <TableCell>Student Name</TableCell>
                      <TableCell>Marks</TableCell>
                      <TableCell>Grade</TableCell>
                      <TableCell>Points</TableCell>
                      <TableCell>Comment</TableCell>
                      <TableCell align="center">Principal</TableCell>
                      <TableCell align="center">In Combination</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marks.map((mark, index) => (
                      <TableRow key={mark.studentId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{mark.studentName}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            inputProps={{ min: 0, max: 100, step: 1 }}
                            value={mark.marksObtained}
                            onChange={(e) => handleMarksChange(mark.studentId, e.target.value)}
                            size="small"
                            sx={{ width: '80px' }}
                          />
                        </TableCell>
                        <TableCell>{mark.grade}</TableCell>
                        <TableCell>{mark.points}</TableCell>
                        <TableCell>
                          <TextField
                            value={mark.comment || ''}
                            onChange={(e) => handleCommentChange(mark.studentId, e.target.value)}
                            size="small"
                            sx={{ width: '120px' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={mark.isPrincipal}
                            onChange={(e) => handlePrincipalChange(mark.studentId, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={mark.isInCombination ? "Yes" : "No"}
                            color={mark.isInCombination ? "success" : "default"}
                            size="small"
                            variant="outlined"
                          />
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
                          ) : mark.marksObtained ? (
                            <Chip
                              icon={<WarningIcon />}
                              label="Unsaved"
                              color="warning"
                              size="small"
                              variant="outlined"
                            />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Grade Summary
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Grade</TableCell>
                          <TableCell>Count</TableCell>
                          <TableCell>Percentage</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {['A', 'B', 'C', 'D', 'E', 'S', 'F'].map(grade => {
                          const count = stats[grade] || 0;
                          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';

                          return (
                            <TableRow key={grade}>
                              <TableCell>{grade}</TableCell>
                              <TableCell>{count}</TableCell>
                              <TableCell>{percentage}%</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell><strong>Total</strong></TableCell>
                          <TableCell><strong>{total}</strong></TableCell>
                          <TableCell><strong>100%</strong></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Pass Rate
                    </Typography>

                    <Typography variant="body1">
                      Principal Subjects (A-E): {' '}
                      {total > 0 ?
                        (((stats.A + stats.B + stats.C + stats.D + stats.E) / total) * 100).toFixed(1)
                        : '0.0'}%
                    </Typography>

                    <Typography variant="body1">
                      Subsidiary Subjects (A-S): {' '}
                      {total > 0 ?
                        (((stats.A + stats.B + stats.C + stats.D + stats.E + stats.S) / total) * 100).toFixed(1)
                        : '0.0'}%
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="body2" color="text.secondary">
                      For principal subjects, grades A-E are considered passing grades.
                      For subsidiary subjects, grades A-S are considered passing grades.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </>
      )}

      {!loading && selectedClass && selectedSubject && selectedExam && marks.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No students found for this class and subject. Please check your selection or add students to this class.
        </Alert>
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

export default LegacyALevelBulkMarksEntryIntegrated;
