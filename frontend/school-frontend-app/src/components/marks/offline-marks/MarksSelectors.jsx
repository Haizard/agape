import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

/**
 * MarksSelectors Component
 * 
 * Provides selection controls for academic year, term, class, and subject
 */
const MarksSelectors = ({
  academicYears,
  selectedAcademicYear,
  setSelectedAcademicYear,
  terms,
  selectedTerm,
  setSelectedTerm,
  classes,
  selectedClass,
  setSelectedClass,
  subjects,
  selectedSubject,
  setSelectedSubject
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Academic Year</InputLabel>
          <Select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
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
        <FormControl fullWidth sx={{ mb: 2 }}>
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
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Class</InputLabel>
          <Select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            label="Class"
            disabled={!selectedTerm}
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
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Subject</InputLabel>
          <Select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            label="Subject"
            disabled={!selectedClass}
          >
            <MenuItem value="">
              <em>Select Subject</em>
            </MenuItem>
            {subjects.map(subject => (
              <MenuItem key={subject._id} value={subject._id}>
                {subject.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default MarksSelectors;
