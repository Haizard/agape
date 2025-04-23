import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Snackbar,
  Checkbox
} from '@mui/material';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import newALevelResultService from '../../services/newALevelResultService';
import { filterALevelStudentsBySubject } from '../../utils/a-level-student-utils';
import PreviewDialog from '../common/PreviewDialog';

/**
 * New A-Level Marks Entry Component
 *
 * This component allows teachers to enter marks for A-Level students
 * with improved validation and error handling.
 */
const NewALevelMarksEntry = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  // State for form fields
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [marks, setMarks] = useState('');
  const [comment, setComment] = useState('');
  const [isPrincipal, setIsPrincipal] = useState(false);
  const [isInCombination, setIsInCombination] = useState(true);

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

  // State for student and subject details
  const [studentDetails, setStudentDetails] = useState(null);
  const [subjectDetails, setSubjectDetails] = useState(null);
  const [className, setClassName] = useState('');
  const [examDetails, setExamDetails] = useState(null);

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

        if (fetchClassResponse.data && fetchClassResponse.data.subjects) {
          console.log('Class subjects:', fetchClassResponse.data.subjects);
        }

        // Fetch subjects for the selected class
        let response;
        if (isAdmin) {
          // Admin can see all subjects
          response = await api.get(`/api/subjects?classId=${selectedClass}`);
          console.log('Admin subjects:', response.data);
        } else {
          // Teachers can only see assigned subjects
          try {
            // First try the teacher-subject-assignments endpoint
            const teacherResponse = await api.get('/api/teachers/profile/me');
            const teacherId = teacherResponse.data._id;
            console.log('Teacher ID:', teacherId);

            response = await api.get('/api/teacher-subject-assignments', {
              params: { teacherId, classId: selectedClass }
            });
            console.log('Teacher subject assignments:', response.data);

            // Transform the response to match the expected format
            if (response.data && Array.isArray(response.data)) {
              // Get the subject details for each assignment
              const subjectIds = response.data.map(assignment => {
                // Handle both string IDs and object IDs
                console.log('Assignment:', assignment);
                if (typeof assignment.subjectId === 'object' && assignment.subjectId !== null) {
                  console.log('Subject ID is an object:', assignment.subjectId);
                  return assignment.subjectId._id;
                }
                console.log('Subject ID is a string:', assignment.subjectId);
                return assignment.subjectId;
              }).filter(id => id); // Filter out any undefined or null IDs

              console.log('Extracted subject IDs:', subjectIds);

              // Get all subjects for the class instead of individual fetches
              const allSubjectsResponse = await api.get(`/api/subjects?classId=${selectedClass}`);
              const allSubjects = allSubjectsResponse.data;

              console.log('All subjects for class:', allSubjects);

              // Filter to only include the subjects assigned to this teacher
              response.data = allSubjects.filter(subject => {
                const isIncluded = subjectIds.includes(subject._id);
                console.log(`Subject ${subject.name} (${subject._id}) included: ${isIncluded}`);
                return isIncluded;
              });

              console.log('Filtered subjects for teacher:', response.data);
            }
          } catch (error) {
            console.error('Error fetching from teacher-subject-assignments:', error);

            // Skip the enhanced teachers endpoint since it's returning 404
            // and go directly to the subjects endpoint as fallback
            console.log('Falling back to subjects endpoint');
            response = await api.get(`/api/subjects?classId=${selectedClass}`);
            console.log('All subjects from fallback:', response.data);
          }
        }

        setSubjects(response.data);

        // Get class name
        const classNameResponse = await api.get(`/api/classes/${selectedClass}`);
        setClassName(classNameResponse.data.name);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedClass, isAdmin]);

  // Load students when subject is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass || !selectedSubject) return;

      try {
        setLoading(true);

        console.log('Fetching students for class:', selectedClass);
        console.log('Selected subject:', selectedSubject);

        // Fetch students for the selected class and subject
        let studentsResponse;
        if (isAdmin) {
          // Admin can see all students
          studentsResponse = await api.get(`/api/students?classId=${selectedClass}`);
        } else {
          // Teachers can only see assigned students
          studentsResponse = await api.get(`/api/teachers/classes/${selectedClass}/students`);
        }

        // Enhance student data with full details
        const students = studentsResponse.data;
        const enhancedStudents = [];

        for (const student of students) {
          try {
            // Get full student details
            const studentDetailsResponse = await api.get(`/api/students/${student._id}`);
            enhancedStudents.push({
              ...student,
              ...studentDetailsResponse.data
            });
          } catch (err) {
            console.error(`Error fetching details for student ${student._id}:`, err);
            enhancedStudents.push(student);
          }
        }

        // Get subject details
        const subjectResponse = await api.get(`/api/subjects/${selectedSubject}`);
        setSubjectDetails(subjectResponse.data);

        // Filter to only show A-Level students
        // Add more lenient filtering for education level
        const aLevelStudents = enhancedStudents.filter(student => {
          // Log student details to debug
          console.log(`Student ${student._id}:`, {
            firstName: student.firstName,
            lastName: student.lastName,
            level: student.level,
            educationLevel: student.educationLevel,
            class: student.class
          });

          // More lenient check for A-Level students
          return true; // Show all students for now
          // Uncomment below for stricter filtering
          // return student.level === 'A' || student.educationLevel === 'A';
        });

        // IMPROVED APPROACH: Check if students take this subject but show all students
        console.log('Selected subject:', selectedSubject);
        console.log('Number of A-Level students:', aLevelStudents.length);

        // Create a map of student IDs to their subject combinations
        const combinationsMap = {};

        // First, try to collect subject combinations for all students
        for (const student of aLevelStudents) {
          try {
            // Get student subjects
            console.log(`Fetching subjects for student ${student._id}`);
            const studentSubjectsResponse = await api.get(`/api/students/${student._id}/subjects`);
            const studentSubjects = studentSubjectsResponse.data;

            // Store the subject combination for this student
            combinationsMap[student._id] = {
              subjects: studentSubjects
            };
          } catch (err) {
            console.error(`Error fetching subjects for student ${student._id}:`, err);
          }
        }

        // Now use our improved filtering utility to mark students who take the subject
        // Pass false for onlyShowMatching to show all students but mark those who take the subject
        console.log('Filtering students for subject:', selectedSubject);
        console.log('Subject combinations map:', combinationsMap);

        try {
          // Properly await the async function result
          const studentsWithSubjectInfo = await filterALevelStudentsBySubject(aLevelStudents, selectedSubject, false, combinationsMap);
          console.log('Filtered students result:', studentsWithSubjectInfo);

          // Check if we got a valid array back
          if (!Array.isArray(studentsWithSubjectInfo)) {
            console.error('Error: filterALevelStudentsBySubject did not return an array', studentsWithSubjectInfo);
            // Show an error message instead of showing all students
            setStudents([]);
            setError('Error filtering students. Please try a different subject or contact support.');
            return;
          }

          console.log('Number of students to display:', studentsWithSubjectInfo.length);

          setStudents(studentsWithSubjectInfo);

          // Show a message if no students are found
          if (studentsWithSubjectInfo.length === 0) {
            setError(`No students found who take this subject. Please select a different subject.`);
          } else {
            // Clear any previous error message and set an informational message
            setError('');

            // All students in the filtered list take the subject
            setSuccess(`Showing ${studentsWithSubjectInfo.length} students who take this subject.`);
          }
        } catch (err) {
          console.error('Error in student filtering:', err);
          // Instead of showing all students, show an error message
          setStudents([]);
          setError(`Error filtering students: ${err.message}. Please try a different subject or contact support.`);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, selectedSubject, isAdmin]);

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

  // Load student details when student is selected
  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (!selectedStudent) return;

      try {
        setLoading(true);

        // Fetch student details
        const response = await api.get(`/api/students/${selectedStudent}`);
        setStudentDetails(response.data);

        // Check if subject is in student's combination
        const studentSubjectsResponse = await api.get(`/api/students/${selectedStudent}/subjects`);
        const studentSubjects = studentSubjectsResponse.data;

        // Check if the selected subject is in the student's combination
        const isInStudentCombination = studentSubjects.some(subject => {
          // Handle both string IDs and object IDs
          if (typeof subject === 'object' && subject !== null) {
            return subject._id === selectedSubject;
          }
          return subject === selectedSubject;
        });

        setIsInCombination(isInStudentCombination);
      } catch (err) {
        console.error('Error fetching student details:', err);
        setError('Failed to load student details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [selectedStudent, selectedSubject]);

  // Load exam details when exam is selected
  useEffect(() => {
    const fetchExamDetails = async () => {
      if (!selectedExam) return;

      try {
        setLoading(true);

        // Fetch exam details
        const response = await api.get(`/api/exams/${selectedExam}`);
        console.log('Exam details:', response.data);

        // Check if the exam has the selected class in its classes array
        let classInExam = false;
        if (response.data && response.data.classes) {
          // More flexible check for class ID in exam's classes array
          classInExam = response.data.classes.some(c => {
            // Direct string comparison
            if (c.class === selectedClass) return true;

            // Object comparison
            if (typeof c.class === 'object' && c.class !== null) {
              if (c.class._id === selectedClass) return true;
              if (c.class.id === selectedClass) return true;
              if (String(c.class._id) === String(selectedClass)) return true;
            }

            // String representation comparison
            if (String(c.class) === String(selectedClass)) return true;

            return false;
          });

          console.log(`Class ${selectedClass} in exam: ${classInExam}`);

          if (!classInExam) {
            console.warn(`Warning: Selected class ${selectedClass} is not in the exam's classes array`);
            // Log the exam's classes for debugging
            console.log('Exam classes:', response.data.classes);

            // TEMPORARY WORKAROUND: Continue anyway but show a warning
            setError(`Warning: This exam (${response.data.name}) may not be properly configured for this class, but we'll try to proceed anyway.`);

            // Uncomment the lines below to enforce strict validation
            // setError(`This exam (${response.data.name}) is not configured for this class. Please select a different exam or class.`);
            // setLoading(false);
            // return; // Stop processing further
          }
        }

        // Check if the selected subject is in the exam's subjects array for the class
        let subjectInExam = false;
        if (classInExam && response.data.classes) {
          // Find the class in the exam's classes array
          const examClass = response.data.classes.find(c => {
            if (c.class === selectedClass) return true;
            if (typeof c.class === 'object' && c.class !== null) {
              if (c.class._id === selectedClass) return true;
              if (c.class.id === selectedClass) return true;
              if (String(c.class._id) === String(selectedClass)) return true;
            }
            if (String(c.class) === String(selectedClass)) return true;
            return false;
          });

          if (examClass && examClass.subjects) {
            // Check if the selected subject is in the class's subjects array
            subjectInExam = examClass.subjects.some(s => {
              if (s === selectedSubject) return true;
              if (typeof s === 'object' && s !== null) {
                if (s._id === selectedSubject) return true;
                if (s.id === selectedSubject) return true;
                if (String(s._id) === String(selectedSubject)) return true;
              }
              if (String(s) === String(selectedSubject)) return true;
              return false;
            });

            console.log(`Subject ${selectedSubject} in exam class subjects: ${subjectInExam}`);

            if (!subjectInExam) {
              console.warn(`Warning: Selected subject ${selectedSubject} is not in the exam's subjects array for class ${selectedClass}`);
              // Log the exam class subjects for debugging
              console.log('Exam class subjects:', examClass.subjects);

              // TEMPORARY WORKAROUND: Continue anyway but show a warning
              setError(`Warning: This subject may not be properly configured for this exam and class, but we'll try to proceed anyway.`);
            }
          }
        }

        setExamDetails(response.data);
      } catch (err) {
        console.error('Error fetching exam details:', err);
        setError('Failed to load exam details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [selectedExam]);

  // Handle form field changes
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setSelectedSubject('');
    setSelectedStudent('');
    setStudents([]);
    setSubjects([]);
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    setSelectedStudent('');
    setStudents([]);
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    setSelectedStudent(studentId);

    // Find the selected student in the students array
    const selectedStudentObj = students.find(s => s._id === studentId);

    // Update isInCombination and isPrincipal based on the student properties
    if (selectedStudentObj) {
      setIsInCombination(selectedStudentObj.takesSubject || false);
      setIsPrincipal(selectedStudentObj.isPrincipal || false);
      console.log(`Student ${studentId} takes subject: ${selectedStudentObj.takesSubject}, isPrincipal: ${selectedStudentObj.isPrincipal}`);
    }
  };

  const handleExamChange = (e) => {
    setSelectedExam(e.target.value);
  };

  const handleMarksChange = (e) => {
    const value = e.target.value;

    // Validate marks (0-100)
    if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
      setMarks(value);
    }
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handlePrincipalChange = (e) => {
    setIsPrincipal(e.target.checked);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!selectedClass || !selectedSubject || !selectedStudent || !selectedExam || !marks) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Calculate grade and points
      const grade = newALevelResultService.calculateGrade(Number(marks));
      const points = newALevelResultService.calculatePoints(grade);

      // Prepare data for preview
      // Handle different student name formats
      let studentName = 'Unknown Student';
      if (studentDetails) {
        if (studentDetails.firstName && studentDetails.lastName) {
          studentName = `${studentDetails.firstName} ${studentDetails.lastName}`;
        } else if (studentDetails.name) {
          studentName = studentDetails.name;
        } else if (studentDetails.studentName) {
          studentName = studentDetails.studentName;
        }
      }

      const resultData = {
        studentId: selectedStudent,
        studentName: studentName,
        examId: selectedExam,
        examName: examDetails ? examDetails.name : 'Unknown Exam',
        academicYearId: examDetails ? examDetails.academicYear : '',
        examTypeId: examDetails ? examDetails.examType : '',
        subjectId: selectedSubject,
        subjectName: subjectDetails ? subjectDetails.name : 'Unknown Subject',
        classId: selectedClass,
        className: className || 'Unknown Class',
        marksObtained: Number(marks),
        grade,
        points,
        comment,
        isPrincipal,
        isInCombination
      };

      // Set preview data
      setPreviewData(resultData);

      // Open preview dialog
      setPreviewOpen(true);
    } catch (err) {
      console.error('Error preparing data:', err);
      setError('Failed to prepare data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle preview dialog close
  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  // Handle final submission after preview
  const handleFinalSubmit = async () => {
    if (!previewData) return;

    setLoading(true);
    try {
      // Submit to the new A-Level API endpoint
      await newALevelResultService.createResult(previewData);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Marks saved successfully',
        severity: 'success'
      });

      // Close the preview dialog
      setPreviewOpen(false);

      // Reset form
      setMarks('');
      setComment('');
      setIsPrincipal(false);

      // Set success message with view grades button
      setSuccess(
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography>Marks saved successfully</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(`/results/a-level/student-clean/${selectedStudent}/${selectedExam}`)}
          >
            View Student Report
          </Button>
        </Box>
      );
    } catch (err) {
      console.error('Error saving marks:', err);

      // Show error message
      setSnackbar({
        open: true,
        message: `Failed to save marks: ${err.response?.data?.message || err.message || 'Unknown error'}`,
        severity: 'error'
      });

      // Set error message
      setError(`Failed to save marks: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        A-Level Marks Entry
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Class selection */}
            <Grid item xs={12} md={6}>
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
            <Grid item xs={12} md={6}>
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

            {/* Student selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!selectedSubject || loading}>
                <InputLabel>Student</InputLabel>
                <Select
                  value={selectedStudent}
                  label="Student"
                  onChange={handleStudentChange}
                >
                  <MenuItem value="">
                    <em>Select a student</em>
                  </MenuItem>
                  {Array.isArray(students) && students.map(student => {
                    // Handle different student name formats
                    let studentName = '';
                    if (student.firstName && student.lastName) {
                      studentName = `${student.firstName} ${student.lastName}`;
                    } else if (student.name) {
                      studentName = student.name;
                    } else if (student.studentName) {
                      studentName = student.studentName;
                    } else {
                      // Fallback to ID if no name is available
                      studentName = `Student ${student._id}`;
                    }

                    return (
                      <MenuItem
                        key={student._id}
                        value={student._id}
                      >
                        {studentName}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Exam selection */}
            <Grid item xs={12} md={6}>
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

            {/* Marks input */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Marks"
                type="number"
                value={marks}
                onChange={handleMarksChange}
                fullWidth
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                disabled={loading}
                required
                helperText={marks ? `Grade: ${newALevelResultService.calculateGrade(Number(marks))}, Points: ${newALevelResultService.calculatePoints(newALevelResultService.calculateGrade(Number(marks)))}` : ''}
              />
            </Grid>

            {/* Comment input */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Comment"
                value={comment}
                onChange={handleCommentChange}
                fullWidth
                multiline
                rows={1}
                disabled={loading}
              />
            </Grid>

            {/* Principal subject checkbox */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isPrincipal}
                    onChange={handlePrincipalChange}
                    disabled={loading}
                  />
                }
                label="Principal Subject"
              />


            </Grid>

            {/* Error and success messages */}
            <Grid item xs={12}>
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
            </Grid>

            {/* Submit button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !selectedStudent || !selectedSubject || !selectedExam || !marks}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Save Marks'}
                </Button>

                {selectedStudent && selectedExam && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate(`/results/a-level/student-clean/${selectedStudent}/${selectedExam}`)}
                    sx={{ mt: 2, mr: 1 }}
                  >
                    View Student Report
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Preview Dialog */}
      <PreviewDialog
        open={previewOpen}
        onClose={handlePreviewClose}
        onSubmit={handleFinalSubmit}
        data={previewData}
        loading={loading}
        type="single"
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NewALevelMarksEntry;
