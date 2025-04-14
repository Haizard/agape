import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Container,
  Grid,
  Tabs,
  Tab,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

// Import reusable components
import { 
  ResultTable, 
  GradeChip, 
  DivisionChip, 
  ReportSummary, 
  StudentDetails 
} from '../common';

/**
 * Form 5 Class Report Demo Component
 * Displays a demo Form 5 class report with realistic data
 */
const Form5ClassReportDemo = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCombination, setSelectedCombination] = useState('All');
  const [filteredStudents, setFilteredStudents] = useState([]);

  // Fetch demo data
  useEffect(() => {
    const fetchDemoData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get('/api/demo/form5-class-report');
        setReport(response.data.data);

        // Initialize filtered students with all students
        setFilteredStudents(response.data.data.students);
      } catch (err) {
        console.error('Error fetching demo data:', err);
        setError(err.message || 'Failed to load demo data');
      } finally {
        setLoading(false);
      }
    };

    fetchDemoData();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle combination filter change
  useEffect(() => {
    if (!report) return;

    if (selectedCombination === 'All') {
      setFilteredStudents(report.students);
    } else {
      const filtered = report.students.filter(
        item => item.student.combination === selectedCombination
      );
      setFilteredStudents(filtered);
    }
  }, [selectedCombination, report]);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle download as PDF
  const handleDownload = () => {
    alert('PDF download functionality would be implemented here');
  };

  // Get unique combinations
  const getUniqueCombinations = () => {
    if (!report || !report.students) return ['All'];
    
    const combinations = report.students.map(item => item.student.combination);
    return ['All', ...new Set(combinations)];
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  // If no report data, show warning
  if (!report) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        No report data available
      </Alert>
    );
  }

  // Define columns for the student summary table
  const studentSummaryColumns = [
    { 
      id: 'rank', 
      label: 'Rank', 
      align: 'center',
      width: '50px'
    },
    { 
      id: 'name', 
      label: 'Student Name', 
      render: (row) => `${row.student.firstName} ${row.student.lastName}`
    },
    { 
      id: 'combination', 
      label: 'Combination', 
      render: (row) => (
        <Chip 
          label={row.student.combination} 
          size="small" 
          color="primary" 
          variant="outlined" 
        />
      )
    },
    { 
      id: 'average', 
      label: 'Average', 
      align: 'center',
      render: (row) => `${row.summary.averageMarks}%`
    },
    { 
      id: 'points', 
      label: 'Points', 
      align: 'center',
      render: (row) => row.summary.bestThreePoints
    },
    { 
      id: 'division', 
      label: 'Division', 
      align: 'center',
      render: (row) => (
        <DivisionChip 
          division={row.summary.division} 
          educationLevel="A_LEVEL" 
        />
      )
    }
  ];

  // Define columns for the detailed results table
  const detailedResultsColumns = [
    { 
      id: 'subject', 
      label: 'Subject', 
      render: (row) => row.subjectName
    },
    { 
      id: 'type', 
      label: 'Type', 
      render: (row) => row.isPrincipal ? 'Principal' : 'Subsidiary'
    },
    { 
      id: 'marks', 
      label: 'Marks', 
      align: 'center',
      render: (row) => row.marksObtained
    },
    { 
      id: 'grade', 
      label: 'Grade', 
      align: 'center',
      render: (row) => (
        <GradeChip 
          grade={row.grade} 
          educationLevel="A_LEVEL" 
        />
      )
    },
    { 
      id: 'points', 
      label: 'Points', 
      align: 'center',
      render: (row) => row.points
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }} className="print-container">
      {/* Report Header */}
      <Box sx={{ mb: 3 }} className="print-header">
        {/* Header with school name */}
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Typography variant="h6" gutterBottom>
            Evangelical Lutheran Church in Tanzania - Northern Diocese
          </Typography>
          <Typography variant="h4" gutterBottom>
            St. John Vianney School Management System
          </Typography>
        </Box>

        {/* Contact information */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Left side - P.O. Box */}
          <Grid item xs={4} sx={{ textAlign: 'left' }}>
            <Typography variant="body2">
              P.O.BOX 8882,<br />
              Moshi, Tanzania
            </Typography>
          </Grid>

          {/* Center - Logo */}
          <Grid item xs={4} sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src={`${process.env.PUBLIC_URL}/images/lutheran_logo.png`}
                alt="Lutheran Church Logo"
                style={{ width: '80px', height: '80px' }}
                onError={(e) => {
                  console.error('Error loading image:', e);
                  e.target.src = `${process.env.PUBLIC_URL}/favicon.ico`; // Fallback image
                }}
              />
            </Box>
          </Grid>

          {/* Right side - Contact details */}
          <Grid item xs={4} sx={{ textAlign: 'right' }}>
            <Typography variant="body2">
              Mobile phone: 0759767735<br />
              Email: infoagapeseminary@gmail.co
            </Typography>
          </Grid>
        </Grid>

        {/* Report title */}
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="h5" gutterBottom>
            FORM 5 CLASS RESULT REPORT
          </Typography>
          <Typography variant="subtitle1">
            {report.exam.name} - {report.exam.academicYear}
          </Typography>
        </Box>
      </Box>

      {/* Class Information */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Class Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Box>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body1">
                <strong>Class:</strong> {report.class.name}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body1">
                <strong>Academic Year:</strong> {report.exam.academicYear}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body1">
                <strong>Exam:</strong> {report.exam.name}
              </Typography>
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="body1">
                <strong>Total Students:</strong> {report.classStatistics.totalStudents}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body1">
                <strong>Class Average:</strong> {report.classStatistics.classAverage}%
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body1">
                <strong>Exam Date:</strong> {report.exam.startDate} to {report.exam.endDate}
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Division Distribution */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Division Distribution
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Box>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={4} sm={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h6" color="primary">
                    {report.classStatistics.divisionDistribution.I}
                  </Typography>
                  <Typography variant="body2">
                    Division I
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4} sm={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h6" color="primary">
                    {report.classStatistics.divisionDistribution.II}
                  </Typography>
                  <Typography variant="body2">
                    Division II
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4} sm={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h6" color="info.main">
                    {report.classStatistics.divisionDistribution.III}
                  </Typography>
                  <Typography variant="body2">
                    Division III
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4} sm={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h6" color="warning.main">
                    {report.classStatistics.divisionDistribution.IV}
                  </Typography>
                  <Typography variant="body2">
                    Division IV
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4} sm={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h6" color="warning.dark">
                    {report.classStatistics.divisionDistribution.V}
                  </Typography>
                  <Typography variant="body2">
                    Division V
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4} sm={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h6" color="error.main">
                    {report.classStatistics.divisionDistribution['0']}
                  </Typography>
                  <Typography variant="body2">
                    No Division
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Filter Controls */}
      <Box sx={{ mb: 3 }} className="no-print">
        <Paper>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterIcon sx={{ mr: 1 }} />
              <Typography variant="body1">
                Filter by Combination:
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {getUniqueCombinations().map((combination) => (
                <Chip
                  key={combination}
                  label={combination}
                  onClick={() => setSelectedCombination(combination)}
                  color={selectedCombination === combination ? 'primary' : 'default'}
                  variant={selectedCombination === combination ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Tabs for different views */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          className="no-print"
        >
          <Tab label="Student Summary" />
          <Tab label="Detailed Results" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mb: 3 }}>
        {/* Student Summary Tab */}
        {activeTab === 0 && (
          <Paper>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Student Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Box>
            <ResultTable
              data={filteredStudents}
              columns={studentSummaryColumns}
              getRowKey={(row) => row.student.id}
              emptyMessage="No students found with the selected filter"
            />
          </Paper>
        )}

        {/* Detailed Results Tab */}
        {activeTab === 1 && (
          <Box>
            {filteredStudents.map((studentData) => (
              <Paper key={studentData.student.id} sx={{ mb: 3 }}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {studentData.student.firstName} {studentData.student.lastName} ({studentData.student.combination})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Box>
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body1">
                        <strong>Roll Number:</strong> {studentData.student.rollNumber}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Gender:</strong> {studentData.student.gender}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body1">
                        <strong>Average:</strong> {studentData.summary.averageMarks}%
                      </Typography>
                      <Typography variant="body1">
                        <strong>Division:</strong> <DivisionChip division={studentData.summary.division} educationLevel="A_LEVEL" />
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                <ResultTable
                  data={studentData.results}
                  columns={detailedResultsColumns}
                  getRowKey={(row) => `${studentData.student.id}-${row.subjectId}`}
                  emptyMessage="No results found for this student"
                />
              </Paper>
            ))}
          </Box>
        )}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }} className="no-print">
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print Report
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
        >
          Download PDF
        </Button>
      </Box>
    </Container>
  );
};

export default Form5ClassReportDemo;
