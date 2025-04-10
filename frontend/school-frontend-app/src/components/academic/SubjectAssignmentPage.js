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
          const combinationResponse = await api.get(`/api/subject-combinations/${combinationId}`);
          const combination = combinationResponse.data;
          console.log('Subject combination data:', combination);

          if (combination.subjects && combination.subjects.length > 0) {
            // Get full subject details
            const subjectPromises = combination.subjects.map(subjectId => {
              const id = typeof subjectId === 'object' ? subjectId._id : subjectId;
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

      // Format the subjects array with subject and teacher IDs
      const subjectsArray = classSubjects.map(subject => ({
        subject: subject._id,
        teacher: subjectTeachers[subject._id] || null
      }));

      // Update the class with the new subjects array
      await api.put(`/api/classes/${selectedClass}/subjects`, {
        subjects: subjectsArray
      });

      // Group subjects by teacher
      const teacherSubjectsMap = {};

      // Collect all subjects for each teacher
      for (const subject of classSubjects) {
        const teacherId = subjectTeachers[subject._id];

        if (teacherId) {
          if (!teacherSubjectsMap[teacherId]) {
            teacherSubjectsMap[teacherId] = [];
          }
          teacherSubjectsMap[teacherId].push(subject._id);
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
