import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';
import api from '../../services/api';

/**
 * A-Level Student Report Router
 * 
 * This component detects the student's form level (Form 5 or Form 6)
 * and redirects to the appropriate form-specific report component.
 */
const ALevelStudentReportRouter = () => {
  const { studentId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const detectStudentForm = async () => {
      try {
        setLoading(true);
        
        // First, try to get the student details
        const studentResponse = await api.get(`/api/students/${studentId}`);
        const student = studentResponse.data;
        
        // Check if this is an A-Level student
        if (student.educationLevel !== 'A_LEVEL') {
          setError('This is not an A-Level student. Please use the O-Level report component.');
          setLoading(false);
          return;
        }
        
        // Check if the student has a form level specified
        let formLevel = student.formLevel;
        
        // If form level is not specified, try to determine it from the class
        if (!formLevel && student.classId) {
          const classResponse = await api.get(`/api/classes/${student.classId}`);
          const classObj = classResponse.data;
          
          // Extract form level from class name (e.g., "FORM V" -> 5, "FORM VI" -> 6)
          if (classObj.name) {
            const formMatch = classObj.name.match(/FORM\s+(V|VI|5|6)/i);
            if (formMatch) {
              const formValue = formMatch[1];
              formLevel = formValue === 'V' || formValue === '5' ? 5 : 6;
            }
          }
        }
        
        // Default to Form 5 if we still can't determine the form level
        if (!formLevel) {
          console.log(`Defaulting A-Level student to Form 5 as no specific form level could be determined`);
          formLevel = 5;
        }
        
        // Redirect to the appropriate form-specific report
        const formSpecificPath = `/results/a-level/form${formLevel}/student/${studentId}/${examId}`;
        navigate(formSpecificPath, { 
          state: { 
            studentDetails: student,
            formLevel
          },
          replace: true 
        });
        
      } catch (err) {
        console.error('Error detecting student form level:', err);
        setError(`Failed to determine student form level: ${err.message}`);
        setLoading(false);
      }
    };
    
    detectStudentForm();
  }, [studentId, examId, navigate]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 5 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Detecting student form level...
        </Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  // This should not be rendered as we should have redirected
  return null;
};

export default ALevelStudentReportRouter;
