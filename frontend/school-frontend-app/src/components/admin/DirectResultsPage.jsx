import React, { useState, useEffect } from 'react';
import { Box, Grid, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { ReportCard, PageTitle, AnimatedContainer, FadeIn } from '../common';

/**
 * DirectResultsPage Component
 *
 * A completely new admin results page that focuses on providing easy access to
 * A-Level and O-Level class reports with a modern, visually appealing interface.
 */
const DirectResultsPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get('/api/classes');
        // Ensure we're working with an array
        const classesData = Array.isArray(response.data) ? response.data : [];
        setClasses(classesData);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setError('Failed to fetch classes');
      }
    };

    fetchClasses();
  }, []);

  // Fetch exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await axios.get('/api/exams');
        // Ensure we're working with an array
        const examsData = Array.isArray(response.data) ? response.data : [];
        setExams(examsData);
      } catch (error) {
        console.error('Error fetching exams:', error);
        setError('Failed to fetch exams');
      }
    };

    fetchExams();
  }, []);

  return (
    <AnimatedContainer animation="fadeIn" duration={0.8}>
      <Box sx={{ p: 3 }}>
        <PageTitle title="Result Reports" />

        {error && (
          <FadeIn>
            <Alert severity="error" sx={{ mb: 2 }}>
              {typeof error === 'object' ? JSON.stringify(error) : error}
            </Alert>
          </FadeIn>
        )}

        <Grid container spacing={4}>
          {/* A-Level Class Reports Card */}
          <Grid item xs={12} md={6}>
            <FadeIn delay={0.2}>
              <ReportCard
                title="A-Level Class Reports"
                description="Generate and view comprehensive class reports for A-Level classes. These reports include student grades, divisions, and detailed performance statistics."
                color="primary"
                tags={['Grades', 'Divisions', 'Statistics']}
                buttonText="Access A-Level Reports"
                onClick={() => navigate('/admin/assessment-management/a-level-reports')}
                icon={<SchoolIcon sx={{ fontSize: '32px', color: '#3f51b5' }} />}
              />
            </FadeIn>
          </Grid>

          {/* O-Level Class Reports Card */}
          <Grid item xs={12} md={6}>
            <FadeIn delay={0.4}>
              <ReportCard
                title="O-Level Class Reports"
                description="Generate and view comprehensive class reports for O-Level classes. These reports include student grades, divisions, and detailed performance statistics."
                color="success"
                tags={['Grades', 'Divisions', 'Statistics']}
                buttonText="Access O-Level Reports"
                onClick={() => navigate('/admin/assessment-management/o-level-reports')}
                icon={<SchoolIcon sx={{ fontSize: '32px', color: '#4caf50' }} />}
              />
            </FadeIn>
          </Grid>
        </Grid>
      </Box>
    </AnimatedContainer>
  );
};

export default DirectResultsPage;
