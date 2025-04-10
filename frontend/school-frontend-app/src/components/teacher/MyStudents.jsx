import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  CircularProgress,
  Button,
  TextField,
  InputAdornment
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import api from '../../services/api';
import SafeDisplay from '../common/SafeDisplay';

const MyStudents = () => {
  const [studentsByClass, setStudentsByClass] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClass, setExpandedClass] = useState(null);

  useEffect(() => {
    fetchMyStudents();
  }, []);

  const fetchMyStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/students/my-students');
      console.log('My students data:', response.data);
      setStudentsByClass(response.data);
    } catch (err) {
      console.error('Error fetching my students:', err);
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleAccordionChange = (classId) => (event, isExpanded) => {
    setExpandedClass(isExpanded ? classId : null);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filterStudents = (students) => {
    if (!searchTerm) return students;
    
    return students.filter(student => 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (studentsByClass.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        You don't have any students assigned to your classes yet.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <PeopleIcon sx={{ mr: 1 }} />
        My Students
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search students by name or roll number"
        value={searchTerm}
        onChange={handleSearchChange}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Total Classes: {studentsByClass.length}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Students: {studentsByClass.reduce((total, cls) => total + cls.students.length, 0)}
        </Typography>
      </Box>

      {studentsByClass.map((classGroup) => {
        const filteredStudents = filterStudents(classGroup.students);
        
        if (filteredStudents.length === 0 && searchTerm) {
          return null; // Don't show classes with no matching students
        }
        
        return (
          <Accordion 
            key={classGroup.classInfo._id}
            expanded={expandedClass === classGroup.classInfo._id}
            onChange={handleAccordionChange(classGroup.classInfo._id)}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <ClassIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  <SafeDisplay value={classGroup.classInfo.name} /> 
                  {classGroup.classInfo.stream && (
                    <Chip 
                      label={<SafeDisplay value={classGroup.classInfo.stream} />} 
                      size="small" 
                      sx={{ ml: 1 }} 
                    />
                  )}
                  {classGroup.classInfo.section && (
                    <Chip 
                      label={<SafeDisplay value={classGroup.classInfo.section} />} 
                      size="small" 
                      color="secondary"
                      sx={{ ml: 1 }} 
                    />
                  )}
                </Typography>
                <Chip 
                  label={`${filteredStudents.length} students`} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Roll Number</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>
                          <SafeDisplay value={student.rollNumber} />
                        </TableCell>
                        <TableCell>
                          <SafeDisplay value={`${student.firstName} ${student.lastName}`} />
                        </TableCell>
                        <TableCell>
                          <SafeDisplay value={student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : student.gender} />
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => window.location.href = `/teacher/marks-entry?classId=${classGroup.classInfo._id}&studentId=${student._id}`}
                          >
                            Enter Marks
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default MyStudents;
