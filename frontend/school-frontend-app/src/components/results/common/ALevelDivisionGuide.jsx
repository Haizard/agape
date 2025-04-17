import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Card,
  CardContent
} from '@mui/material';

/**
 * A-Level Division Guide Component
 * 
 * A reusable component for displaying the A-Level division guide in a consistent format
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Display variant ('table' or 'cards')
 * @param {boolean} props.showGradePoints - Whether to show grade points
 */
const ALevelDivisionGuide = ({
  variant = 'table',
  showGradePoints = true
}) => {
  // Division data
  const divisions = [
    { name: 'Division I', points: '3-9 points' },
    { name: 'Division II', points: '10-12 points' },
    { name: 'Division III', points: '13-17 points' },
    { name: 'Division IV', points: '18-19 points' },
    { name: 'Division 0', points: '20+ points' }
  ];

  // Grade points data
  const gradePoints = `
    A (80-100%) = 1 point
    B (70-79%) = 2 points
    C (60-69%) = 3 points
    D (50-59%) = 4 points
    E (40-49%) = 5 points
    S (35-39%) = 6 points
    F (0-34%) = 7 points
  `;

  // Table variant
  if (variant === 'table') {
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            A-Level Division Guide
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>Division</strong></TableCell>
                <TableCell><strong>Points Range</strong></TableCell>
                {showGradePoints && <TableCell><strong>Grade Points</strong></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {divisions.map((division, index) => (
                <TableRow key={index}>
                  <TableCell>{division.name}</TableCell>
                  <TableCell>{division.points}</TableCell>
                  {showGradePoints && index === 0 && (
                    <TableCell rowSpan={divisions.length}>
                      {gradePoints.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line.trim()}
                          <br />
                        </React.Fragment>
                      ))}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  }

  // Cards variant
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          A-Level Division Guide
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" paragraph>
          A-LEVEL Division is calculated based on best 3 principal subjects:
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ px: 2, pb: 2 }}>
        {divisions.map((division, index) => (
          <Grid item xs={6} md={2.4} key={index}>
            <Card>
              <CardContent>
                <Typography variant="h6" align="center">{division.name}</Typography>
                <Typography variant="body2" align="center">{division.points}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {showGradePoints && (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Grade Points
          </Typography>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-line' }}>
            {gradePoints}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

ALevelDivisionGuide.propTypes = {
  variant: PropTypes.oneOf(['table', 'cards']),
  showGradePoints: PropTypes.bool
};

export default ALevelDivisionGuide;
