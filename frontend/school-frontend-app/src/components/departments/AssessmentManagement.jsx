import React from 'react';
import DepartmentLayout from '../layout/DepartmentLayout';
import DirectResultsPage from '../admin/DirectResultsPage';
import ExamList from '../ExamList';
import ExamCreation from '../admin/ExamCreation';
import FixedExamTypeManagement from '../FixedExamTypeManagement';
import CharacterAssessmentEntry from '../results/CharacterAssessmentEntry';
import ResultReportSelectorWrapper from '../results/ResultReportSelectorWrapper';

import {
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Category as CategoryIcon,
  Psychology as PsychologyIcon,
  Description as DescriptionIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { Box, Typography, Button } from '@mui/material';

const AssessmentManagement = () => {
  const menuItems = [
    {
      id: 'results',
      label: 'Results',
      icon: <AssessmentIcon />,
      component: <DirectResultsPage />
    },
    {
      id: 'exams',
      label: 'Exams',
      icon: <ScheduleIcon />,
      component: <ExamList />
    },
    {
      id: 'exam-creation',
      label: 'Create Exams',
      icon: <AddIcon />,
      component: <ExamCreation />
    },
    {
      id: 'exam-types',
      label: 'Exam Types',
      icon: <CategoryIcon />,
      component: <FixedExamTypeManagement />
    },
    {
      id: 'character-assessment',
      label: 'Character Assessment',
      icon: <PsychologyIcon />,
      component: <CharacterAssessmentEntry />
    },
    {
      id: 'result-reports',
      label: 'Result Reports',
      icon: <DescriptionIcon />,
      component: <ResultReportSelectorWrapper />
    },
    {
      id: 'a-level-class-reports',
      label: 'A-Level Class Reports',
      icon: <SchoolIcon />,
      component: (
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            A-Level Class Reports
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // Get a sample class and exam ID
              fetch('/api/classes?educationLevel=A_LEVEL')
                .then(response => response.json())
                .then(classes => {
                  if (classes && classes.length > 0) {
                    const classId = classes[0]._id;
                    fetch('/api/exams')
                      .then(response => response.json())
                      .then(exams => {
                        if (exams && exams.length > 0) {
                          const examId = exams[0]._id;
                          window.location.href = `/results/a-level/class/${classId}/${examId}`;
                        } else {
                          window.location.href = '/results/result-reports?tab=1&educationLevel=A_LEVEL';
                        }
                      })
                      .catch(() => {
                        window.location.href = '/results/result-reports?tab=1&educationLevel=A_LEVEL';
                      });
                  } else {
                    window.location.href = '/results/result-reports?tab=1&educationLevel=A_LEVEL';
                  }
                })
                .catch(() => {
                  window.location.href = '/results/result-reports?tab=1&educationLevel=A_LEVEL';
                });
            }}
          >
            Go to A-Level Class Reports
          </Button>
        </Box>
      )
    }
  ];

  return (
    <DepartmentLayout
      title="Assessment Management"
      menuItems={menuItems}
      defaultSelected="results"
    />
  );
};

export default AssessmentManagement;
