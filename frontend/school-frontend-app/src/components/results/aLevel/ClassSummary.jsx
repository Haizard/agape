import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Paper,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip
} from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

/**
 * ClassSummary Component
 * 
 * Displays the performance summary and statistics in the A-Level class result report.
 */
const ClassSummary = ({ classReport }) => {
  // Format division distribution data for charts
  const divisionData = useMemo(() => {
    if (!classReport?.divisionDistribution) return [];
    
    const colors = {
      'I': '#4caf50',
      'II': '#2196f3',
      'III': '#03a9f4',
      'IV': '#ff9800',
      '0': '#f44336'
    };
    
    return Object.entries(classReport.divisionDistribution).map(([division, count]) => ({
      name: `Division ${division}`,
      value: count,
      color: colors[division] || '#9e9e9e'
    })).filter(item => item.value > 0);
  }, [classReport?.divisionDistribution]);
  
  // Calculate subject performance data
  const subjectPerformanceData = useMemo(() => {
    if (!classReport?.students || classReport.students.length === 0) return [];
    
    // Get all unique subjects
    const subjects = new Set();
    classReport.students.forEach(student => {
      (student.results || []).forEach(result => {
        if (result.subject) {
          subjects.add(result.subject);
        }
      });
    });
    
    // Calculate average marks for each subject
    const subjectData = Array.from(subjects).map(subject => {
      let totalMarks = 0;
      let count = 0;
      
      classReport.students.forEach(student => {
        const result = (student.results || []).find(r => r.subject === subject);
        if (result && typeof result.marks === 'number') {
          totalMarks += result.marks;
          count++;
        }
      });
      
      const average = count > 0 ? totalMarks / count : 0;
      
      return {
        subject,
        average: parseFloat(average.toFixed(2))
      };
    });
    
    // Sort by subject name
    return subjectData.sort((a, b) => a.subject.localeCompare(b.subject));
  }, [classReport?.students]);
  
  // Calculate gender distribution
  const genderDistribution = useMemo(() => {
    if (!classReport?.students || classReport.students.length === 0) return { male: 0, female: 0 };
    
    let male = 0;
    let female = 0;
    
    classReport.students.forEach(student => {
      if (student.sex === 'M') {
        male++;
      } else if (student.sex === 'F') {
        female++;
      }
    });
    
    return [
      { name: 'Male', value: male, color: '#2196f3' },
      { name: 'Female', value: female, color: '#e91e63' }
    ];
  }, [classReport?.students]);

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Class Statistics
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Total Students:</strong> {classReport?.totalStudents || 0}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                <strong>Class Average:</strong> {classReport?.classAverage?.toFixed(2) || '0.00'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                <strong>Division Distribution</strong>
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Division</strong></TableCell>
                      <TableCell align="center"><strong>Count</strong></TableCell>
                      <TableCell align="center"><strong>Percentage</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(classReport?.divisionDistribution || {}).map(([division, count]) => (
                      <TableRow key={division}>
                        <TableCell>
                          <Chip 
                            label={`Division ${division}`} 
                            size="small"
                            color={
                              division === 'I' ? 'success' :
                              division === 'II' ? 'primary' :
                              division === 'III' ? 'info' :
                              division === 'IV' ? 'warning' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell align="center">{count}</TableCell>
                        <TableCell align="center">
                          {classReport?.totalStudents ? 
                            `${((count / classReport.totalStudents) * 100).toFixed(1)}%` : 
                            '0%'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Division Distribution Chart
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={divisionData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {divisionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Subject Performance
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subjectPerformanceData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 70
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="subject" 
                  angle={-45} 
                  textAnchor="end"
                  height={70}
                  interval={0}
                />
                <YAxis 
                  label={{ value: 'Average Marks', angle: -90, position: 'insideLeft' }}
                  domain={[0, 100]}
                />
                <Tooltip formatter={(value) => [`${value}`, 'Average Marks']} />
                <Legend />
                <Bar dataKey="average" name="Average Marks" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Gender Distribution
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} students`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

ClassSummary.propTypes = {
  classReport: PropTypes.shape({
    totalStudents: PropTypes.number,
    classAverage: PropTypes.number,
    divisionDistribution: PropTypes.object,
    students: PropTypes.array
  })
};

export default ClassSummary;
