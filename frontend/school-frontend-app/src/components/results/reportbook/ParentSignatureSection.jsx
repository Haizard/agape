import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid
} from '@mui/material';
import ReportPropTypes from './ReportPropTypes';

/**
 * ParentSignatureSection Component
 * Displays parent signature section in the report book
 *
 * @param {Object} props
 * @param {Object} props.report - The report data
 */
const ParentSignatureSection = ({ report }) => {
  return (
    <Box>
      {/* Section Header */}
      <Box sx={{ mb: 3, textAlign: 'center', border: '2px solid #000', p: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
          PARENT/GUARDIAN ACKNOWLEDGMENT
        </Typography>
        <Divider sx={{ mb: 2, borderColor: '#000' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
          {report.academicYear || 'Academic Year 2023-2024'} - {report.term || 'Term II'}
        </Typography>
      </Box>

      {/* Parent Information */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 0, border: '1px solid #000' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #000', pb: 1 }}>
          PARENT/GUARDIAN INFORMATION
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>Student Name:</strong> {report.studentDetails?.name || 'Student Name'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>Class:</strong> {report.studentDetails?.class || 'Class'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>Parent/Guardian Name:</strong> {report.studentDetails?.parentName || 'Parent/Guardian Name'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">
              <strong>Contact Number:</strong> {report.studentDetails?.parentContact || 'Contact Number'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Parent Comments */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 0, border: '1px solid #000' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #000', pb: 1 }}>
          PARENT/GUARDIAN COMMENTS
        </Typography>

        <Box sx={{
          p: 3,
          backgroundColor: '#f5f5f5',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          minHeight: '150px'
        }}>
          <Typography variant="body2" sx={{ color: '#9e9e9e', fontStyle: 'italic' }}>
            Please write your comments about your child's academic performance and character development here...
          </Typography>
        </Box>
      </Paper>

      {/* Signature Section */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 0, border: '1px solid #000' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase', borderBottom: '2px solid #000', pb: 1 }}>
          SIGNATURES
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" gutterBottom>
                Parent/Guardian Signature
              </Typography>
              <Box sx={{
                width: '100%',
                borderBottom: '1px solid #000',
                mb: 2,
                height: 50
              }} />
              <Typography variant="body2" gutterBottom>
                Name: _______________________________
              </Typography>
              <Typography variant="body2">
                Date: _______________________________
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" gutterBottom>
                Class Teacher Signature
              </Typography>
              <Box sx={{
                width: '100%',
                borderBottom: '1px solid #000',
                mb: 2,
                height: 50
              }} />
              <Typography variant="body2" gutterBottom>
                Name: _______________________________
              </Typography>
              <Typography variant="body2">
                Date: _______________________________
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="subtitle1" gutterBottom>
            Principal's Signature & School Stamp
          </Typography>
          <Box sx={{
            width: '50%',
            margin: '0 auto',
            borderBottom: '1px solid #000',
            mb: 2,
            height: 80
          }} />
          <Typography variant="body2">
            Date: _______________________________
          </Typography>
        </Box>
      </Paper>

      {/* Important Note */}
      <Box sx={{ mt: 4, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Important Note:
        </Typography>
        <Typography variant="body2">
          Please sign this report and return it to the class teacher within one week of receipt.
          If you have any concerns about your child's academic performance or behavior,
          please schedule an appointment with the class teacher or principal.
        </Typography>
      </Box>

      {/* School Contact */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {report.schoolName || 'School Name'}
        </Typography>
        <Typography variant="body2">
          P.O.BOX 8882, Moshi, Tanzania | Tel: +255 27 2755088 | Email: agapelutheran@elct.org
        </Typography>
      </Box>
    </Box>
  );
};

ParentSignatureSection.propTypes = ReportPropTypes;

export default ParentSignatureSection;
