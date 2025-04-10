import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
  Paper,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

/**
 * Component for selecting which calculation method to use for results
 * @param {Object} props
 * @param {string} props.defaultType - Default calculation type ('O_LEVEL' or 'A_LEVEL')
 * @param {Function} props.onChange - Function to call when calculation type changes
 * @param {boolean} props.disabled - Whether the selector is disabled
 */
const ResultCalculationTypeSelector = ({ defaultType = 'O_LEVEL', onChange, disabled = false }) => {
  const [calculationType, setCalculationType] = useState(defaultType);

  // Update the calculation type when the default changes
  useEffect(() => {
    setCalculationType(defaultType);
  }, [defaultType]);

  // Handle calculation type change
  const handleCalculationTypeChange = (event) => {
    const newType = event.target.value;
    setCalculationType(newType);
    // Only call onChange if it's provided and is a function
    if (onChange && typeof onChange === 'function') {
      onChange(newType);
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6" component="h2" sx={{ mr: 1 }}>
          Result Calculation Method
        </Typography>
        <Tooltip title="Select which grading system to use for calculating results. This affects how grades and points are calculated.">
          <IconButton size="small">
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InfoIcon sx={{ mr: 1 }} />
          <Typography variant="body2">
            This setting determines which grading system will be used to calculate grades and points.
          </Typography>
        </Box>
      </Alert>

      <FormControl component="fieldset" disabled={disabled}>
        <FormLabel component="legend">Select Calculation Type:</FormLabel>
        <RadioGroup
          row
          name="calculationType"
          value={calculationType}
          onChange={handleCalculationTypeChange}
        >
          <FormControlLabel
            value="O_LEVEL"
            control={<Radio />}
            label={
              <Tooltip title="A: 75-100 (1pt), B: 65-74 (2pt), C: 50-64 (3pt), D: 30-49 (4pt), F: 0-29 (5pt)">
                <Typography>O-Level Calculation</Typography>
              </Tooltip>
            }
          />
          <FormControlLabel
            value="A_LEVEL"
            control={<Radio />}
            label={
              <Tooltip title="A: 80-100 (1pt), B: 70-79 (2pt), C: 60-69 (3pt), D: 50-59 (4pt), E: 40-49 (5pt), S: 35-39 (6pt), F: 0-34 (7pt)">
                <Typography>A-Level Calculation</Typography>
              </Tooltip>
            }
          />
        </RadioGroup>
      </FormControl>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Current Selection:</strong> {calculationType === 'O_LEVEL' ? 'O-Level' : 'A-Level'} Calculation
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {calculationType === 'O_LEVEL' ? (
            <>
              <strong>O-Level Grading:</strong> A: 75-100 (1pt), B: 65-74 (2pt), C: 50-64 (3pt), D: 30-49 (4pt), F: 0-29 (5pt)
            </>
          ) : (
            <>
              <strong>A-Level Grading:</strong> A: 80-100 (1pt), B: 70-79 (2pt), C: 60-69 (3pt), D: 50-59 (4pt), E: 40-49 (5pt), S: 35-39 (6pt), F: 0-34 (7pt)
            </>
          )}
        </Typography>
      </Box>
    </Paper>
  );
};

// PropTypes validation
ResultCalculationTypeSelector.propTypes = {
  defaultType: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool
};

// Default props
ResultCalculationTypeSelector.defaultProps = {
  defaultType: 'O_LEVEL',
  onChange: null,
  disabled: false
};

export default ResultCalculationTypeSelector;
