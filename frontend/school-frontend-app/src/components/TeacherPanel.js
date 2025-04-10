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
import ExamList from './ExamList';
import StudentManagement from './StudentManagement';
import ResultReportSelector from './results/ResultReportSelector';

const TeacherPanel = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Routes>
        <Route index element={<TeacherDashboard />} />
        <Route path="my-subjects" element={<WorkingTeacherSubjectsClasses />} />
        <Route path="my-students" element={<MyStudents />} />
        <Route path="marks-entry" element={<WorkingSubjectMarksEntry />} />
        <Route path="direct-test" element={<DirectTestMarksEntry />} />
        <Route path="results" element={<TeacherStudentResults />} />
        <Route path="result-reports" element={<ResultReportSelector />} />
        <Route path="sms-notification" element={<ResultSmsNotification />} />
        <Route path="exams" element={<ExamList />} />
        <Route path="students" element={<StudentManagement />} />
      </Routes>
    </Box>
  );
};

export default TeacherPanel;


