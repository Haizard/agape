import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Grid,
} from '@mui/material';

/**
 * A-Level Report Header Component
 * Displays the header section of an A-Level report with school logo and information
 */
const ALevelReportHeader = ({ formLevel, academicYear }) => {
  return (
    <Box sx={{ mb: 3, textAlign: 'center' }} className="print-header">
      <Grid container spacing={2} alignItems="center">
        {/* Left side - Logo */}
        <Grid item xs={4} sx={{ textAlign: 'left' }}>
          <Box
            component="img"
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="School Logo"
            sx={{ height: 80, width: 'auto' }}
            onError={(e) => {
              console.error('Error loading image:', e);
              e.target.src = `${process.env.PUBLIC_URL}/favicon.ico`; // Fallback image
            }}
          />
        </Grid>

        {/* Center - School name */}
        <Grid item xs={4} sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            AGAPE LUTHERAN JUNIOR SEMINARY
          </Typography>
          <Typography variant="subtitle2">
            P.O. BOX 8882, MOSHI
          </Typography>
        </Grid>

        {/* Right side - Contact details */}
        <Grid item xs={4} sx={{ textAlign: 'right' }}>
          <Typography variant="body2">
            Mobile phone: 0759767735<br />
            Email: infoagapeseminary@gmail.co
          </Typography>
        </Grid>
      </Grid>

      {/* Report title */}
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="h5" gutterBottom>
          FORM {formLevel} A-LEVEL STUDENT RESULT REPORT
        </Typography>
        <Typography variant="subtitle1">
          Academic Year: {academicYear || 'Unknown'}
        </Typography>
      </Box>
    </Box>
  );
};

ALevelReportHeader.propTypes = {
  formLevel: PropTypes.oneOf(['5', '6', 5, 6]).isRequired,
  academicYear: PropTypes.string
};

export default ALevelReportHeader;
