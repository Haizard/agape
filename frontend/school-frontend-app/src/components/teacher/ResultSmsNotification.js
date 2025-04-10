import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Send as SendIcon, Message as MessageIcon } from '@mui/icons-material';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const ResultSmsNotification = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [students, setStudents] = useState([]);
  const [parentContacts, setParentContacts] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [useCustomMessage, setUseCustomMessage] = useState(false);
  const [sendingStatus, setSendingStatus] = useState([]);

  // Get user from Redux store
  const user = useSelector(state => state.user?.user);
  console.log('Current user from Redux store:', user);

  useEffect(() => {
    // Always fetch academic years regardless of teacher profile
    fetchAcademicYears();

    // If user is admin, fetch all classes immediately
    if (user && user.role === 'admin') {
      console.log('User is admin, fetching all classes...');
      fetchAllClasses();
    }

    // Fetch teacher profile to get teacher ID
    const fetchTeacherProfile = async () => {
      try {
        console.log('Fetching teacher profile...');
        const response = await api.get('/api/teachers/profile/me');
        console.log('Teacher profile response:', response.data);
        const teacherId = response.data._id;
        fetchTeacherClasses(teacherId);
      } catch (err) {
        console.error('Error fetching teacher profile:', err);
        let errorMessage = 'Failed to fetch teacher profile';

        if (err.response?.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (err.response?.status === 403) {
          errorMessage = 'You do not have permission to access this page.';
        } else if (err.response?.status === 404) {
          // Special handling for the case where the teacher profile doesn't exist
          errorMessage = err.response.data.message || 'Teacher profile not found';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }

        setError(errorMessage);
      }
    };

    // Only try to fetch teacher profile if user is a teacher
    if (!user || user.role === 'teacher') {
      fetchTeacherProfile();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchExams();
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchParentContacts();
    }
  }, [selectedClass]);

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/api/academic-years');
      setAcademicYears(response.data);

      // Set the active academic year as default
      const activeYear = response.data.find(year => year.isActive);
      if (activeYear) {
        setSelectedAcademicYear(activeYear._id);
      } else if (response.data.length > 0) {
        setSelectedAcademicYear(response.data[0]._id);
      }
    } catch (err) {
      setError('Failed to fetch academic years');
    }
  };

  const fetchTeacherClasses = async (teacherId) => {
    try {
      const response = await api.get(`/api/teachers/${teacherId}/classes`);
      setTeacherClasses(response.data);
    } catch (err) {
      console.error('Error fetching teacher classes:', err);
      setError(err.response?.data?.message || 'Failed to fetch assigned classes');
    }
  };

  // For admins who don't have a teacher profile
  const fetchAllClasses = async () => {
    try {
      console.log('Fetching all classes for admin user...');
      const response = await api.get('/api/classes');
      console.log('All classes:', response.data);
      setTeacherClasses(response.data);
    } catch (err) {
      console.error('Error fetching all classes:', err);
      setError(err.response?.data?.message || 'Failed to fetch classes');
    }
  };

  const fetchExams = async () => {
    try {
      const response = await api.get('/api/exams', {
        params: { academicYearId: selectedAcademicYear }
      });
      setExams(response.data);
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError(err.response?.data?.message || 'Failed to fetch exams');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get(`/api/students/class/${selectedClass}`);
      setStudents(response.data);
      setSelectedStudents([]);
      setSelectAll(false);
    } catch (err) {
      setError('Failed to fetch students');
    }
  };

  const fetchParentContacts = async () => {
    try {
      const response = await api.get(`/api/parent-contacts/class/${selectedClass}`);
      setParentContacts(response.data);
    } catch (err) {
      console.error('Error fetching parent contacts:', err);
      setError(err.response?.data?.message || 'Failed to fetch parent contacts');
    }
  };

  const handleSelectAll = (event) => {
    setSelectAll(event.target.checked);
    if (event.target.checked) {
      setSelectedStudents(students.map(student => student._id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const getStudentParentContacts = (studentId) => {
    return parentContacts.filter(contact => contact.studentId._id === studentId);
  };

  const handleSendSingleSMS = async (studentId) => {
    setError('');
    setSuccess('');

    if (!selectedExam) {
      setError('Please select an exam');
      return;
    }

    const contacts = getStudentParentContacts(studentId);
    if (contacts.length === 0) {
      setError(`No parent contacts found for this student`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        examId: selectedExam,
        academicYearId: selectedAcademicYear,
        examName: exams.find(e => e._id === selectedExam)?.name || 'Exam'
      };

      if (useCustomMessage && customMessage) {
        payload.customMessage = customMessage;
      }

      const response = await axios.post(`/api/sms/send-result/${studentId}`, payload);

      // Update sending status
      setSendingStatus(prev => [
        ...prev,
        {
          studentId,
          studentName: `${students.find(s => s._id === studentId)?.firstName} ${students.find(s => s._id === studentId)?.lastName}`,
          status: 'success',
          message: 'SMS sent successfully'
        }
      ]);

      setSuccess(`SMS sent successfully to parents of ${response.data.student.name}`);
    } catch (err) {
      console.error('Error sending SMS:', err);

      // Update sending status
      setSendingStatus(prev => [
        ...prev,
        {
          studentId,
          studentName: `${students.find(s => s._id === studentId)?.firstName} ${students.find(s => s._id === studentId)?.lastName}`,
          status: 'error',
          message: err.response?.data?.message || 'Failed to send SMS'
        }
      ]);

      setError(err.response?.data?.message || 'Failed to send SMS');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulkSMS = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }

    if (!selectedExam) {
      setError('Please select an exam');
      return;
    }

    if (!window.confirm(`Are you sure you want to send SMS to parents of ${selectedStudents.length} students?`)) {
      return;
    }

    setError('');
    setSuccess('');
    setSendingStatus([]);
    setLoading(true);

    // Process each student one by one
    for (const studentId of selectedStudents) {
      try {
        const contacts = getStudentParentContacts(studentId);
        if (contacts.length === 0) {
          // Skip students with no contacts
          setSendingStatus(prev => [
            ...prev,
            {
              studentId,
              studentName: `${students.find(s => s._id === studentId)?.firstName} ${students.find(s => s._id === studentId)?.lastName}`,
              status: 'warning',
              message: 'No parent contacts found'
            }
          ]);
          continue;
        }

        const payload = {
          examId: selectedExam,
          academicYearId: selectedAcademicYear,
          examName: exams.find(e => e._id === selectedExam)?.name || 'Exam'
        };

        if (useCustomMessage && customMessage) {
          payload.customMessage = customMessage;
        }

        const response = await api.post(`/api/sms/send-result/${studentId}`, payload);

        // Update sending status
        setSendingStatus(prev => [
          ...prev,
          {
            studentId,
            studentName: `${students.find(s => s._id === studentId)?.firstName} ${students.find(s => s._id === studentId)?.lastName}`,
            status: 'success',
            message: 'SMS sent successfully'
          }
        ]);
      } catch (err) {
        console.error(`Error sending SMS to student ${studentId}:`, err);

        // Update sending status
        setSendingStatus(prev => [
          ...prev,
          {
            studentId,
            studentName: `${students.find(s => s._id === studentId)?.firstName} ${students.find(s => s._id === studentId)?.lastName}`,
            status: 'error',
            message: err.response?.data?.message || 'Failed to send SMS'
          }
        ]);
      }
    }

    setLoading(false);
    setSuccess(`Completed sending SMS to ${selectedStudents.length} students`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Result SMS Notification</Typography>

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
              onChange={(e) => setSelectedClass(e.target.value)}
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
            <InputLabel>Exam</InputLabel>
            <Select
              value={selectedExam}
              label="Exam"
              onChange={(e) => setSelectedExam(e.target.value)}
              disabled={!selectedClass || exams.length === 0}
            >
              {exams.map((exam) => (
                <MenuItem key={exam._id} value={exam._id}>
                  {exam.name} ({exam.type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          {error.includes('Teacher profile not found') && user && user.role === 'admin' && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              As an admin, you can still send SMS notifications for any class. Please select from the dropdowns below.
            </Typography>
          )}
          {error.includes('Teacher profile not found') && user && user.role === 'teacher' && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Your user account is not linked to a teacher profile. Please contact the administrator to set up your teacher profile.
            </Typography>
          )}
        </Alert>
      )}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Custom Message Section */}
        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>
              <MessageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Customize SMS Message
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <FormControlLabel
              control={
                <Checkbox
                  checked={useCustomMessage}
                  onChange={(e) => setUseCustomMessage(e.target.checked)}
                />
              }
              label="Use custom message"
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Custom Message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              disabled={!useCustomMessage}
              sx={{ mt: 2 }}
              helperText="You can use placeholders: {studentName}, {average}, {division}, {points}"
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              If you don't use a custom message, the system will generate a standard message with the student's results.
            </Alert>
          </AccordionDetails>
        </Accordion>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {students.length > 0 ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    }
                    label="Select All"
                  />

                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleSendBulkSMS}
                    disabled={selectedStudents.length === 0 || !selectedExam}
                    color="primary"
                  >
                    Send to Selected ({selectedStudents.length})
                  </Button>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectAll}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                        <TableCell>Student Name</TableCell>
                        <TableCell>Roll Number</TableCell>
                        <TableCell>Parent Contacts</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((student) => {
                        const contacts = getStudentParentContacts(student._id);
                        const hasContacts = contacts.length > 0;
                        const sendingResult = sendingStatus.find(s => s.studentId === student._id);

                        return (
                          <TableRow key={student._id}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedStudents.includes(student._id)}
                                onChange={() => handleSelectStudent(student._id)}
                                disabled={!hasContacts}
                              />
                            </TableCell>
                            <TableCell>
                              {student.firstName} {student.lastName}
                              {sendingResult && (
                                <Chip
                                  size="small"
                                  label={sendingResult.status === 'success' ? 'Sent' : sendingResult.status === 'warning' ? 'Skipped' : 'Failed'}
                                  color={sendingResult.status === 'success' ? 'success' : sendingResult.status === 'warning' ? 'warning' : 'error'}
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </TableCell>
                            <TableCell>{student.rollNumber}</TableCell>
                            <TableCell>
                              {hasContacts ? (
                                <Box>
                                  {contacts.map((contact, index) => (
                                    <Typography key={contact._id} variant="body2">
                                      {contact.parentName} ({contact.relationship}): {contact.phoneNumber}
                                    </Typography>
                                  ))}
                                </Box>
                              ) : (
                                <Chip
                                  size="small"
                                  label="No contacts"
                                  color="warning"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<SendIcon />}
                                onClick={() => handleSendSingleSMS(student._id)}
                                disabled={!hasContacts || !selectedExam}
                              >
                                Send SMS
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : selectedClass ? (
              <Alert severity="info">No students found in this class.</Alert>
            ) : (
              <Alert severity="info">Please select a class to view students.</Alert>
            )}
          </>
        )}

        {/* Sending Status Summary */}
        {sendingStatus.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>Sending Status</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
                  <Typography variant="subtitle2">Success</Typography>
                  <Typography variant="h6">
                    {sendingStatus.filter(s => s.status === 'success').length}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#fff3e0' }}>
                  <Typography variant="subtitle2">Skipped</Typography>
                  <Typography variant="h6">
                    {sendingStatus.filter(s => s.status === 'warning').length}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, bgcolor: '#ffebee' }}>
                  <Typography variant="subtitle2">Failed</Typography>
                  <Typography variant="h6">
                    {sendingStatus.filter(s => s.status === 'error').length}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ResultSmsNotification;
