import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import OLevelClassReportSelector from './OLevelClassReportSelector';
import {
  PageHeader,
  SectionContainer,
  SectionHeader,
  AnimatedContainer,
  FadeIn,
  GradientButton,
  IconContainer
} from '../../common';

/**
 * O-Level Class Reports Page
 *
 * This page provides a dedicated interface for generating and viewing O-Level class reports.
 * It includes a selector for class and exam, as well as options for forcing real data.
 */
const OLevelClassReportsPage = () => {
  const navigate = useNavigate();

  return (
    <AnimatedContainer animation="fadeIn" duration={0.8}>
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="O-Level Class Reports"
          subtitle="Generate and view comprehensive class reports for O-Level students"
          color="success"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Assessment Management', href: '/admin/assessment-management#results' },
            { label: 'O-Level Class Reports' }
          ]}
          actions={[
            <GradientButton
              key="back"
              variant="outlined"
              color="success"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/admin/assessment-management#results')}
            >
              Back to Assessment Management
            </GradientButton>
          ]}
        />

        <FadeIn delay={0.2}>
          <SectionContainer>
            <SectionHeader
              title="O-Level Class Report Generator"
              subtitle="Select a class and exam to generate an O-Level class report."
              color="success"
              icon={
                <IconContainer color="success">
                  <SchoolIcon />
                </IconContainer>
              }
            />

            <FadeIn delay={0.3}>
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                Reports are cached for better performance. Use the "Force Real Data" option if you need the most up-to-date information.
              </Alert>
            </FadeIn>

            <FadeIn delay={0.4}>
              <OLevelClassReportSelector />
            </FadeIn>
          </SectionContainer>
        </FadeIn>
      </Box>
    </AnimatedContainer>
  );
};

export default OLevelClassReportsPage;
