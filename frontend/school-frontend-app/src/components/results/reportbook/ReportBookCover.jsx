import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import ReportPropTypes from './ReportPropTypes';

/**
 * ReportBookCover Component
 * Displays the cover page of the report book
 *
 * @param {Object} props
 * @param {Object} props.report - The report data
 */
const ReportBookCover = ({ report }) => {
  return (
    <Box className="report-cover">
      {/* School Logo */}
      {report.schoolLogo ? (
        <img
          src={report.schoolLogo}
          alt="School Logo"
          className="school-logo"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/150?text=School+Logo';
          }}
        />
      ) : (
        <Avatar
          sx={{
            width: 150,
            height: 150,
            bgcolor: 'primary.light',
            fontSize: '3rem',
            mb: 3
          }}
        >
          {report.schoolName?.charAt(0) || 'A'}
        </Avatar>
      )}

      {/* School Name */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
        {report.schoolName || 'School Name'}
      </Typography>

      {/* Report Title */}
      <Typography variant="h3" gutterBottom sx={{ mt: 4, fontWeight: 'bold' }}>
        ACADEMIC REPORT BOOK
      </Typography>

      {/* Academic Year and Term */}
      <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
        {report.academicYear || 'Academic Year'} - {report.term || 'Term'}
      </Typography>

      {/* Student Information */}
      <Box className="student-info" sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom>
          {report.studentDetails?.name || 'Student Name'}
        </Typography>
        <Typography variant="h6" gutterBottom>
          {report.studentDetails?.class || 'Class'}
        </Typography>
        <Typography variant="body1">
          Admission No: {report.studentDetails?.admissionNumber || 'N/A'}
        </Typography>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 'auto', pt: 4 }}>
        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
          "Education is the passport to the future, for tomorrow belongs to those who prepare for it today."
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          - Malcolm X
        </Typography>
      </Box>
    </Box>
  );
};

ReportBookCover.propTypes = ReportPropTypes;

export default ReportBookCover;
