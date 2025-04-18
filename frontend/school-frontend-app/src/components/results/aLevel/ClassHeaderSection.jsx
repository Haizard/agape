import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Grid
} from '@mui/material';

/**
 * ClassHeaderSection Component
 * 
 * Displays the header section of the A-Level class result report
 * including school name, logo, and report title.
 */
const ClassHeaderSection = ({ 
  reportTitle, 
  academicYear, 
  className,
  formLevel,
  logoSrc = `${process.env.PUBLIC_URL}/images/lutheran_logo.png`,
  onLogoError
}) => {
  return (
    <Box sx={{ mb: 3 }} className="print-header">
      {/* Header with church name */}
      <Box sx={{ textAlign: 'center', mb: 1 }}>
        <Typography variant="h6" gutterBottom>
          Evangelical Lutheran Church in Tanzania - Northern Diocese
        </Typography>
        <Typography variant="h4" gutterBottom>
          Agape Lutheran Junior Seminary
        </Typography>
      </Box>

      {/* Contact information */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Left side - P.O. Box */}
        <Grid item xs={4} sx={{ textAlign: 'left' }}>
          <Typography variant="body2">
            P.O.BOX 8882,<br />
            Moshi, Tanzania
          </Typography>
        </Grid>

        {/* Center - Logo */}
        <Grid item xs={4} sx={{ textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <img
              src={logoSrc}
              alt="Lutheran Church Logo"
              style={{ width: '80px', height: '80px' }}
              onError={(e) => {
                console.error('Error loading image:', e);
                if (onLogoError) onLogoError(e);
                // Fallback to favicon if logo fails to load
                e.target.src = `${process.env.PUBLIC_URL}/favicon.ico`;
              }}
            />
          </Box>
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
          {reportTitle || 'A-LEVEL CLASS RESULT REPORT'}
        </Typography>
        <Typography variant="subtitle1">
          Class: {className || 'Unknown'} {formLevel ? `(Form ${formLevel})` : ''}
        </Typography>
        <Typography variant="subtitle1">
          Academic Year: {academicYear || 'Unknown'}
        </Typography>
      </Box>
    </Box>
  );
};

ClassHeaderSection.propTypes = {
  reportTitle: PropTypes.string,
  academicYear: PropTypes.string,
  className: PropTypes.string,
  formLevel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  logoSrc: PropTypes.string,
  onLogoError: PropTypes.func
};

export default ClassHeaderSection;
