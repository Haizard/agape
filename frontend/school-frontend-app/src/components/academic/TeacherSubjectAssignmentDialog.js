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
          const teacherId = subjectAssignment.teacher?._id || subjectAssignment.teacher;
          if (subjectId) {
            assignments[subjectId] = teacherId || '';
          }
        }
      }

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
    setSubjectTeachers(prev => ({
      ...prev,
      [subjectId]: teacherId
    }));
  };

  // Save all teacher-subject assignments
  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Format the subjects array with subject and teacher IDs
      const subjectsArray = subjects.map(subject => {
        const subjectId = subject._id || subject;
        return {
          subject: subjectId,
          teacher: subjectTeachers[subjectId] || null
        };
      });

      // Update the class with the new subjects array
      await api.put(`/api/classes/${classId}/subjects`, {
        subjects: subjectsArray
      });

      setSuccess('Teacher assignments saved successfully');

      // Group subjects by teacher
      const teacherSubjectsMap = {};

      // Collect all subjects for each teacher
      for (const subject of subjects) {
        const subjectId = subject._id || subject;
        const teacherId = subjectTeachers[subjectId];

        if (teacherId) {
          if (!teacherSubjectsMap[teacherId]) {
            teacherSubjectsMap[teacherId] = [];
          }
          teacherSubjectsMap[teacherId].push(subjectId);
        }
      }

      // Update each teacher's subjects in a single API call per teacher
      for (const [teacherId, subjectIds] of Object.entries(teacherSubjectsMap)) {
        try {
          // Add these subjects to the teacher's subjects array
          await api.put(`/api/teachers/${teacherId}/subjects`, {
            subjects: subjectIds
          });
          console.log(`Updated subjects for teacher ${teacherId}:`, subjectIds);
        } catch (teacherError) {
          console.error(`Error updating teacher ${teacherId} subjects:`, teacherError);
          // Continue with other teachers even if one fails
        }
      }

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
                              onChange={(e) => handleTeacherChange(subjectId, e.target.value)}
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
