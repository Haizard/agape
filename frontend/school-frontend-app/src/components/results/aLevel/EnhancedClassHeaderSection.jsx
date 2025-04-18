import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Divider,
  Paper
} from '@mui/material';
import './ALevelClassReportStyles.css';

/**
 * EnhancedClassHeaderSection Component
 * 
 * Displays an enhanced header section for the A-Level class report.
 */
const EnhancedClassHeaderSection = ({ 
  reportTitle, 
  academicYear, 
  className, 
  formLevel,
  examName,
  schoolName = "AGAPE LUTHERAN JUNIOR SEMINARY",
  schoolAddress = "P.O. Box 1, Morogoro, Tanzania"
}) => {
  return (
    <Box className="report-section" sx={{ mb: 3 }}>
      {/* School Header */}
      <Box className="school-header" sx={{ p: 2, textAlign: 'center' }}>
        <Box className="school-info">
          <Typography variant="h4" className="school-name" gutterBottom>
            {schoolName}
          </Typography>
          <Typography variant="body1" className="school-address" gutterBottom>
            {schoolAddress}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="h5" className="report-title" sx={{ mt: 2, fontWeight: 'bold', color: '#1a237e' }}>
            {reportTitle || "A-LEVEL CLASS RESULT REPORT"}
          </Typography>
          <Typography variant="h6" className="report-subtitle" sx={{ mt: 1, color: '#424242' }}>
            {examName || "FINAL EXAMINATION"}
          </Typography>
        </Box>
      </Box>
      
      {/* Class Information */}
      <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 0 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minWidth: 200, p: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Class:
            </Typography>
            <Typography variant="body1">
              {className || "Form 5 Science"}
            </Typography>
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 200, p: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Form Level:
            </Typography>
            <Typography variant="body1">
              {formLevel || "5"}
            </Typography>
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 200, p: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Academic Year:
            </Typography>
            <Typography variant="body1">
              {academicYear || "2023-2024"}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

EnhancedClassHeaderSection.propTypes = {
  reportTitle: PropTypes.string,
  academicYear: PropTypes.string,
  className: PropTypes.string,
  formLevel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  examName: PropTypes.string,
  schoolName: PropTypes.string,
  schoolAddress: PropTypes.string
};

export default EnhancedClassHeaderSection;
