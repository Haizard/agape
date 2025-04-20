import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from '../../../utils/debounceUtils';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import AssignmentIcon from '@mui/icons-material/Assignment';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
 * ALevelClassReportSelector Component
 *
 * A dedicated selector for A-Level class reports
 */
const ALevelClassReportSelector = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [formLevel, setFormLevel] = useState('all');
  const [forceRealData, setForceRealData] = useState(false);

  // Fetch classes and exams on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch A-Level classes
        console.log('Fetching A-Level classes...');
        const classesResponse = await axios.get('/api/classes?educationLevel=A_LEVEL');
        console.log('A-Level classes response:', classesResponse.data);
        setClasses(classesResponse.data);

        // Fetch exams with more specific filtering
        console.log('Fetching A-Level exams...');
        const examsResponse = await axios.get('/api/exams?educationLevel=A_LEVEL');
        console.log('A-Level exams response:', examsResponse.data);

        // Use all exams if no education level filter is available yet
        const filteredExams = examsResponse.data.length > 0 ?
          examsResponse.data :
          // Fallback to filtering client-side if the API doesn't support education level filtering yet
          (await axios.get('/api/exams')).data.filter(exam => {
            return !exam.educationLevel || exam.educationLevel === 'A_LEVEL';
          });

        console.log('Filtered exams for A-Level:', filteredExams);
        setExams(filteredExams);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle class selection
  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
  };

  // Handle exam selection
  const handleExamChange = (event) => {
    setSelectedExam(event.target.value);
  };

  // Handle form level selection
  const handleFormLevelChange = (event) => {
    setFormLevel(event.target.value);
  };

  // Generate class report - wrapped in useCallback to maintain reference stability
  const generateReport = useCallback(() => {
    if (!selectedClass || !selectedExam) {
      setError('Please select a class and an exam');
      return;
    }

    // Build the URL with query parameters
    let url;

    // Navigate to the appropriate report based on form level
    if (formLevel === 'all') {
      // Use the correct path structure that matches the route definition
      url = `/results/a-level/class/${selectedClass}/${selectedExam}`;
    } else {
      // Use the correct path structure that matches the route definition
      url = `/results/a-level/class/${selectedClass}/${selectedExam}/form/${formLevel}`;
    }

    // Build query parameters as an object for better consistency
    const queryParams = new URLSearchParams();

    // Always add timestamp to prevent caching
    queryParams.append('_t', Date.now());

    // Add forceRefresh parameter if forceRealData is true
    if (forceRealData) {
      queryParams.append('forceRefresh', 'true');
      queryParams.append('useMock', 'false');
      console.log('Force real data enabled, adding forceRefresh=true and useMock=false');
    }

    // Add the query parameters to the URL
    url += `?${queryParams.toString()}`;
    console.log(`Final URL with parameters: ${url}`);

    console.log(`Navigating to A-Level class report: ${url}`);

    // Navigate to the report
    navigate(url);
  }, [selectedClass, selectedExam, formLevel, forceRealData, navigate, setError]);

  // Debounced version of the generate report function to prevent multiple rapid clicks
  const handleGenerateReport = useCallback(
    debounce(() => {
      console.log('Debounced generate report called');
      generateReport();
    }, 300),
    [generateReport]
  );

  return (
    <AnimatedContainer animation="fadeIn" duration={0.5}>
      <FormContainer>
        {error && (
          <Alert
            severity="error"
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
          <FormCol xs={12} md={4}>
            <EnhancedSelect
              label="Class"
              value={selectedClass}
              onChange={handleClassChange}
              color="primary"
              disabled={loading}
              options={[
                { value: "", label: "Select a class" },
                ...classes.map((classItem) => ({
                  value: classItem._id,
                  label: `${classItem.name} ${classItem.section || ''} ${classItem.stream || ''}`
                }))
              ]}
            />
          </FormCol>

          <FormCol xs={12} md={4}>
            <EnhancedSelect
              label="Exam"
              value={selectedExam}
              onChange={handleExamChange}
              color="primary"
              disabled={loading}
              options={[
                { value: "", label: "Select an exam" },
                ...exams.map((exam) => ({
                  value: exam._id,
                  label: `${exam.name} ${exam.term ? `- Term ${exam.term}` : ''} ${exam.year ? `(${exam.year})` : ''}`
                }))
              ]}
            />
          </FormCol>

          <FormCol xs={12} md={4}>
            <EnhancedSelect
              label="Form Level"
              value={formLevel}
              onChange={handleFormLevelChange}
              color="primary"
              disabled={loading}
              options={[
                { value: "all", label: "All Forms" },
                { value: "5", label: "Form 5" },
                { value: "6", label: "Form 6" }
              ]}
            />
          </FormCol>
        </FormRow>

        <FormRow>
          <FormCol xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EnhancedSwitch
                label="Force Real Data (Dev Only)"
                checked={forceRealData}
                onChange={(e) => setForceRealData(e.target.checked)}
                color="primary"
              />
              <Tooltip title="When enabled, bypasses mock data and forces the system to use real database data">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <SubmitButton
                variant="contained"
                color="primary"
                onClick={handleGenerateReport}
                disabled={!selectedClass || !selectedExam || loading}
                loading={loading}
                sx={{ flexGrow: 1 }}
                startIcon={<AssignmentIcon />}
              >
                Generate A-Level Class Report
              </SubmitButton>

              <SubmitButton
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setSelectedClass('');
                  setSelectedExam('');
                  setFormLevel('all');
                  setForceRealData(false);
                }}
                disabled={loading}
                sx={{ width: '120px' }}
                startIcon={<RefreshIcon />}
              >
                Reset
              </SubmitButton>
            </Box>
          </FormCol>
        </FormRow>
      </FormContainer>
    </AnimatedContainer>
  );
};

export default ALevelClassReportSelector;
