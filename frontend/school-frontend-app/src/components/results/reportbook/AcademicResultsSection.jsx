import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Chip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  School as SchoolIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import ReportPropTypes from './ReportPropTypes';

/**
 * AcademicResultsSection Component
 * Displays academic results in the report book
 *
 * @param {Object} props
 * @param {Object} props.report - The report data
 */
const AcademicResultsSection = ({ report }) => {
  const [tabValue, setTabValue] = useState(0);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Get grade color
  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'success';
      case 'B': return 'primary';
      case 'C': return 'info';
      case 'D': return 'warning';
      case 'E': return 'secondary';
      case 'S': return 'default';
      case 'F': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Section Header */}
      <Box sx={{ mb: 3, textAlign: 'center', border: '2px solid #000', p: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
          ACADEMIC RESULTS
        </Typography>
        <Divider sx={{ mb: 2, borderColor: '#000' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
          {report.examName || 'Mid-Term Examination'} - {report.academicYear || 'Academic Year 2023-2024'}
        </Typography>
      </Box>

      {/* Subject Results Tabs */}
      <Paper elevation={1} sx={{ mb: 3, borderRadius: 0, border: '1px solid #000' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          sx={{ borderBottom: 2, borderColor: '#000' }}
          TabIndicatorProps={{ style: { backgroundColor: '#000' } }}
        >
          <Tab
            icon={<SchoolIcon />}
            label="Principal Subjects"
            sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
          />
          <Tab
            icon={<MenuBookIcon />}
            label="Subsidiary Subjects"
            sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
          />
        </Tabs>

        {/* Principal Subjects Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #000', pb: 1 }}>
              Principal Subjects
            </Typography>

            {report.principalSubjects && report.principalSubjects.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell align="center">Marks</TableCell>
                      <TableCell align="center">Grade</TableCell>
                      <TableCell align="center">Points</TableCell>
                      <TableCell>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.principalSubjects.map((subject, index) => (
                      <TableRow key={`principal-${subject.code}-${index}`}>
                        <TableCell>{subject.code}</TableCell>
                        <TableCell>{subject.subject}</TableCell>
                        <TableCell align="center">
                          {subject.marks !== null ? subject.marks : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={subject.grade}
                            color={getGradeColor(subject.grade)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {subject.points !== null ? subject.points : '-'}
                        </TableCell>
                        <TableCell>{subject.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                No principal subjects found or no results available.
              </Typography>
            )}
          </Box>
        )}

        {/* Subsidiary Subjects Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '1px solid #000', pb: 1 }}>
              Subsidiary Subjects
            </Typography>

            {report.subsidiarySubjects && report.subsidiarySubjects.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell align="center">Marks</TableCell>
                      <TableCell align="center">Grade</TableCell>
                      <TableCell align="center">Points</TableCell>
                      <TableCell>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.subsidiarySubjects.map((subject, index) => (
                      <TableRow key={`subsidiary-${subject.code}-${index}`}>
                        <TableCell>{subject.code}</TableCell>
                        <TableCell>{subject.subject}</TableCell>
                        <TableCell align="center">
                          {subject.marks !== null ? subject.marks : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={subject.grade}
                            color={getGradeColor(subject.grade)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {subject.points !== null ? subject.points : '-'}
                        </TableCell>
                        <TableCell>{subject.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                No subsidiary subjects found or no results available.
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      {/* Performance Summary */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 0, border: '1px solid #000' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #000', pb: 1 }}>
          PERFORMANCE SUMMARY
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Total Marks:</strong> {report.summary?.totalMarks || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Average Marks:</strong> {report.summary?.averageMarks || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Total Points:</strong> {report.summary?.totalPoints !== null ? report.summary.totalPoints : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Best 3 Principal Points:</strong> {report.summary?.bestThreePoints !== null ? report.summary.bestThreePoints : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Division:</strong> {report.summary?.division || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Rank:</strong> {report.summary?.rank} of {report.summary?.totalStudents || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Grade Distribution
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {report.summary?.gradeDistribution && Object.entries(report.summary.gradeDistribution).map(([grade, count]) => (
                <Chip
                  key={grade}
                  label={`${grade}: ${count}`}
                  color={getGradeColor(grade)}
                  sx={{ minWidth: 60 }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* A-Level Division Guide */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 0, border: '1px solid #000' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #000', pb: 1 }}>
          A-LEVEL DIVISION GUIDE
        </Typography>
        <Typography variant="body2" paragraph>
          A-LEVEL Division is calculated based on best 3 principal subjects:
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h6" align="center">Division I</Typography>
                <Typography variant="body2" align="center">3-9 points</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h6" align="center">Division II</Typography>
                <Typography variant="body2" align="center">10-12 points</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h6" align="center">Division III</Typography>
                <Typography variant="body2" align="center">13-17 points</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h6" align="center">Division IV</Typography>
                <Typography variant="body2" align="center">18-19 points</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h6" align="center">Division V</Typography>
                <Typography variant="body2" align="center">20-21 points</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

AcademicResultsSection.propTypes = ReportPropTypes;

export default AcademicResultsSection;
