import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import api from '../../services/api';
import unifiedTeacherAssignmentService from '../../services/unifiedTeacherAssignmentService';
import { getUserRole } from '../../utils/authUtils';

const TeacherSubjectAssignmentDialog = ({ open, onClose, classId, className, subjects = [] }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [subjectTeachers, setSubjectTeachers] = useState({});

  // Fetch teachers when dialog opens
  useEffect(() => {
    if (open && classId) {
      fetchTeachers();
      initializeSubjectTeachers();
    }
  }, [open, classId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch all teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/teachers');
      setTeachers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setError('Failed to fetch teachers');
      setLoading(false);
    }
  };

  // Initialize subject-teacher assignments from existing data
  const initializeSubjectTeachers = async () => {
    try {
      if (!classId) return;

      setLoading(true);
      const response = await api.get(`/api/classes/${classId}`);
      const classData = response.data;

      // Create a map of subject ID to teacher ID
      const assignments = {};
      if (classData.subjects?.length > 0) {
        for (const subjectAssignment of classData.subjects) {
          const subjectId = subjectAssignment.subject?._id || subjectAssignment.subject;

          // Ensure we get a valid teacher ID or null (never empty string or undefined)
          let teacherId = null;
          if (subjectAssignment.teacher) {
            teacherId = subjectAssignment.teacher?._id || subjectAssignment.teacher;
            // Ensure it's a string
            teacherId = teacherId.toString();
          }

          if (subjectId) {
            console.log(`Initializing subject ${subjectId} with teacher ${teacherId || 'null'}`);
            assignments[subjectId] = teacherId || null; // Use null instead of empty string
          }
        }
      }

      console.log('Initialized subject-teacher assignments:', assignments);
      setSubjectTeachers(assignments);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing subject teachers:', error);
      setError('Failed to load existing assignments');
      setLoading(false);
    }
  };

  // Handle teacher selection for a subject
  const handleTeacherChange = (subjectId, teacherId) => {
    console.log(`Changing teacher for subject ${subjectId} to ${teacherId}`);
    // Log the previous value for debugging
    console.log(`Previous teacher for subject ${subjectId}: ${subjectTeachers[subjectId] || 'none'}`);

    // Check if this is an admin user
    if (teacherId) {
      const selectedTeacher = teachers.find(t => t._id === teacherId);
      if (selectedTeacher) {
        console.log(`Selected teacher:`, selectedTeacher);
        // Check if teacher is admin by looking at user property or isAdmin flag
        if (selectedTeacher.isAdmin || (selectedTeacher.user && selectedTeacher.user.role === 'admin')) {
          console.warn(`WARNING: Assigning admin user ${selectedTeacher.firstName} ${selectedTeacher.lastName} as teacher for subject ${subjectId}`);
        }
      }
    }

    // Ensure teacherId is a valid string or null (never empty string or undefined)
    const validTeacherId = teacherId ? teacherId.toString() : null;

    setSubjectTeachers(prev => {
      const updated = {
        ...prev,
        [subjectId]: validTeacherId
      };
      console.log('Updated subject-teacher assignments:', updated);
      return updated;
    });
  };

  // Save all teacher-subject assignments
  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Check for any admin assignments
      const adminTeachers = teachers.filter(t => t.isAdmin || (t.user && t.user.role === 'admin'));
      const adminTeacherIds = adminTeachers.map(t => t._id);

      // Check if any subjects are assigned to admin
      const adminAssignments = Object.entries(subjectTeachers)
        .filter(([_, teacherId]) => adminTeacherIds.includes(teacherId))
        .map(([subjectId]) => subjectId);

      if (adminAssignments.length > 0) {
        console.warn('WARNING: Assigning admin users as teachers for subjects:', adminAssignments);
      }

      // Get the current user's role using the robust method
      const userRole = getUserRole();
      console.log('Current user role:', userRole);

      // Use the unified teacher assignment service
      const result = await unifiedTeacherAssignmentService.assignTeachersToSubjects(
        classId,
        subjectTeachers,
        true // Always use admin endpoint for this dialog
      );

      console.log('Assignment result:', result);

      setSuccess('Teacher assignments saved successfully');

      // We no longer need to update each teacher's subjects array separately
      // The unified service handles all the necessary updates

      setLoading(false);

      // Close the dialog after a short delay to show success message
      setTimeout(() => {
        onClose(true); // Pass true to indicate successful save
      }, 1500);
    } catch (error) {
      console.error('Error saving teacher assignments:', error);
      setError('Failed to save teacher assignments');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        Assign Teachers to Subjects for {className}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
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

            <Typography variant="body2" color="text.secondary" paragraph>
              Assign teachers to each subject in this class. This will ensure teachers can enter marks for their assigned subjects.
            </Typography>

            <Grid container spacing={2}>
              {subjects.map(subject => {
                const subjectId = subject._id || subject;
                const subjectName = subject.name || subject.code || subjectId;

                return (
                  <Grid item xs={12} key={subjectId}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="subtitle1">
                            {subjectName}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <FormControl fullWidth>
                            <InputLabel>Assign Teacher</InputLabel>
                            <Select
                              value={subjectTeachers[subjectId] || ''}
                              onChange={(e) => {
                                // Handle the empty string case explicitly
                                const newValue = e.target.value === '' ? null : e.target.value;
                                handleTeacherChange(subjectId, newValue);
                              }}
                              label="Assign Teacher"
                            >
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                              {teachers.map(teacher => (
                                <MenuItem key={teacher._id} value={teacher._id}>
                                  {teacher.firstName} {teacher.lastName}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Save Assignments'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

TeacherSubjectAssignmentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  classId: PropTypes.string,
  className: PropTypes.string,
  subjects: PropTypes.array
};

export default TeacherSubjectAssignmentDialog;
