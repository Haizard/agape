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
            e.target.src = 'https://via.placeholder.com/120?text=School+Logo';
          }}
        />
      ) : (
        <Avatar
          sx={{
            width: 120,
            height: 120,
            bgcolor: '#f5f5f5',
            fontSize: '2.5rem',
            mb: 2,
            border: '1px solid #000'
          }}
        >
          {report.schoolName?.charAt(0) || 'A'}
        </Avatar>
      )}

      {/* School Name */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
        {report.schoolName || 'AGAPE LUTHERAN JUNIOR SEMINARY'}
      </Typography>

      {/* School Address */}
      <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>
        P.O. BOX 8882, MOSHI, KILIMANJARO
      </Typography>

      {/* Report Title */}
      <Typography variant="h4" gutterBottom sx={{ mt: 4, fontWeight: 'bold', textTransform: 'uppercase' }}>
        STUDENT PROGRESS REPORT
      </Typography>

      {/* Academic Year and Term */}
      <Typography variant="h5" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
        {report.academicYear || 'Academic Year 2023-2024'} - {report.term || 'Term II'}
      </Typography>

      {/* Student Information */}
      <Box className="student-info" sx={{ mt: 5 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
          {report.studentDetails?.name || 'Student Name'}
        </Typography>
        <Typography variant="h6" gutterBottom>
          {report.studentDetails?.class || 'Form 5 Science'}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
          Admission No: {report.studentDetails?.admissionNumber || 'ADM-2022-001'}
        </Typography>
      </Box>

      {/* School Stamp Placeholder */}
      <Box
        sx={{
          mt: 4,
          border: '1px dashed #000',
          borderRadius: '50%',
          width: 100,
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7
        }}
      >
        <Typography variant="body2" sx={{ textAlign: 'center' }}>
          School Stamp
        </Typography>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 'auto', pt: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          "Excellence Through Discipline and Hard Work"
        </Typography>
      </Box>
    </Box>
  );
};

ReportBookCover.propTypes = ReportPropTypes;

export default ReportBookCover;
