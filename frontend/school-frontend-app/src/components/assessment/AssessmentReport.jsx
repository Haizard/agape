import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAssessment } from '../../contexts/AssessmentContext';
import { PictureAsPdf as PdfIcon, Print as PrintIcon } from '@mui/icons-material';

const AssessmentReport = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [classes, setClasses] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { assessments } = useAssessment();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      setError('Failed to fetch classes');
    }
  };

  const generateReport = async () => {
    if (!selectedClass || !selectedAssessment) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/assessments/report/${selectedClass}/${selectedAssessment}`);
      const data = await response.json();
      
      if (data.success) {
        setReportData(data.report);
        setError('');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setError(error.message || 'Failed to generate report');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await fetch(
        `/api/assessments/report/${selectedClass}/${selectedAssessment}/pdf`,
        { method: 'POST' }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assessment-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to export PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getGradeDistribution = () => {
    if (!reportData?.results) return [];

    const distribution = {
      A: 0, B: 0, C: 0, D: 0, F: 0
    };

    reportData.results.forEach(result => {
      const score = (result.marksObtained / result.maxMarks) * 100;
      if (score >= 75) distribution.A++;
      else if (score >= 65) distribution.B++;
      else if (score >= 45) distribution.C++;
      else if (score >= 30) distribution.D++;
      else distribution.F++;
    });

    return Object.entries(distribution).map(([grade, count]) => ({
      grade,
      students: count
    }));
  };

  return (
    <Box sx={{ p: 3 }} className="assessment-report">
      <Typography variant="h4" gutterBottom>
        Assessment Report
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <FormControl fullWidth>
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              label="Class"
            >
              {classes.map(cls => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={5}>
          <FormControl fullWidth>
            <InputLabel>Assessment</InputLabel>
            <Select
              value={selectedAssessment}
              onChange={(e) => setSelectedAssessment(e.target.value)}
              label="Assessment"
              disabled={!selectedClass}
            >
              {assessments.map(assessment => (
                <MenuItem key={assessment._id} value={assessment._id}>
                  {assessment.name} ({assessment.weightage}%)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            variant="contained"
            fullWidth
            onClick={generateReport}
            disabled={!selectedClass || !selectedAssessment || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate'}
          </Button>
        </Grid>
      </Grid>

      {reportData && (
        <Box sx={{ mt: 3 }} className="report-content">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2">Total Students</Typography>
                      <Typography variant="h4">{reportData.totalStudents}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2">Average Score</Typography>
                      <Typography variant="h4">
                        {reportData.averageScore.toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2">Pass Rate</Typography>
                      <Typography variant="h4">
                        {reportData.passRate.toFixed(2)}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Grade Distribution
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getGradeDistribution()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grade" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="students" fill="#1976d2" name="Students" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Statistics
                </Typography>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Highest Score</TableCell>
                      <TableCell align="right">
                        {reportData.highestScore.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Lowest Score</TableCell>
                      <TableCell align="right">
                        {reportData.lowestScore.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Standard Deviation</TableCell>
                      <TableCell align="right">
                        {reportData.standardDeviation.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">
                    Detailed Results
                  </Typography>
                  <Box>
                    <Button
                      startIcon={<PdfIcon />}
                      onClick={handleExportPDF}
                      sx={{ mr: 1 }}
                    >
                      Export PDF
                    </Button>
                    <Button
                      startIcon={<PrintIcon />}
                      onClick={handlePrint}
                    >
                      Print
                    </Button>
                  </Box>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student Name</TableCell>
                        <TableCell>Registration Number</TableCell>
                        <TableCell align="right">Marks</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                        <TableCell align="right">Grade</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.results.map((result) => (
                        <TableRow key={result.studentId}>
                          <TableCell>{result.studentName}</TableCell>
                          <TableCell>{result.registrationNumber}</TableCell>
                          <TableCell align="right">
                            {result.marksObtained} / {result.maxMarks}
                          </TableCell>
                          <TableCell align="right">
                            {((result.marksObtained / result.maxMarks) * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell align="right">{result.grade}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      <style jsx global>{`
        @media print {
          .assessment-report {
            padding: 0 !important;
          }
          .report-content {
            break-inside: avoid;
          }
        }
      `}</style>
    </Box>
  );
};

export default AssessmentReport;