import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Container,
  Grid
} from '@mui/material';

// Import reusable components
import { 
  ResultTable, 
  GradeChip, 
  DivisionChip, 
  ReportSummary, 
  StudentDetails 
} from '../common';

/**
 * Result Component Demo
 * Demonstrates how to use the reusable components
 */
const ResultComponentDemo = () => {
  // Sample data
  const studentDetails = {
    name: 'John Doe',
    rollNumber: 'A12345',
    class: 'Form 5 Science',
    form: 5,
    gender: 'Male'
  };

  const examDetails = {
    name: 'Mid-Term Examination',
    academicYear: '2023-2024',
    examDate: '2023-10-15 - 2023-10-25'
  };

  const summary = {
    averageMarks: 75.5,
    bestThreePoints: 6,
    division: 'II',
    rank: 3,
    totalStudents: 45,
    remarks: 'Good performance'
  };

  const subjectResults = [
    { subject: 'Physics', code: 'PHY', marks: 85, grade: 'A', points: 1, isPrincipal: true, remarks: 'Excellent' },
    { subject: 'Chemistry', code: 'CHE', marks: 78, grade: 'B', points: 2, isPrincipal: true, remarks: 'Very Good' },
    { subject: 'Mathematics', code: 'MAT', marks: 72, grade: 'B', points: 2, isPrincipal: true, remarks: 'Very Good' },
    { subject: 'Biology', code: 'BIO', marks: 68, grade: 'C', points: 3, isPrincipal: false, remarks: 'Good' },
    { subject: 'General Studies', code: 'GS', marks: 65, grade: 'C', points: 3, isPrincipal: false, remarks: 'Good' }
  ];

  // Define columns for the result table
  const columns = [
    { 
      id: 'subject', 
      label: 'Subject', 
      render: (row) => `${row.subject} (${row.code})`
    },
    { 
      id: 'marks', 
      label: 'Marks', 
      align: 'center' 
    },
    { 
      id: 'grade', 
      label: 'Grade', 
      align: 'center',
      render: (row) => <GradeChip grade={row.grade} educationLevel="A_LEVEL" />
    },
    { 
      id: 'points', 
      label: 'Points', 
      align: 'center' 
    },
    { 
      id: 'isPrincipal', 
      label: 'Type', 
      render: (row) => row.isPrincipal ? 'Principal' : 'Subsidiary'
    },
    { 
      id: 'remarks', 
      label: 'Remarks' 
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Reusable Components Demo
      </Typography>
      <Divider sx={{ mb: 4 }} />

      <Grid container spacing={3}>
        {/* StudentDetails Component */}
        <Grid item xs={12} md={6}>
          <StudentDetails 
            studentDetails={studentDetails}
            examDetails={examDetails}
            title="Student Information"
          />
        </Grid>

        {/* ReportSummary Component */}
        <Grid item xs={12} md={6}>
          <ReportSummary 
            summary={summary}
            educationLevel="A_LEVEL"
            title="Result Summary"
          />
        </Grid>

        {/* ResultTable Component */}
        <Grid item xs={12}>
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Subject Results
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Box>
            <ResultTable 
              data={subjectResults}
              columns={columns}
              getRowKey={(row) => row.subject}
              title="A-Level Results"
              emptyMessage="No results found"
              tableProps={{ size: "small" }}
            />
          </Paper>
        </Grid>

        {/* GradeChip and DivisionChip Components */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Grade and Division Chips
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                A-Level Grades:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <GradeChip grade="A" educationLevel="A_LEVEL" />
                <GradeChip grade="B" educationLevel="A_LEVEL" />
                <GradeChip grade="C" educationLevel="A_LEVEL" />
                <GradeChip grade="D" educationLevel="A_LEVEL" />
                <GradeChip grade="E" educationLevel="A_LEVEL" />
                <GradeChip grade="S" educationLevel="A_LEVEL" />
                <GradeChip grade="F" educationLevel="A_LEVEL" />
              </Box>
            </Box>
            
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Divisions:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <DivisionChip division="I" educationLevel="A_LEVEL" />
                <DivisionChip division="II" educationLevel="A_LEVEL" />
                <DivisionChip division="III" educationLevel="A_LEVEL" />
                <DivisionChip division="IV" educationLevel="A_LEVEL" />
                <DivisionChip division="V" educationLevel="A_LEVEL" />
                <DivisionChip division="0" educationLevel="A_LEVEL" />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ResultComponentDemo;
