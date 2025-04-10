import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import axios from 'axios';

const ResultManagement = () => {
  const [value, setValue] = useState(0);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    subjectId: '',
    examType: '',
    marks: '',
    term: '1',
    academicYear: new Date().getFullYear().toString()
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [
        studentsRes,
        subjectsRes,
        classesRes,
        examTypesRes
      ] = await Promise.all([
        axios.get('/api/students'),
        axios.get('/api/subjects'),
        axios.get('/api/classes'),
        axios.get('/api/exam-types')
      ]);

      setStudents(studentsRes.data);
      setSubjects(subjectsRes.data);
      setClasses(classesRes.data);
      setExamTypes(examTypesRes.data);
    } catch (error) {
      setError('Failed to fetch initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = useCallback(async () => {
    if (!selectedClass || !selectedExamType) return;

    setLoading(true);
    try {
      const response = await axios.get('/api/results', {
        params: {
          classId: selectedClass,
          examType: selectedExamType
        }
      });
      setResults(response.data);
    } catch (error) {
      setError(typeof error === 'object' ? (error.message || 'Failed to fetch results') : String(error));
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedExamType]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/results', formData);
      setOpenDialog(false);
      fetchResults();
      setFormData({
        studentId: '',
        subjectId: '',
        examType: '',
        marks: '',
        term: '1',
        academicYear: new Date().getFullYear().toString()
      });
    } catch (error) {
      setError(typeof error === 'object' ? (error.message || 'Failed to save result') : String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  const calculateGrade = (marks) => {
    if (marks >= 75) return 'A';
    if (marks >= 65) return 'B';
    if (marks >= 45) return 'C';
    if (marks >= 30) return 'D';
    return 'F';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Result Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {typeof error === 'object' ? JSON.stringify(error) : error}
        </Alert>
      )}

      <Tabs value={value} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Enter Results" />
        <Tab label="View Results" />
        <Tab label="Analysis" />
      </Tabs>

      {value === 0 && (
        <>
          <Button
            variant="contained"
            onClick={() => setOpenDialog(true)}
            sx={{ mb: 3 }}
          >
            Add New Result
          </Button>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Exam Type</InputLabel>
                <Select
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                >
                  {examTypes.map((type) => (
                    <MenuItem key={type._id} value={type._id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Marks</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result._id}>
                    <TableCell>
                      {students.find(s => s._id === result.studentId)?.name ||
                       (students.find(s => s._id === result.studentId) ?
                         `${students.find(s => s._id === result.studentId).firstName || ''} ${students.find(s => s._id === result.studentId).lastName || ''}`.trim() :
                         result.studentId)}
                    </TableCell>
                    <TableCell>
                      {subjects.find(s => s._id === result.subjectId)?.name || result.subjectId}
                    </TableCell>
                    <TableCell>{result.marks}</TableCell>
                    <TableCell>{calculateGrade(result.marks)}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleEdit(result)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {value === 1 && (
        <Typography>Result View Component</Typography>
        // Implement detailed result view here
      )}

      {value === 2 && (
        <Typography>Result Analysis Component</Typography>
        // Implement result analysis here
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Result</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Student</InputLabel>
              <Select
                value={formData.studentId}
                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
              >
                {students.map((student) => (
                  <MenuItem key={student._id} value={student._id}>
                    {student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student._id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Subject</InputLabel>
              <Select
                value={formData.subjectId}
                onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject._id} value={subject._id}>
                    {subject.name || subject._id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Marks"
              type="number"
              value={formData.marks}
              onChange={(e) => setFormData({...formData, marks: e.target.value})}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Term</InputLabel>
              <Select
                value={formData.term}
                onChange={(e) => setFormData({...formData, term: e.target.value})}
              >
                <MenuItem value="1">First Term</MenuItem>
                <MenuItem value="2">Second Term</MenuItem>
                <MenuItem value="3">Third Term</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
          >
            Save Result
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResultManagement;