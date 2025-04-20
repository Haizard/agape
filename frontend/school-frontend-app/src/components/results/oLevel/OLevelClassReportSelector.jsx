import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';
import useClasses from '../../../hooks/useClasses';
import useExams from '../../../hooks/useExams';
import {
  FormContainer,
  EnhancedSelect,
  EnhancedSwitch,
  SubmitButton,
  FormRow,
  FormCol,
  AnimatedContainer
} from '../../common';

/**
 * O-Level Class Report Selector Component
 *
 * Provides a user interface for selecting class and exam to generate O-Level class reports.
 * Mirrors the functionality of the A-Level Class Report Selector but for O-Level classes.
 */
const OLevelClassReportSelector = () => {
  const navigate = useNavigate();

  // State for selected values
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [forceRealData, setForceRealData] = useState(false);
  const [error, setError] = useState(null);

  // Fetch classes and exams using custom hooks
  const {
    classes,
    loading: classesLoading,
    error: classesError
  } = useClasses({ educationLevel: 'O_LEVEL' });

  const {
    exams,
    loading: examsLoading,
    error: examsError
  } = useExams();

  // Handle class selection
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
  };

  // Handle exam selection
  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
  };

  // Handle force real data toggle
  const handleForceRealDataChange = (event) => {
    setForceRealData(event.target.checked);
  };

  // Generate report function
  const generateReport = () => {
    if (!selectedClass || !selectedExam) {
      setError('Please select both a class and an exam');
      return;
    }

    // Construct URL with query parameters
    let url = `/results/o-level/class/${selectedClass}/${selectedExam}`;

    // Add force refresh parameter if needed
    if (forceRealData) {
      url += '?forceRefresh=true';
    }

    // Navigate to the report page
    navigate(url);
  };

  // Clear error when selections change
  useEffect(() => {
    if (error) setError(null);
  }, [selectedClass, selectedExam]);

  // Loading state
  const isLoading = classesLoading || examsLoading;

  return (
    <AnimatedContainer animation="fadeIn" duration={0.5}>
      <FormContainer>
        {(classesError || examsError) && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            {classesError || examsError}
          </Alert>
        )}

        {error && (
          <Alert
            severity="warning"
            sx={{
              mb: 3,
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
            {error}
          </Alert>
        )}

        <FormRow spacing={3}>
          <FormCol xs={12} md={6}>
            <EnhancedSelect
              label="Class"
              value={selectedClass}
              onChange={handleClassChange}
              color="success"
              disabled={isLoading}
              options={[
                { value: "", label: "Select a class" },
                ...classes.map((cls) => ({
                  value: cls._id,
                  label: cls.name
                }))
              ]}
              startAdornment={
                classesLoading ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} color="success" />
                ) : null
              }
            />
          </FormCol>

          <FormCol xs={12} md={6}>
            <EnhancedSelect
              label="Exam"
              value={selectedExam}
              onChange={handleExamChange}
              color="success"
              disabled={isLoading}
              options={[
                { value: "", label: "Select an exam" },
                ...exams.map((exam) => ({
                  value: exam._id,
                  label: exam.name
                }))
              ]}
              startAdornment={
                examsLoading ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} color="success" />
                ) : null
              }
            />
          </FormCol>
        </FormRow>

        <FormRow>
          <FormCol xs={12}>
            <EnhancedSwitch
              label="Force real data (bypass cache)"
              checked={forceRealData}
              onChange={handleForceRealDataChange}
              color="success"
            />
          </FormCol>
        </FormRow>

        <FormRow>
          <FormCol xs={12} md={6}>
            <SubmitButton
              variant="contained"
              color="success"
              onClick={generateReport}
              disabled={isLoading || !selectedClass || !selectedExam}
              loading={isLoading}
              startIcon={<AssignmentIcon />}
            >
              Generate O-Level Class Report
            </SubmitButton>
          </FormCol>

          <FormCol xs={12} md={6}>
            <SubmitButton
              variant="outlined"
              color="secondary"
              onClick={() => {
                setSelectedClass('');
                setSelectedExam('');
                setForceRealData(false);
              }}
              disabled={isLoading}
              startIcon={<RefreshIcon />}
            >
              Reset Selections
            </SubmitButton>
          </FormCol>
        </FormRow>
      </FormContainer>
    </AnimatedContainer>
  );
};

export default OLevelClassReportSelector;
