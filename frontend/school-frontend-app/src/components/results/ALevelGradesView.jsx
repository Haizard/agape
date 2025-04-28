import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Paper,
  Grid
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { calculateGradeDistribution } from '../../utils/aLevelMarksUtils';

/**
 * A-Level Grades View Component
 *
 * This component displays the grades view for A-Level students.
 */
const ALevelGradesView = ({
  marks,
  onRefresh,
  loading = false
}) => {
  // Calculate grade distribution
  const gradeDistribution = calculateGradeDistribution(marks);

  return (
    <Paper sx={{ mb: 3 }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6">
              Grades Summary
            </Typography>
            <Tooltip title="Students with green background have this subject in their combination">
              <IconButton color="info" size="small" sx={{ ml: 1 }}>
                <InfoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Warning icon indicates student may not be eligible for this subject">
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                <WarningIcon color="warning" fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  = Eligibility Warning
                </Typography>
              </Box>
            </Tooltip>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="5%">#</TableCell>
                <TableCell width="25%">Student Name</TableCell>
                <TableCell width="10%">Marks</TableCell>
                <TableCell width="10%">Grade</TableCell>
                <TableCell width="10%">Points</TableCell>
                <TableCell width="10%">Principal</TableCell>
                <TableCell width="10%">In Combination</TableCell>
                <TableCell width="10%">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {marks.map((mark, index) => (
                <TableRow
                  key={mark.studentId}
                  sx={{
                    backgroundColor: mark.isInCombination ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                  }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {mark.studentName}
                      {mark.eligibilityWarning && (
                        <Tooltip title={mark.eligibilityWarning}>
                          <WarningIcon color="warning" fontSize="small" sx={{ ml: 1 }} />
                        </Tooltip>
                      )}
                    </Box>
                    {/* Debug: Show subjectId info */}
                    <Box sx={{ fontSize: '0.7em', color: '#888', mt: 0.5 }}>
                      <div>selectedSubjectId: {mark.subjectId?.toString?.() || mark.subjectId}</div>
                      <div>backendSubjectId: {mark._backendSubjectId || '-'}</div>
                    </Box>
                  </TableCell>
                  <TableCell>{mark.marksObtained !== '' ? mark.marksObtained : '-'}</TableCell>
                  <TableCell>{mark.grade || '-'}</TableCell>
                  <TableCell>{mark.points || '-'}</TableCell>
                  <TableCell>
                    {mark.isPrincipal ? (
                      <Chip
                        label="Principal"
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label="Subsidiary"
                        color="default"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {mark.isInCombination ? (
                      <Chip
                        label="Yes"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label="No"
                        color="error"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {mark._id ? (
                      <Chip
                        label="Saved"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label="Not Saved"
                        color="warning"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Grade distribution */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Grade Distribution
          </Typography>
          <Grid container spacing={2}>
            {['A', 'B', 'C', 'D', 'E', 'S', 'F'].map(grade => {
              const { count, percentage } = gradeDistribution[grade] || { count: 0, percentage: 0 };

              return (
                <Grid item xs={6} sm={3} md={1.7} key={grade}>
                  <Paper
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      bgcolor: grade === 'A' ? '#4caf50' :
                              grade === 'B' ? '#8bc34a' :
                              grade === 'C' ? '#cddc39' :
                              grade === 'D' ? '#ffeb3b' :
                              grade === 'E' ? '#ffc107' :
                              grade === 'S' ? '#ff9800' :
                              '#f44336',
                      color: ['A', 'B', 'C'].includes(grade) ? 'white' : 'black'
                    }}
                  >
                    <Typography variant="h6">{grade}</Typography>
                    <Typography variant="body2">{count} ({percentage.toFixed(1)}%)</Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Summary statistics */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Summary Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1">Total Students</Typography>
                <Typography variant="h4">{marks.length}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1">Marks Entered</Typography>
                <Typography variant="h4">
                  {marks.filter(m => m.marksObtained !== '').length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1">Saved Results</Typography>
                <Typography variant="h4">
                  {marks.filter(m => m._id).length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1">Average Marks</Typography>
                <Typography variant="h4">
                  {marks.length > 0 && marks.some(m => m.marksObtained !== '') ?
                    (marks.reduce((sum, m) => sum + (m.marksObtained !== '' ? Number(m.marksObtained) : 0), 0) /
                    marks.filter(m => m.marksObtained !== '').length).toFixed(1) :
                    '-'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Paper>
  );
};

ALevelGradesView.propTypes = {
  marks: PropTypes.array.isRequired,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool
};



export default ALevelGradesView;
