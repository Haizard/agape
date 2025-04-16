import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import teacherAuthService from '../../services/teacherAuthService';
import teacherApi from '../../services/teacherApi';
import studentSubjectsApi from '../../services/studentSubjectsApi';
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
  Checkbox,
  FormControlLabel,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
import { useAuth } from '../../contexts/AuthContext';

/**
 * A-Level Bulk Marks Entry Component
 * Allows teachers to enter marks for multiple A-Level students at once
 */
const ALevelBulkMarksEntry = () => {
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

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);

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
          const response = await api.get('/api/classes', {
            params: {
              educationLevel: 'A_LEVEL'
            }
          });
          classesData = response.data || [];
        } else {
          // Teachers can only see assigned classes
          const assignedClasses = await teacherApi.getAssignedClasses();
          // Filter for A-Level classes
          classesData = assignedClasses.filter(cls =>
            cls.educationLevel === 'A_LEVEL'
          );
        }

        // Log the classes for debugging
        console.log(`Found ${classesData.length} A-Level classes`);

        // If no classes found, show a message
        if (classesData.length === 0) {
          console.log('No A-Level classes found');
          setError('No A-Level classes found. Please contact an administrator to assign you to A-Level classes.');
        }

        setClasses(classesData);
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
        const response = await api.get('/api/exams');
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

        // Check if user is admin
        const isAdmin = teacherAuthService.isAdmin();

        let subjectsData;
        if (isAdmin) {
          // Admin can see all subjects in the class
          const response = await api.get(`/api/classes/${selectedClass}/subjects`);
          subjectsData = response.data || [];
        } else {
          // Teachers can only see assigned subjects
          subjectsData = await teacherApi.getAssignedSubjects(selectedClass);
        }

        // Filter for A-Level subjects only
        const aLevelSubjects = subjectsData.filter(subject =>
          subject.educationLevel === 'A_LEVEL' || subject.educationLevel === 'BOTH'
        );

        setSubjects(aLevelSubjects);
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

        // Check if user is admin
        const isAdmin = teacherAuthService.isAdmin();

        // If not admin, verify authorization
        if (!isAdmin) {
          // Check if teacher is authorized for this class and subject
          const isAuthorizedForClass = await teacherAuthService.isAuthorizedForClass(selectedClass);
          const isAuthorizedForSubject = await teacherAuthService.isAuthorizedForSubject(selectedClass, selectedSubject);

          if (!isAuthorizedForClass || !isAuthorizedForSubject) {
            setError('You are not authorized to view marks for this class or subject');
            setLoading(false);
            return;
          }
        }

        // Get students in the class
        let studentsData;
        if (isAdmin) {
          // Admin can see all students in the class
          const studentsResponse = await api.get(`/api/students/class/${selectedClass}`);
          studentsData = studentsResponse.data || [];
        } else {
          try {
            // Teachers can only see assigned students
            studentsData = await teacherApi.getAssignedStudents(selectedClass);
          } catch (teacherError) {
            console.error('Error fetching assigned students:', teacherError);

            // If the teacher-specific endpoint fails, try the general endpoint
            console.log('Falling back to general students endpoint');
            const response = await api.get(`/api/students/class/${selectedClass}`);
            studentsData = response.data || [];
          }
        }

        // Check if any A-Level students have unpopulated subject combinations
        const aLevelStudentsWithCombinations = studentsData.filter(student =>
          (student.educationLevel === 'A_LEVEL' || student.form === 5 || student.form === 6) &&
          student.subjectCombination &&
          typeof student.subjectCombination === 'object' &&
          !student.subjectCombination.subjects
        );

        if (aLevelStudentsWithCombinations.length > 0) {
          console.log(`Found ${aLevelStudentsWithCombinations.length} A-Level students with unpopulated subject combinations`);

          // Fetch subject combination details for these students
          for (const student of aLevelStudentsWithCombinations) {
            try {
              const combinationId = student.subjectCombination._id;
              console.log(`Fetching subject combination ${combinationId} for student ${student._id}`);

              const response = await api.get(`/api/subject-combinations/${combinationId}`);
              const fullCombination = response.data;

              // Update the student's subject combination
              student.subjectCombination = fullCombination;
              console.log(`Updated subject combination for student ${student._id}`);
            } catch (error) {
              console.error(`Error fetching subject combination for student ${student._id}:`, error);
            }
          }
        }

        // Log students with their subject combinations
        console.log(`Fetched ${studentsData.length} students for class ${selectedClass}`);

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

        console.log(`Found ${aLevelStudents.length} A-Level students out of ${studentsData.length} total students`);

        // If no A-Level students found, show a message
        if (aLevelStudents.length === 0 && studentsData.length > 0) {
          console.log('No A-Level students found, but found other students');
          setError('No A-Level students found in this class.');
        } else if (studentsData.length === 0) {
          console.log('No students found at all');
          setError('No students found in this class.');
        }

        // Filter for A-Level students with subject combinations
        const aLevelStudentsWithAssignedCombinations = aLevelStudents.filter(student =>
          student.subjectCombination
        );

        console.log(`Found ${aLevelStudentsWithAssignedCombinations.length} A-Level students with subject combinations`);

        // Get the selected subject
        const selectedSubjectObj = subjects.find(s => s._id === selectedSubject);
        if (selectedSubjectObj) {
          console.log(`Selected subject: ${selectedSubjectObj.name}`);
        }

        // Get existing marks for the selected class, subject, and exam
        const marksResponse = await api.get('/api/check-marks/check-existing', {
          params: {
            classId: selectedClass,
            subjectId: selectedSubject,
            examId: selectedExam
          }
        });

        // Get exam details to get academic year
        const examResponse = await api.get(`/api/exams/${selectedExam}`);

        const academicYearId = examResponse.data.academicYear;
        const examTypeId = examResponse.data.examType;

        // We already filtered for A-Level students above, so we can use aLevelStudents directly

        setStudents(aLevelStudents);

        // Initialize marks array with existing marks
        const initialMarks = aLevelStudents.map(student => {
          const existingMark = marksResponse.data.find(mark =>
            mark.studentId === student._id
          );

          // Check if this subject is in the student's combination
          const isInCombination = student.subjectCombination ?
            studentSubjectsApi.isSubjectInStudentCombination(selectedSubject, student) :
            false;

          // Determine if this is a principal subject for this student
          let isPrincipal = existingMark ? existingMark.isPrincipal : false;

          // If we have a subject combination, try to determine principal status from it
          if (student.subjectCombination && isInCombination) {
            // Get subjects from combination
            const combinationSubjects = studentSubjectsApi.getSubjectsFromCombination(student);

            // Find this subject in the combination
            const subjectInCombination = combinationSubjects.find(s => s._id === selectedSubject);

            // If found, use its isPrincipal flag
            if (subjectInCombination) {
              isPrincipal = subjectInCombination.isPrincipal;
            }
          }

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
            isPrincipal: isPrincipal,
            _id: existingMark ? existingMark._id : null,
            isInCombination: isInCombination
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
  }, [selectedClass, selectedSubject, selectedExam, subjects]);

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
    if (value !== '' && (Number.isNaN(Number(value)) || Number(value) < 0 || Number(value) > 100)) {
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

  // Handle principal subject change
  const handlePrincipalChange = (studentId, checked) => {
    setMarks(prevMarks =>
      prevMarks.map(mark =>
        mark.studentId === studentId
          ? { ...mark, isPrincipal: checked }
          : mark
      )
    );
  };

  // Calculate grade based on marks (A-Level grading system)
  const calculateGrade = (marks) => {
    if (marks === '' || marks === undefined) return '';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B';
    if (marks >= 60) return 'C';
    if (marks >= 50) return 'D';
    if (marks >= 40) return 'E';
    if (marks >= 35) return 'S';
    return 'F';
  };

  // Calculate points based on grade (A-Level points system)
  const calculatePoints = (grade) => {
    if (!grade) return '';
    switch (grade) {
      case 'A': return 5;
      case 'B': return 4;
      case 'C': return 3;
      case 'D': return 2;
      case 'E': return 1;
      case 'S': return 0.5;
      case 'F': return 0;
      default: return '';
    }
  };

  // Prepare marks for preview
  const handleSaveMarks = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Check if user is admin
      const isAdmin = teacherAuthService.isAdmin();

      // If not admin, verify authorization
      if (!isAdmin) {
        // Check if teacher is authorized for this class and subject
        const isAuthorizedForClass = await teacherAuthService.isAuthorizedForClass(selectedClass);
        const isAuthorizedForSubject = await teacherAuthService.isAuthorizedForSubject(selectedClass, selectedSubject);

        if (!isAuthorizedForClass || !isAuthorizedForSubject) {
          throw new Error('You are not authorized to save marks for this class or subject');
        }

        // Check if teacher is authorized for all students
        const assignedStudents = await teacherApi.getAssignedStudents(selectedClass);
        const assignedStudentIds = assignedStudents.map(student => student._id);

        // Check if any marks are for students not assigned to this teacher
        const unauthorizedMarks = marks.filter(mark =>
          mark.marksObtained !== '' && !assignedStudentIds.includes(mark.studentId)
        );

        if (unauthorizedMarks.length > 0) {
          throw new Error('You are not authorized to enter marks for some of these students');
        }
      }

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

      // Get class and exam details for preview
      const classObj = classes.find(c => c._id === selectedClass);
      const className = classObj ? `${classObj.name} ${classObj.section || ''} ${classObj.stream || ''}` : 'Unknown Class';

      const examObj = exams.find(e => e._id === selectedExam);
      const examName = examObj ? examObj.name : 'Unknown Exam';

      const subjectObj = subjects.find(s => s._id === selectedSubject);
      const subjectName = subjectObj ? subjectObj.name : 'Unknown Subject';

      // Set preview data
      setPreviewData({
        marks: marksToSave,
        className,
        examName,
        subjectName,
        totalStudents: students.length,
        markedStudents: marksToSave.length,
        summary: {
          totalMarks: marksToSave.reduce((sum, mark) => sum + Number(mark.marksObtained), 0),
          averageMark: marksToSave.length > 0 ?
            (marksToSave.reduce((sum, mark) => sum + Number(mark.marksObtained), 0) / marksToSave.length).toFixed(2) : 0,
          highestMark: marksToSave.length > 0 ?
            Math.max(...marksToSave.map(mark => Number(mark.marksObtained))) : 0,
          lowestMark: marksToSave.length > 0 ?
            Math.min(...marksToSave.map(mark => Number(mark.marksObtained))) : 0,
          gradeDistribution: {
            A: marksToSave.filter(mark => mark.grade === 'A').length,
            B: marksToSave.filter(mark => mark.grade === 'B').length,
            C: marksToSave.filter(mark => mark.grade === 'C').length,
            D: marksToSave.filter(mark => mark.grade === 'D').length,
            E: marksToSave.filter(mark => mark.grade === 'E').length,
            S: marksToSave.filter(mark => mark.grade === 'S').length,
            F: marksToSave.filter(mark => mark.grade === 'F').length
          }
        }
      });

      // Open preview dialog
      setPreviewOpen(true);

      // Update marks state with calculated grades and points
      setMarks(marksWithGrades);

    } catch (error) {
      console.error('Error preparing marks preview:', error);
      setError(`Failed to prepare marks preview: ${error.response?.data?.message || error.message}`);
      setSnackbar({
        open: true,
        message: `Failed to prepare marks preview: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
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

      // Save marks
      await api.post('/api/a-level-results/batch', previewData.marks);

      // Close preview dialog
      setPreviewOpen(false);

      // Show success message
      setSuccess('Marks saved successfully.');
      setSnackbar({
        open: true,
        message: 'Marks saved successfully',
        severity: 'success'
      });

      // Refresh data to show saved status
      handleRefresh();

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

  // Handle preview dialog close
  const handlePreviewClose = () => {
    setPreviewOpen(false);
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
            A-Level Bulk Marks Entry
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
                          <TableCell width="25%">Student Name</TableCell>
                          <TableCell width="20%">Marks (0-100)</TableCell>
                          <TableCell width="20%">Comment</TableCell>
                          <TableCell width="15%">Principal Subject</TableCell>
                          <TableCell width="10%">In Combination</TableCell>
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
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={mark.isPrincipal}
                                    onChange={(e) => handlePrincipalChange(mark.studentId, e.target.checked)}
                                    disabled={saving}
                                  />
                                }
                                label="Principal"
                              />
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
                                    onClick={() => navigate(`/marks-history/result/${mark._id}?model=ALevelResult`)}
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
                    <Tooltip title="A-Level Grading: A (80-100%), B (70-79%), C (60-69%), D (50-59%), E (40-49%), S (35-39%), F (0-34%)">
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
                          <TableCell width="30%">Student Name</TableCell>
                          <TableCell width="15%" align="center">Marks</TableCell>
                          <TableCell width="15%" align="center">Grade</TableCell>
                          <TableCell width="15%" align="center">Points</TableCell>
                          <TableCell width="15%" align="center">Principal Subject</TableCell>
                          <TableCell width="15%" align="center">In Combination</TableCell>
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
                                      grade === 'D' ? 'warning' :
                                      grade === 'E' ? 'warning' :
                                      grade === 'S' ? 'warning' : 'error'
                                    }
                                    size="small"
                                  />
                                ) : '-'}
                              </TableCell>
                              <TableCell align="center">{points || '-'}</TableCell>
                              <TableCell align="center">
                                {mark.isPrincipal ? (
                                  <Chip
                                    label="Principal"
                                    color="primary"
                                    size="small"
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

      {/* Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={handlePreviewClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Preview Marks Entry</DialogTitle>
        <DialogContent>
          {previewData && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Please review the information below before submitting:</Typography>

              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.light' }}>
                      <TableCell colSpan={2}>
                        <Typography variant="subtitle1" fontWeight="bold">Class Information</Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell width="30%"><strong>Class:</strong></TableCell>
                      <TableCell>{previewData.className}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Subject:</strong></TableCell>
                      <TableCell>{previewData.subjectName}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Exam:</strong></TableCell>
                      <TableCell>{previewData.examName}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.light' }}>
                      <TableCell colSpan={2}>
                        <Typography variant="subtitle1" fontWeight="bold">Marks Summary</Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell width="30%"><strong>Total Students:</strong></TableCell>
                      <TableCell>{previewData.totalStudents}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Students with Marks:</strong></TableCell>
                      <TableCell>{previewData.markedStudents}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Average Mark:</strong></TableCell>
                      <TableCell>{previewData.summary?.averageMark || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Highest Mark:</strong></TableCell>
                      <TableCell>{previewData.summary?.highestMark || 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Lowest Mark:</strong></TableCell>
                      <TableCell>{previewData.summary?.lowestMark || 0}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.light' }}>
                      <TableCell colSpan={7}>
                        <Typography variant="subtitle1" fontWeight="bold">Grade Distribution</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>A</strong></TableCell>
                      <TableCell><strong>B</strong></TableCell>
                      <TableCell><strong>C</strong></TableCell>
                      <TableCell><strong>D</strong></TableCell>
                      <TableCell><strong>E</strong></TableCell>
                      <TableCell><strong>S</strong></TableCell>
                      <TableCell><strong>F</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{previewData.summary?.gradeDistribution?.A || 0}</TableCell>
                      <TableCell>{previewData.summary?.gradeDistribution?.B || 0}</TableCell>
                      <TableCell>{previewData.summary?.gradeDistribution?.C || 0}</TableCell>
                      <TableCell>{previewData.summary?.gradeDistribution?.D || 0}</TableCell>
                      <TableCell>{previewData.summary?.gradeDistribution?.E || 0}</TableCell>
                      <TableCell>{previewData.summary?.gradeDistribution?.S || 0}</TableCell>
                      <TableCell>{previewData.summary?.gradeDistribution?.F || 0}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.light' }}>
                      <TableCell colSpan={4}>
                        <Typography variant="subtitle1" fontWeight="bold">Student Marks Preview (First 10)</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Student</strong></TableCell>
                      <TableCell><strong>Marks</strong></TableCell>
                      <TableCell><strong>Grade</strong></TableCell>
                      <TableCell><strong>Points</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.marks?.slice(0, 10).map((mark, index) => (
                      <TableRow key={`mark-preview-${mark.studentId || index}`}>
                        <TableCell>{mark.studentName}</TableCell>
                        <TableCell>{mark.marksObtained}</TableCell>
                        <TableCell>{mark.grade}</TableCell>
                        <TableCell>{mark.points}</TableCell>
                      </TableRow>
                    ))}
                    {previewData.marks?.length > 10 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography variant="body2" color="textSecondary">
                            ... and {previewData.marks?.length - 10} more students
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePreviewClose} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleFinalSubmit}
            color="primary"
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Confirm & Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ALevelBulkMarksEntry;
