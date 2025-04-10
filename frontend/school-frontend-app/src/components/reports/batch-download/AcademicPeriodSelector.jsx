import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

/**
 * AcademicPeriodSelector Component
 * 
 * Allows selecting academic year and term
 */
const AcademicPeriodSelector = ({
  academicYears,
  selectedAcademicYear,
  handleAcademicYearChange,
  terms,
  selectedTerm,
  setSelectedTerm
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Academic Year</InputLabel>
          <Select
            value={selectedAcademicYear}
            onChange={handleAcademicYearChange}
            label="Academic Year"
          >
            <MenuItem value="">
              <em>Select Academic Year</em>
            </MenuItem>
            {academicYears.map(year => (
              <MenuItem key={year._id} value={year._id}>
                {year.name} {year.isActive ? '(Current)' : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Term</InputLabel>
          <Select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            label="Term"
            disabled={!selectedAcademicYear}
          >
            <MenuItem value="">
              <em>Select Term</em>
            </MenuItem>
            {terms.map(term => (
              <MenuItem key={term._id} value={term._id}>
                {term.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default AcademicPeriodSelector;
