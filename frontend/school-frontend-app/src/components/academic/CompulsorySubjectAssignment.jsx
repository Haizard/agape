import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import api from '../../services/api';

const CompulsorySubjectAssignment = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [compulsorySubjects, setCompulsorySubjects] = useState([]);
  const [subjectTeachers, setSubjectTeachers] = useState({});
  const [classData, setClassData] = useState(null);

  // Fetch classes and teachers on component mount
  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  // Fetch classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/classes');
      setClasses(response.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to fetch classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/teachers');
      setTeachers(response.data);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Failed to fetch teachers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch compulsory subjects for a class
  const fetchCompulsorySubjects = async (classId) => {
    try {
      setLoading(true);
      setCompulsorySubjects([]);
      setSubjectTeachers({});

      // Get class details to check education level
      const classResponse = await api.get(`/api/classes/${classId}`);
      const classData = classResponse.data;
      setClassData(classData);

      // Get all subjects
      const subjectsResponse = await api.get('/api/subjects');
      const allSubjects = subjectsResponse.data;

      // Filter for compulsory subjects matching the class education level
      const compulsory = allSubjects.filter(subject =>
        subject.isCompulsory &&
        (subject.educationLevel === classData.educationLevel || subject.educationLevel === 'BOTH')
      );

      // If class has a subject combination, get its compulsory subjects too
      if (classData.subjectCombination) {
        const combinationId = typeof classData.subjectCombination === 'object'
          ? classData.subjectCombination._id
          : classData.subjectCombination;

        const combinationResponse = await api.get(`/api/subject-combinations/${combinationId}`);
        const combination = combinationResponse.data;

        if (combination.compulsorySubjects && combination.compulsorySubjects.length > 0) {
          // Add any compulsory subjects from the combination that aren't already in the list
          for (const subject of combination.compulsorySubjects) {
            const subjectId = typeof subject === 'object' ? subject._id : subject;
            if (!compulsory.some(s => s._id === subjectId)) {
              // Get full subject details if needed
              if (typeof subject !== 'object') {
                const subjectResponse = await api.get(`/api/subjects/${subjectId}`);
                compulsory.push(subjectResponse.data);
              } else {
                compulsory.push(subject);
              }
            }
          }
        }
      }

      // Initialize the subject teachers map
      const initialSubjectTeachers = {};

      // Check if any of these subjects are already assigned to teachers in this class
      if (classData.subjects && classData.subjects.length > 0) {
        for (const subject of compulsory) {
          const assignment = classData.subjects.find(s => {
            const subjectId = s.subject._id || s.subject;
            return subjectId.toString() === subject._id.toString();
          });

          if (assignment && assignment.teacher) {
            initialSubjectTeachers[subject._id] = assignment.teacher._id || assignment.teacher;
          } else {
            initialSubjectTeachers[subject._id] = '';
          }
        }
      } else {
        // If no assignments yet, initialize all to empty
        for (const subject of compulsory) {
          initialSubjectTeachers[subject._id] = '';
        }
      }

      setSubjectTeachers(initialSubjectTeachers);
      setCompulsorySubjects(compulsory);
    } catch (err) {
      console.error('Error fetching compulsory subjects:', err);
      setError('Failed to fetch compulsory subjects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle class selection
  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    if (classId) {
      fetchCompulsorySubjects(classId);
    } else {
      setCompulsorySubjects([]);
      setSubjectTeachers({});
      setClassData(null);
    }
  };

  // Handle teacher selection for a subject
  const handleTeacherChange = (subjectId, teacherId) => {
    setSubjectTeachers(prev => ({
      ...prev,
      [subjectId]: teacherId
    }));
  };

  // Handle assignment submission
  const handleSaveAssignments = async () => {
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }

    // Check if any subjects don't have teachers assigned
    const unassignedSubjects = compulsorySubjects.filter(subject => !subjectTeachers[subject._id]);
    if (unassignedSubjects.length > 0) {
      setError(`Please assign teachers to all subjects: ${unassignedSubjects.map(s => s.name).join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Get current class subjects
      const currentSubjects = classData.subjects || [];
      let updated = false;

      // For each compulsory subject
      for (const subject of compulsorySubjects) {
        const teacherId = subjectTeachers[subject._id];
        if (!teacherId) continue;

        // Check if this subject is already assigned in this class
        const existingAssignment = currentSubjects.find(s => {
          const subjectId = s.subject._id || s.subject;
          return subjectId.toString() === subject._id.toString();
        });

        if (existingAssignment) {
          // Update the existing assignment
          const currentTeacherId = existingAssignment.teacher?._id || existingAssignment.teacher;
          if (currentTeacherId?.toString() !== teacherId) {
            existingAssignment.teacher = teacherId;
            updated = true;
          }
        } else {
          // Create a new assignment
          currentSubjects.push({
            subject: subject._id,
            teacher: teacherId
          });
          updated = true;
        }

        // Also ensure the subject is in the teacher's subjects array
        try {
          const teacherResponse = await api.get(`/api/teachers/${teacherId}`);
          const teacher = teacherResponse.data;

          const hasSubject = teacher.subjects?.some(s =>
            (typeof s === 'object' ? s._id.toString() : s.toString()) === subject._id.toString()
          );

          if (!hasSubject) {
            // Add the subject to the teacher's subjects
            await api.put(`/api/teachers/${teacherId}`, {
              ...teacher,
              subjects: [...(teacher.subjects || []), subject._id]
            });
          }
        } catch (teacherErr) {
          console.error(`Error updating teacher ${teacherId}:`, teacherErr);
        }
      }

      // Save changes if any were made
      if (updated) {
        await api.put(`/api/classes/${selectedClass}/subjects`, {
          subjects: currentSubjects
        });
        setSuccess('Compulsory subject assignments saved successfully');

        // Refresh the class data
        fetchCompulsorySubjects(selectedClass);
      } else {
        setSuccess('No changes were needed');
      }
    } catch (err) {
      console.error('Error saving subject assignments:', err);
      setError(err.response?.data?.message || 'Failed to save subject assignments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Assign Compulsory Subjects to Teachers
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Use this form to assign each compulsory subject to its appropriate teacher.
        This includes both general compulsory subjects and those from subject combinations.
      </Typography>

      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
            {classes.map((cls) => (
              <MenuItem key={cls._id} value={cls._id}>
                {cls.name} {cls.stream} ({cls.educationLevel})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {compulsorySubjects.length > 0 ? (
          <>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Assign Teachers to Compulsory Subjects:
            </Typography>

            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Subject</strong></TableCell>
                    <TableCell><strong>Code</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Assigned Teacher</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compulsorySubjects.map((subject) => (
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
                            disabled={loading}
                          >
                            <MenuItem value="">
                              <em>Select a teacher</em>
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

            {error && (
              <Alert severity="error" onClose={() => setError('')} sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" onClose={() => setSuccess('')} sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveAssignments}
              disabled={loading}
              sx={{ mt: 2, alignSelf: 'flex-end' }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Assignments'}
            </Button>
          </>
        ) : selectedClass ? (
          loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              No compulsory subjects found for this class.
            </Alert>
          )
        ) : null}
      </Box>
    </Paper>
  );
};

export default CompulsorySubjectAssignment;
