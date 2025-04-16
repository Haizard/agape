import React, { useState, useEffect } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TeacherSubjectAssignment = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch teachers
        const teachersResponse = await api.get('/api/teachers');
        setTeachers(teachersResponse.data);
        
        // Fetch classes
        const classesResponse = await api.get('/api/classes');
        setClasses(classesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load teachers and classes. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (selectedClass) {
        setLoading(true);
        try {
          const response = await api.get(`/api/classes/${selectedClass}/subjects`);
          setSubjects(response.data);
        } catch (error) {
          console.error('Error fetching subjects:', error);
          setError('Failed to load subjects for this class. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        setSubjects([]);
      }
    };
    
    fetchSubjects();
  }, [selectedClass]);

  const handleTeacherChange = (event) => {
    setSelectedTeacher(event.target.value);
  };

  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
    setSelectedSubjects([]);
  };

  const handleSubjectsChange = (event) => {
    setSelectedSubjects(event.target.value);
  };

  const handleSubmit = async () => {
    if (!selectedTeacher || !selectedClass || selectedSubjects.length === 0) {
      setError('Please select a teacher, class, and at least one subject.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await api.post('/api/teacher-subject-assignment', {
        teacherId: selectedTeacher,
        subjectIds: selectedSubjects,
        classId: selectedClass
      });

      console.log('Assignment successful:', response.data);
      setSuccess(true);
      
      // Reset form
      setSelectedSubjects([]);
    } catch (error) {
      console.error('Error assigning subjects:', error);
      setError('Failed to assign subjects to teacher. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Assign Subjects to Teacher
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Subjects assigned successfully!</Alert>}
      
      <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel>Teacher</InputLabel>
          <Select
            value={selectedTeacher}
            onChange={handleTeacherChange}
            label="Teacher"
            disabled={loading}
          >
            {teachers.map((teacher) => (
              <MenuItem key={teacher._id} value={teacher._id}>
                {teacher.firstName} {teacher.lastName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth>
          <InputLabel>Class</InputLabel>
          <Select
            value={selectedClass}
            onChange={handleClassChange}
            label="Class"
            disabled={loading}
          >
            {classes.map((classItem) => (
              <MenuItem key={classItem._id} value={classItem._id}>
                {classItem.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl fullWidth>
          <InputLabel>Subjects</InputLabel>
          <Select
            multiple
            value={selectedSubjects}
            onChange={handleSubjectsChange}
            label="Subjects"
            disabled={loading || !selectedClass}
          >
            {subjects.map((subject) => (
              <MenuItem key={subject._id} value={subject._id}>
                {subject.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={loading || !selectedTeacher || !selectedClass || selectedSubjects.length === 0}
          >
            {loading ? <CircularProgress size={24} /> : 'Assign Subjects'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default TeacherSubjectAssignment;
