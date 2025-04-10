import React, { useState, useEffect, useCallback } from 'react';
import { useAcademic } from '../contexts/AcademicContext';
import api from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import { generateResultSummary } from '../utils/gradingSystem';
import SafeDisplay from './common/SafeDisplay';
import {
  Box,
  Button,
  ButtonGroup,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { generateExcelReport } from '../utils/gradingSystem';

const ResultManagement = () => {
  const { currentYear } = useAcademic();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchResults = useCallback(async () => {
    if (!selectedClass || !selectedExam) return;

    setLoading(true);
    try {
      const response = await api.results.getByExam(selectedExam);
      const summary = generateResultSummary(response.data);
      setResultData(summary);
    } catch (error) {
      setError(typeof error === 'object' ? handleApiError(error) : String(error));
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedExam]);

  useEffect(() => {
    if (selectedExam) {
      fetchResults();
    }
  }, [selectedExam, fetchResults]);

  const handleExport = async (format) => {
    if (!resultData) return;

    try {
      if (format === 'excel') {
        const buffer = await generateExcelReport(resultData, selectedClass);
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedClass}_results.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        const doc = generatePDFReport(resultData, selectedClass);
        doc.save(`${selectedClass}_results.pdf`);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const calculateResults = () => {
    try {
      // Check if studentSubjects is defined
      if (typeof studentSubjects === 'undefined') {
        setError('No student subjects data available');
        return;
      }

      const summary = generateResultSummary(studentSubjects);
      setResultData(summary);
      setError(null);
    } catch (err) {
      setError(typeof err === 'object' ? (err.message || 'An error occurred') : String(err));
    }
  };

  const ResultSummary = ({ data }) => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Result Summary
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">
            Division: <SafeDisplay value={data.division} />
          </Typography>
          <Typography variant="subtitle1">
            Average Score: <SafeDisplay value={data.averageScore} />%
          </Typography>
          <Typography variant="subtitle1">
            Total Subjects: <SafeDisplay value={data.totalSubjects} />
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell align="right">Score</TableCell>
                <TableCell align="right">Grade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.subjects.map((subject) => (
                <TableRow key={subject.name}>
                  <TableCell><SafeDisplay value={subject.name} /></TableCell>
                  <TableCell align="right"><SafeDisplay value={subject.score} /></TableCell>
                  <TableCell align="right"><SafeDisplay value={subject.grade} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Result Management
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl sx={{ mr: 2, minWidth: 200 }}>
          <InputLabel>Class</InputLabel>
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <MenuItem value="Form One">Form One</MenuItem>
            <MenuItem value="Form Two">Form Two</MenuItem>
            <MenuItem value="Form Three">Form Three</MenuItem>
            <MenuItem value="Form Four">Form Four</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Exam</InputLabel>
          <Select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
          >
            <MenuItem value="midterm">Midterm Exam</MenuItem>
            <MenuItem value="final">Final Exam</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {resultData && (
        <Box sx={{ mb: 3 }}>
          <ButtonGroup>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('excel')}
            >
              Export to Excel
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('pdf')}
            >
              Export to PDF
            </Button>
          </ButtonGroup>
        </Box>
      )}

      <Button
        variant="contained"
        onClick={calculateResults}
        sx={{ mb: 3 }}
      >
        Calculate Results
      </Button>

      {loading && <CircularProgress />}
      {error && <Alert severity="error">{typeof error === 'object' ? JSON.stringify(error) : error}</Alert>}
      {resultData && <ResultSummary data={resultData} />}
    </Box>
  );
};

export default ResultManagement;

