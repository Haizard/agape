import React from 'react';
import { Box, Typography, Grid, Paper, Divider, Avatar } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import ReportPropTypes from './ReportPropTypes';

/**
 * StudentInfoSection Component
 * Displays detailed student information in the report book
 *
 * @param {Object} props
 * @param {Object} props.report - The report data
 */
const StudentInfoSection = ({ report }) => {
  const { studentDetails } = report;

  return (
    <Box>
      {/* Section Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          STUDENT INFORMATION
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle1">
          {report.academicYear || 'Academic Year'} - {report.term || 'Term'}
        </Typography>
      </Box>

      {/* Student Profile */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={3}>
          {/* Student Photo/Avatar */}
          <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Avatar
              sx={{
                width: 150,
                height: 150,
                bgcolor: 'primary.light',
                fontSize: '4rem'
              }}
            >
              <PersonIcon sx={{ fontSize: '5rem' }} />
            </Avatar>
          </Grid>

          {/* Student Details */}
          <Grid item xs={12} md={9}>
            <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              {studentDetails?.name || 'Student Name'}
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Admission No:</strong> {studentDetails?.admissionNumber || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Roll Number:</strong> {studentDetails?.rollNumber || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Class:</strong> {studentDetails?.class || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Gender:</strong> {studentDetails?.gender || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Date of Birth:</strong> {studentDetails?.dateOfBirth || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Form:</strong> {studentDetails?.form || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Academic Information */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          ACADEMIC INFORMATION
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>Subject Combination:</strong> {studentDetails?.subjectCombination || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>Education Level:</strong> {report.educationLevel === 'A_LEVEL' ? 'Advanced Level' : 'Ordinary Level'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>Academic Year:</strong> {report.academicYear || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>Term:</strong> {report.term || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>Exam:</strong> {report.examName || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>Exam Date:</strong> {report.examDate || 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Parent/Guardian Information */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          PARENT/GUARDIAN INFORMATION
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>Parent/Guardian Name:</strong> {studentDetails?.parentName || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>Contact Number:</strong> {studentDetails?.parentContact || 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
          This information is confidential and is intended for academic purposes only.
        </Typography>
      </Box>
    </Box>
  );
};

StudentInfoSection.propTypes = ReportPropTypes;

export default StudentInfoSection;
