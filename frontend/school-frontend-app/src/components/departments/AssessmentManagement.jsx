import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import DepartmentLayout from '../layout/DepartmentLayout';
import DirectResultsPage from '../admin/DirectResultsPage';
import ExamList from '../ExamList';
import ExamCreation from '../admin/ExamCreation';
import FixedExamTypeManagement from '../FixedExamTypeManagement';
import CharacterAssessmentEntry from '../results/CharacterAssessmentEntry';
import OLevelClassReportsPage from '../results/oLevel/OLevelClassReportsPage';
import ALevelClassReportsPage from '../results/aLevel/ALevelClassReportsPage';
import AssessmentList from '../assessment/AssessmentList';
import BulkAssessmentEntry from '../assessment/BulkAssessmentEntry';
import AssessmentReport from '../assessment/AssessmentReport';
import { AssessmentProvider } from '../../contexts/AssessmentContext';

import {
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Category as CategoryIcon,
  Psychology as PsychologyIcon,
  Description as DescriptionIcon,
  School as SchoolIcon,
  List as ListIcon,
  Input as InputIcon,
  BarChart as ReportIcon
} from '@mui/icons-material';

const AssessmentManagement = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      id: 'assessments',
      label: 'Assessments',
      icon: <ListIcon />,
      path: 'assessments'
    },
    {
      id: 'bulk-entry',
      label: 'Bulk Entry',
      icon: <InputIcon />,
      path: 'bulk-entry'
    },
    {
      id: 'assessment-report',
      label: 'Assessment Report',
      icon: <ReportIcon />,
      path: 'assessment-report'
    },
    {
      id: 'results',
      label: 'Results',
      icon: <AssessmentIcon />,
      path: 'results'
    },
    {
      id: 'exams',
      label: 'Exams',
      icon: <ScheduleIcon />,
      path: 'exams'
    },
    {
      id: 'exam-creation',
      label: 'Create Exams',
      icon: <AddIcon />,
      path: 'exam-creation'
    },
    {
      id: 'exam-types',
      label: 'Exam Types',
      icon: <CategoryIcon />,
      path: 'exam-types'
    },
    {
      id: 'character-assessment',
      label: 'Character Assessment',
      icon: <PsychologyIcon />,
      path: 'character-assessment'
    }
  ];

  return (
    <AssessmentProvider>
      <DepartmentLayout
        title="Assessment Management"
        menuItems={menuItems}
        defaultSelected="assessments"
      >
        <Routes>
          <Route index element={<AssessmentList />} />
          <Route path="assessments" element={<AssessmentList />} />
          <Route path="bulk-entry" element={<BulkAssessmentEntry />} />
          <Route path="assessment-report" element={<AssessmentReport />} />
          <Route path="results" element={<DirectResultsPage />} />
          <Route path="exams" element={<ExamList />} />
          <Route path="exam-creation" element={<ExamCreation />} />
          <Route path="exam-types" element={<FixedExamTypeManagement />} />
          <Route path="character-assessment" element={<CharacterAssessmentEntry />} />
          <Route path="o-level-reports/*" element={<OLevelClassReportsPage />} />
          <Route path="a-level-reports/*" element={<ALevelClassReportsPage />} />
        </Routes>
      </DepartmentLayout>
    </AssessmentProvider>
  );
};

export default AssessmentManagement;
