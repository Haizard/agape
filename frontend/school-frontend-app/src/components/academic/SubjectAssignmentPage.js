import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import api from '../../services/api';
import unifiedTeacherAssignmentService from '../../services/unifiedTeacherAssignmentService';
import { getUserRole } from '../../utils/authUtils';
import FixAssignmentsButton from '../admin/FixAssignmentsButton';

const SubjectAssignmentPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classSubjects, setClassSubjects] = useState([]);
  const [subjectTeachers, setSubjectTeachers] = useState({});
  const [classData, setClassData] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassDetails();
    } else {
      setClassSubjects([]);
      setSubjectTeachers({});
      setClassData(null);
    }
  }, [selectedClass]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [classesResponse, teachersResponse] = await Promise.all([
        api.get('/api/classes'),
        api.get('/api/teachers')
      ]);

      setClasses(classesResponse.data);
      setTeachers(teachersResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load initial data');
      setLoading(false);
    }
  };

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching details for class:', selectedClass);

      // Get class details
      const classResponse = await api.get(`/api/classes/${selectedClass}`);
      const classData = classResponse.data;
      console.log('Class data:', classData);
      setClassData(classData);

      // Get subjects for this class
      let subjects = [];

      // If class has subjects directly assigned
      if (classData.subjects && classData.subjects.length > 0) {
        console.log('Class has directly assigned subjects:', classData.subjects);
        subjects = classData.subjects.map(s => {
          const subject = s.subject;
          if (!subject) {
            console.error('Missing subject data in assignment:', s);
            return null;
          }
          return {
            _id: subject._id || subject,
            name: subject.name || 'Unknown Subject',
            code: subject.code || 'N/A',
            type: subject.type || 'CORE',
            teacherId: s.teacher?._id || s.teacher || null
          };
        }).filter(Boolean); // Remove any null entries
      }

      // If class is A_LEVEL and has a subject combination, get those subjects too
      if (classData.educationLevel === 'A_LEVEL' && classData.subjectCombination) {
        console.log('Class is A_LEVEL with subject combination:', classData.subjectCombination);
        try {
          const combinationId = classData.subjectCombination._id || classData.subjectCombination;
          console.log('Fetching subject combination with ID:', combinationId);

          const combinationResponse = await api.get(`/api/subject-combinations/${combinationId}`);
          const combination = combinationResponse.data;
          console.log('Subject combination data:', combination);

          if (!combination) {
            console.error('Subject combination not found or invalid response');
            setError('Error loading subject combination. Please try again.');
            return;
          }

          if (combination.subjects && Array.isArray(combination.subjects) && combination.subjects.length > 0) {
            // Get full subject details
            const subjectPromises = combination.subjects.map(subjectId => {
              if (!subjectId) {
                console.error('Invalid subject ID in combination:', subjectId);
                return Promise.resolve({ data: null });
              }

              const id = typeof subjectId === 'object' ? subjectId._id : subjectId;
              console.log(`Fetching subject details for ID: ${id}`);

              return api.get(`/api/subjects/${id}`).catch(err => {
                console.error(`Error fetching subject ${id}:`, err);
                return { data: null }; // Return null data on error
              });
            });

            const subjectResponses = await Promise.all(subjectPromises);
            const subjectsFromCombination = subjectResponses
              .map(response => response.data)
              .filter(Boolean); // Remove any null responses

            console.log('Subjects from combination:', subjectsFromCombination);

            // Add subjects from combination that aren't already in the list
            for (const subject of subjectsFromCombination) {
              if (!subject) continue; // Skip null subjects

              if (!subjects.some(s => s._id === subject._id)) {
                // Find if this subject has a teacher assigned in the class
                const existingAssignment = classData.subjects?.find(
                  s => {
                    const subjectId = s.subject?._id || s.subject;
                    return subjectId === subject._id;
                  }
                );

                subjects.push({
                  _id: subject._id,
                  name: subject.name || 'Unknown Subject',
                  code: subject.code || 'N/A',
                  type: subject.type || 'CORE',
                  teacherId: existingAssignment?.teacher?._id || existingAssignment?.teacher || null
                });
              }
            }
          }
        } catch (combinationError) {
          console.error('Error fetching subject combination:', combinationError);
          if (combinationError.response) {
            console.error('Response status:', combinationError.response.status);
            console.error('Response data:', combinationError.response.data);
          }
          setError('Error loading subject combination. Please try again.');
        }
      }

      // If no subjects found yet, try the fixed subjects endpoint
      if (subjects.length === 0) {
        console.log('No subjects found from class or combination, trying fixed subjects endpoint');
        try {
          const fixedResponse = await api.get(`/api/fixed-subjects/class/${selectedClass}`);
          const fixedSubjects = fixedResponse.data;
          console.log('Subjects from fixed endpoint:', fixedSubjects);

          if (fixedSubjects.length > 0) {
            subjects = fixedSubjects.map(subject => ({
              _id: subject._id,
              name: subject.name || 'Unknown Subject',
              code: subject.code || 'N/A',
              type: subject.type || 'CORE',
              teacherId: null // No teacher assigned by default
            }));
          }
        } catch (fixedError) {
          console.error('Error fetching from fixed subjects endpoint:', fixedError);
        }
      }

      console.log('Final subjects list:', subjects);

      // Initialize subject teachers map
      const teachersMap = {};
      for (const subject of subjects) {
        if (subject.teacherId) {
          teachersMap[subject._id] = subject.teacherId;
        }
      }

      setClassSubjects(subjects);
      setSubjectTeachers(teachersMap);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching class details:', error);
      setError('Failed to load class details');
      setLoading(false);
    }
  };

  const handleTeacherChange = (subjectId, teacherId) => {
    setSubjectTeachers(prev => ({
      ...prev,
      [subjectId]: teacherId
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Check if we have a selected class
      if (!selectedClass) {
        setError('Please select a class first');
        setLoading(false);
        return;
      }

      // Check for any admin assignments
      const adminTeachers = teachers.filter(t => t.isAdmin || (t.user && t.user.role === 'admin'));
      const adminTeacherIds = adminTeachers.map(t => t._id);
      console.log('Admin teacher IDs:', adminTeacherIds);

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

      try {
        // Use the unified teacher assignment service
        const result = await unifiedTeacherAssignmentService.assignTeachersToSubjects(
          selectedClass,
          subjectTeachers,
          userRole === 'admin' // Force admin endpoint if user is admin
        );

        console.log('Assignment result:', result);
        setSuccess('Subject-teacher assignments saved successfully');

        // Refresh the data to show updated assignments
        await fetchClassDetails();
      } catch (serviceError) {
        console.error('Error in teacher assignment service:', serviceError);
        setError(`Failed to save assignments: ${serviceError.message}`);
        setLoading(false);
        return;
      }

      setLoading(false);

      // NOTE: We no longer need to update the teacher's subjects array
      // This was causing confusion because the teacher.subjects array should represent
      // the subjects a teacher is qualified to teach, not the subjects they're currently
      // assigned to teach in specific classes
      // The assignments are already recorded in the Class.subjects array and TeacherSubject model

      // If you want to update the teacher's qualifications, use the teacher profile page instead

      setSuccess('Subject-teacher assignments saved successfully');
      fetchClassDetails(); // Refresh the data
      setLoading(false);
    } catch (error) {
      console.error('Error saving subject-teacher assignments:', error);
      setError('Failed to save assignments');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Subject-Teacher Assignment</Typography>

      {/* Admin tools - always show for now */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" paragraph>
          Having issues with teacher-subject assignments? Visit the <a href="/admin/fix-assignments" style={{ textDecoration: 'underline' }}>Fix Assignments Page</a> to fix all assignments at once.
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Select Class</InputLabel>
              <Select
                value={selectedClass}
                label="Select Class"
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={loading}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.name} {cls.section} - {cls.educationLevel === 'A_LEVEL' ? 'A Level' : 'O Level'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            {classData && (
              <Typography variant="body1">
                <strong>Education Level:</strong> {classData.educationLevel === 'A_LEVEL' ? 'A Level' : 'O Level'}
                {classData.subjectCombination && (
                  <span>
                    {' | '}
                    <strong>Subject Combination:</strong> {
                      typeof classData.subjectCombination === 'object'
                        ? classData.subjectCombination.name
                        : 'Assigned'
                    }
                  </span>
                )}
              </Typography>
            )}
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {selectedClass ? (
              <>
                {classSubjects.length > 0 ? (
                  <>
                    <Divider sx={{ my: 2 }} />

                    <Typography variant="h6" gutterBottom>
                      Assign Teachers to Subjects
                    </Typography>

                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Subject</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Assigned Teacher</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {classSubjects.map((subject) => (
                            <TableRow key={subject._id}>
                              <TableCell>{subject.name}</TableCell>
                              <TableCell>{subject.code}</TableCell>
                              <TableCell>{subject.type}</TableCell>
                              <TableCell>
                                <FormControl fullWidth size="small">
                                  <Select
                                    value={subjectTeachers[subject._id] || ''}
                                    onChange={(e) => handleTeacherChange(subject._id, e.target.value)}
                                    displayEmpty
                                  >
                                    <MenuItem value="">
                                      <em>None</em>
                                    </MenuItem>
                                    {teachers.map((teacher) => (
                                      <MenuItem key={teacher._id} value={teacher._id}>
                                        {teacher.firstName} {teacher.lastName}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        Save Assignments
                      </Button>
                    </Box>
                  </>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No subjects found for this class. Please add subjects to the class or select a subject combination.
                  </Alert>
                )}
              </>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Please select a class to assign teachers to subjects.
              </Alert>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default SubjectAssignmentPage;
