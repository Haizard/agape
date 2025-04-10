import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert
} from '@mui/material';
import WorkflowStepper from '../common/WorkflowStepper';
import { useAcademic } from '../../contexts/AcademicContext';
import api from '../../services/api';

/**
 * ResultManagementWorkflow Component
 * 
 * A workflow component that guides users through the complete result management process:
 * 1. Select Class and Exam
 * 2. Enter Marks
 * 3. Generate Reports
 * 4. Send Notifications
 */
const ResultManagementWorkflow = () => {
  const navigate = useNavigate();
  const { currentYear } = useAcademic();
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch classes and exams
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [classesRes, examsRes] = await Promise.all([
          api.get('/api/classes'),
          api.get('/api/exams')
        ]);
        setClasses(classesRes.data);
        setExams(examsRes.data);
      } catch (err) {
        setError(`Failed to fetch data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Step 1: Class and Exam Selection Component
  const ClassExamSelection = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Select Class and Exam
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Class</InputLabel>
        <Select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          label="Class"
        >
          {classes.map((cls) => (
            <MenuItem key={cls._id} value={cls._id}>
              {cls.name} {cls.stream} {cls.section}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Exam</InputLabel>
        <Select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          label="Exam"
        >
          {exams.map((exam) => (
            <MenuItem key={exam._id} value={exam._id}>
              {exam.name} ({exam.type})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Paper>
  );

  // Step 2: Enter Marks Component
  const EnterMarks = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Enter Student Marks
      </Typography>
      
      <Typography paragraph>
        You can enter marks for the selected class and exam.
      </Typography>
      
      <Button 
        variant="contained" 
        color="primary"
        onClick={() => navigate(`/teacher/enter-marks?classId=${selectedClass}&examId=${selectedExam}`)}
      >
        Go to Marks Entry
      </Button>
    </Paper>
  );

  // Step 3: Generate Reports Component
  const GenerateReports = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Generate Result Reports
      </Typography>
      
      <Typography paragraph>
        Generate result reports for the selected class and exam.
      </Typography>
      
      <Button 
        variant="contained" 
        color="primary"
        onClick={() => navigate(`/admin/result-reports?classId=${selectedClass}&examId=${selectedExam}`)}
      >
        Generate Reports
      </Button>
    </Paper>
  );

  // Step 4: Send Notifications Component
  const SendNotifications = () => (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Send Result Notifications
      </Typography>
      
      <Typography paragraph>
        Send SMS notifications to parents about student results.
      </Typography>
      
      <Button 
        variant="contained" 
        color="primary"
        onClick={() => navigate(`/admin/result-notifications?classId=${selectedClass}&examId=${selectedExam}`)}
      >
        Send Notifications
      </Button>
    </Paper>
  );

  // Define workflow steps
  const workflowSteps = [
    {
      label: 'Select Class and Exam',
      description: 'Choose the class and exam for which you want to manage results',
      component: <ClassExamSelection />
    },
    {
      label: 'Enter Marks',
      description: 'Enter student marks for the selected class and exam',
      component: <EnterMarks />
    },
    {
      label: 'Generate Reports',
      description: 'Generate result reports for students',
      component: <GenerateReports />
    },
    {
      label: 'Send Notifications',
      description: 'Send result notifications to parents',
      component: <SendNotifications />
    }
  ];

  // Handle workflow completion
  const handleWorkflowComplete = () => {
    setSuccess('Result management workflow completed successfully!');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Result Management Workflow
      </Typography>
      
      <Typography variant="body1" paragraph>
        This workflow will guide you through the complete process of managing student results,
        from entering marks to sending notifications to parents.
      </Typography>
      
      <WorkflowStepper 
        steps={workflowSteps} 
        title="Complete Result Management Process"
        onComplete={handleWorkflowComplete}
      />
    </Box>
  );
};

export default ResultManagementWorkflow;
