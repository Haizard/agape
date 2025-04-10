import React from 'react';
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
  Divider
} from '@mui/material';

/**
 * Division Guide Section Component
 * Displays the A-Level division guide with points ranges and grade points
 */
const DivisionGuideSection = () => {
  return (
    <Paper sx={{ mb: 3 }}>
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
              <TableCell><strong>Grade Points</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Division I</TableCell>
              <TableCell>3-9 points</TableCell>
              <TableCell rowSpan={5}>
                A (80-100%) = 1 point<br />
                B (70-79%) = 2 points<br />
                C (60-69%) = 3 points<br />
                D (50-59%) = 4 points<br />
                E (40-49%) = 5 points<br />
                S (35-39%) = 6 points<br />
                F (0-34%) = 7 points
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Division II</TableCell>
              <TableCell>10-12 points</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Division III</TableCell>
              <TableCell>13-17 points</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Division IV</TableCell>
              <TableCell>18-19 points</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Division V</TableCell>
              <TableCell>20-21 points</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DivisionGuideSection;
