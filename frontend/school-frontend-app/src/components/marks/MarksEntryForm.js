import React from 'react';
import { 
  Box, 
  Button, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Alert,
  CircularProgress
} from '@mui/material';

/**
 * Form component for selecting class, subject, exam, and academic year
 */
const MarksEntryForm = ({ 
  classes,
  subjects,
  exams,
  academicYears,
  selectedClass,
  selectedSubject,
  selectedExam,
  selectedAcademicYear,
  educationLevel,
  loading,
  checkingMarks,
  setSelectedClass,
  setSelectedSubject,
  setSelectedExam,
  setSelectedAcademicYear,
  checkExistingMarks,
  resetForm
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
      <FormControl fullWidth>
        <InputLabel>Class</InputLabel>
        <Select
          value={selectedClass}
          label="Class"
          onChange={(e) => {
            setSelectedClass(e.target.value);
            resetForm();
          }}
          disabled={loading}
        >
          {loading ? (
            <MenuItem disabled>Loading classes...</MenuItem>
          ) : (
            classes.map((cls) => (
              <MenuItem key={cls._id} value={cls._id}>
                {cls.name} ({cls.educationLevel})
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {educationLevel && (
        <Alert severity="info" sx={{ mb: 1 }}>
          Selected class is {educationLevel === 'O_LEVEL' ? 'O-Level' : 'A-Level'}
        </Alert>
      )}

      <FormControl fullWidth>
        <InputLabel>Subject</InputLabel>
        <Select
          value={selectedSubject}
          label="Subject"
          onChange={(e) => {
            setSelectedSubject(e.target.value);
          }}
          disabled={!selectedClass || loading}
        >
          {subjects.map((subject) => (
            <MenuItem key={subject.id} value={subject.id}>
              {subject.name} ({subject.code}) - {subject.type === 'CORE' ? 'Core' : 'Optional'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Exam</InputLabel>
        <Select
          value={selectedExam}
          label="Exam"
          onChange={(e) => {
            setSelectedExam(e.target.value);
          }}
          disabled={loading}
        >
          {exams.map((exam) => (
            <MenuItem key={exam.id} value={exam.id}>
              {exam.name} ({exam.term})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Academic Year</InputLabel>
        <Select
          value={selectedAcademicYear}
          label="Academic Year"
          onChange={(e) => setSelectedAcademicYear(e.target.value)}
          disabled={loading}
        >
          {academicYears.map((year) => (
            <MenuItem key={year._id} value={year._id}>
              {year.name} {year.isCurrent && '(Current)'}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button 
          variant="contained" 
          onClick={checkExistingMarks}
          disabled={!selectedClass || !selectedSubject || !selectedExam || checkingMarks}
          startIcon={checkingMarks && <CircularProgress size={20} color="inherit" />}
        >
          {checkingMarks ? 'Checking...' : 'Check Marks'}
        </Button>
        <Button variant="outlined" onClick={resetForm}>
          Reset
        </Button>
      </Box>
    </Box>
  );
};

export default MarksEntryForm;
