import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

/**
 * ClassSelector Component
 * 
 * Allows selecting a class
 */
const ClassSelector = ({
  classes,
  selectedClass,
  handleClassChange
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Class</InputLabel>
          <Select
            value={selectedClass}
            onChange={handleClassChange}
            label="Class"
          >
            <MenuItem value="">
              <em>Select Class</em>
            </MenuItem>
            {classes.map(cls => (
              <MenuItem key={cls._id} value={cls._id}>
                {cls.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default ClassSelector;
