import React from 'react';
import { Box } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import TeacherDashboard from './teacher/TeacherDashboard';
import WorkingSubjectMarksEntry from './teacher/WorkingSubjectMarksEntry';
import DirectTestMarksEntry from './teacher/DirectTestMarksEntry';
import TeacherStudentResults from './teacher/TeacherStudentResults';
import ResultSmsNotification from './teacher/ResultSmsNotification';
import WorkingTeacherSubjectsClasses from './teacher/WorkingTeacherSubjectsClasses';
import MyStudents from './teacher/MyStudents';
import TeacherStudentManagement from './teacher/TeacherStudentManagement';
import StudentImport from './teacher/StudentImport';
import ExamList from './ExamList';
import StudentManagement from './StudentManagement';
import ResultReportSelector from './results/ResultReportSelector';
import MarksEntryDashboard from './results/MarksEntryDashboard';
import OLevelMarksEntry from './results/OLevelMarksEntry';
import ALevelMarksEntry from './results/ALevelMarksEntry';
import OLevelBulkMarksEntry from './results/OLevelBulkMarksEntry';
import ALevelBulkMarksEntry from './results/ALevelBulkMarksEntry';
import EnhancedBulkMarksEntry from './marks/EnhancedBulkMarksEntry';

const TeacherPanel = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Routes>
        <Route index element={<TeacherDashboard />} />
        <Route path="my-subjects" element={<WorkingTeacherSubjectsClasses />} />
        <Route path="my-students" element={<MyStudents />} />
        {/* Standard marks entry removed - using Marks Entry Dashboard instead */}
        <Route path="direct-test" element={<DirectTestMarksEntry />} />
        <Route path="results" element={<TeacherStudentResults />} />
        <Route path="result-reports" element={<ResultReportSelector />} />
        <Route path="sms-notification" element={<ResultSmsNotification />} />
        <Route path="exams" element={<ExamList />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="student-management" element={<TeacherStudentManagement />} />
        <Route path="student-import" element={<StudentImport />} />

        {/* Marks Entry Routes */}
        <Route path="marks-entry-dashboard" element={<MarksEntryDashboard />} />
        <Route path="o-level/marks-entry" element={<OLevelMarksEntry />} />
        <Route path="a-level/marks-entry" element={<ALevelMarksEntry />} />
        <Route path="o-level/bulk-marks-entry" element={<ALevelBulkMarksEntry educationLevel="O_LEVEL" />} />
        <Route path="o-level/enhanced-bulk-marks-entry" element={<EnhancedBulkMarksEntry />} />
        <Route path="a-level/bulk-marks-entry" element={<ALevelBulkMarksEntry />} />
      </Routes>
    </Box>
  );
};

export default TeacherPanel;


