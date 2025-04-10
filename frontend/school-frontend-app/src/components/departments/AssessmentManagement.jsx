import React from 'react';
import DepartmentLayout from '../layout/DepartmentLayout';
import DirectResultsPage from '../admin/DirectResultsPage';
import ExamList from '../ExamList';
import ExamCreation from '../admin/ExamCreation';
import FixedExamTypeManagement from '../FixedExamTypeManagement';
import CharacterAssessmentEntry from '../results/CharacterAssessmentEntry';

import {
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Category as CategoryIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';

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
