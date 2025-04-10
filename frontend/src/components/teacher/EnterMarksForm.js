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
  Snackbar,
  Chip,
  Tooltip
} from '@mui/material';
import { Edit as EditIcon, Warning as WarningIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import ResultService from '../../services/resultService';
import StudentService from '../../services/studentService';
import ExamService from '../../services/examService';
import SubjectService from '../../services/subjectService';
import ClassService from '../../services/classService';
import { useAuth } from '../../contexts/AuthContext';

const EnterMarksForm = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    studentId: '',
    examId: '',
    academicYearId: '',
    examTypeId: '',
    subjectId: '',
    marksObtained: '',
    comment: ''
  });

  // Options for dropdowns
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');

  // Existing marks tracking
  const [existingResult, setExistingResult] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // Load teacher's classes
  useEffect(() => {
    const fetchTeacherClasses = async () => {
      try {
        if (!currentUser?.id) return;

        const response = await ClassService.getTeacherClasses(currentUser.id);
        setClasses(response);
      } catch (error) {
        console.error('Error fetching teacher classes:', error);
        setError('Failed to load classes. Please try again.');
      }
    };

    fetchTeacherClasses();
  }, [currentUser?.id]);

  // Load students when class is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) return;

      try {
        const response = await StudentService.getStudentsByClass(selectedClass);
        setStudents(response);
      } catch (error) {
        console.error('Error fetching students:', error);
        setError('Failed to load students. Please try again.');
      }
    };

    fetchStudents();
  }, [selectedClass]);

  // Load exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const examsResponse = await ExamService.getAllExams();
        setExams(examsResponse);
      } catch (error) {
        console.error('Error fetching exams:', error);
        setError('Failed to load exams. Please try again.');
      }
    };

    fetchExams();
  }, []);

  // Load subjects based on selected class and teacher assignment
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass || !currentUser?.id) return;

      try {
        setLoading(true);

        // Get subjects that are both assigned to the class AND to the teacher
        const teacherClassSubjects = await SubjectService.getTeacherClassSubjects(currentUser.id, selectedClass);

        setSubjects(teacherClassSubjects);

        // Reset subject selection if previously selected subject is not in the new list
        if (formData.subjectId && !teacherClassSubjects.some(subject => subject._id === formData.subjectId)) {
          setFormData(prev => ({
            ...prev,
            subjectId: ''
          }));
        }
      } catch (error) {
        console.error('Error fetching subjects for class and teacher:', error);
        setError('Failed to load subjects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedClass, currentUser?.id, formData.subjectId]);

  // Handle class selection
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    // Reset student and subject selection
    setFormData({
      ...formData,
      studentId: '',
      subjectId: '' // Reset subject selection when class changes
    });

    // Reset existing result data
    setExistingResult(null);
    setIsUpdateMode(false);
  };

  // Check for existing marks when student, exam, and subject are selected
  useEffect(() => {
    const checkExistingMarks = async () => {
      const { studentId, examId, subjectId } = formData;

      // Only check if all three fields are filled
      if (!studentId || !examId || !subjectId) {
        setExistingResult(null);
        setIsUpdateMode(false);
        return;
      }

      try {
        setLoading(true);

        // Get student results with filters
        const results = await ResultService.getStudentResults(studentId, { examId, subjectId });

        // Check if there's an existing result
        if (results && results.length > 0) {
          const result = results[0];
          setExistingResult(result);
          setIsUpdateMode(true);

          // Pre-fill the form with existing data
          setFormData(prevFormData => ({
            ...prevFormData,
            marksObtained: result.marksObtained,
            comment: result.comment || '',
            academicYearId: result.academicYearId || prevFormData.academicYearId,
            examTypeId: result.examTypeId || prevFormData.examTypeId
          }));
        } else {
          setExistingResult(null);
          setIsUpdateMode(false);
        }
      } catch (error) {
        console.error('Error checking existing marks:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingMarks();
  }, [formData]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      // Validate required fields
      if (!formData.studentId || !formData.examId || !formData.subjectId || !formData.academicYearId) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate that the subject is assigned to the teacher and class
      if (!subjects.some(subject => subject._id === formData.subjectId)) {
        setError('You are not authorized to enter marks for this subject in this class');
        return;
      }

      // Validate marks
      const marks = Number.parseFloat(formData.marksObtained);
      if (Number.isNaN(marks) || marks < 0 || marks > 100) {
        setError('Marks must be a number between 0 and 100');
        return;
      }

      // Prepare data for submission
      const dataToSubmit = {
        ...formData,
        marksObtained: marks
      };

      // If updating existing result, include the result ID
      if (isUpdateMode && existingResult) {
        dataToSubmit.resultId = existingResult._id;
      }

      // Submit the form
      await ResultService.enterMarks(dataToSubmit);

      // Show success message
      setSuccess(true);

      // Don't reset form in update mode, just show success
      if (!isUpdateMode) {
        // Reset form for new entries
        setFormData({
          ...formData,
          marksObtained: '',
          comment: ''
        });
      }

    } catch (error) {
      console.error('Error entering marks:', error);
      setError(error.response?.data?.message || 'Failed to enter marks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle success message close
  const handleSuccessClose = () => {
    setSuccess(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enter Student Marks
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Subject Restrictions</AlertTitle>
        <Typography variant="body2">
          You can only enter marks for subjects that are assigned to you for the selected class.
          If you don't see a subject you expect, please contact an administrator.
        </Typography>
      </Alert>

      <Card>
        <CardHeader
          title={isUpdateMode ? "Update Marks" : "Enter Marks"}
          action={
            existingResult && (
              <Tooltip title="You are updating existing marks">
                <Chip
                  icon={<EditIcon />}
                  label="Update Mode"
                  color="primary"
                  variant="outlined"
                />
              </Tooltip>
            )
          }
        />
        <Divider />
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
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

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Student</InputLabel>
                  <Select
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    label="Student"
                    required
                    disabled={!selectedClass}
                  >
                    <MenuItem value="">Select Student</MenuItem>
                    {students.map((student) => (
                      <MenuItem key={student._id} value={student._id}>
                        {student.firstName} {student.lastName} ({student.rollNumber})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Exam</InputLabel>
                  <Select
                    name="examId"
                    value={formData.examId}
                    onChange={handleChange}
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

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleChange}
                    label="Subject"
                    required
                    disabled={!selectedClass}
                  >
                    <MenuItem value="">
                      {!selectedClass
                        ? "Select a class first"
                        : subjects.length === 0
                          ? "No subjects assigned to you for this class"
                          : "Select Subject"}
                    </MenuItem>
                    {subjects.map((subject) => (
                      <MenuItem key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {selectedClass && subjects.length === 0 && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                    You don't have any subjects assigned to you for this class.
                    Please contact an administrator if you believe this is an error.
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Marks Obtained"
                  name="marksObtained"
                  type="number"
                  value={formData.marksObtained}
                  onChange={handleChange}
                  required
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Academic Year ID"
                  name="academicYearId"
                  value={formData.academicYearId}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Comment"
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  multiline
                  rows={3}
                />
              </Grid>

              {existingResult && (
                <Grid item xs={12}>
                  <Alert severity="info" icon={<WarningIcon />}>
                    <Typography variant="subtitle2">
                      Existing marks found for this student, exam, and subject.
                    </Typography>
                    <Typography variant="body2">
                      Current marks: {existingResult.marksObtained}, Grade: {existingResult.grade || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      You are now updating these marks instead of creating a new entry.
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {error && (
                <Grid item xs={12}>
                  <Alert severity="error">{error}</Alert>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color={isUpdateMode ? "secondary" : "primary"}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : isUpdateMode ? 'Update Marks' : 'Submit'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSuccessClose} severity="success" sx={{ width: '100%' }}>
          {isUpdateMode ? 'Marks updated successfully!' : 'Marks entered successfully!'}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnterMarksForm;
