import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * DirectStudentFetcher Component
 *
 * This component directly fetches student data from the API and displays it.
 * It's used as a debugging tool to help identify issues with student data.
 */
const DirectStudentFetcher = ({ classId, onStudentsLoaded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [debugInfo, setDebugInfo] = useState({
    studentCount: 0,
    processedCount: 0,
    combinationsAvailable: false,
    subjectId: null,
    expanded: false
  });

  // Function to fetch students directly from the API
  const fetchStudents = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      setError('');

      // Try multiple endpoints to get student data
      const endpoints = [
        `/api/students/class/${classId}`,
        `/api/teachers/classes/${classId}/students`,
        `/api/students/a-level-combinations/class/${classId}`
      ];

      let studentsData = [];
      let successfulEndpoint = '';

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch students from ${endpoint}`);
          const response = await api.get(endpoint);

          if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            studentsData = response.data;
            successfulEndpoint = endpoint;
            console.log(`Successfully fetched ${studentsData.length} students from ${endpoint}`);
            break;
          } else if (response.data && response.data.students && Array.isArray(response.data.students) && response.data.students.length > 0) {
            studentsData = response.data.students;
            successfulEndpoint = endpoint;
            console.log(`Successfully fetched ${studentsData.length} students from ${endpoint} (nested in 'students' property)`);
            break;
          }
        } catch (endpointError) {
          console.error(`Error fetching students from ${endpoint}:`, endpointError);
        }
      }

      if (studentsData.length === 0) {
        setError('Could not fetch students from any endpoint');
        return;
      }

      // Check if we have combination data
      const hasCombinations = studentsData.some(student =>
        student.combinationId || (student.subjects && Array.isArray(student.subjects))
      );

      setDebugInfo(prev => ({
        ...prev,
        studentCount: studentsData.length,
        combinationsAvailable: hasCombinations,
        endpoint: successfulEndpoint
      }));

      // Process student data to extract names and combination info
      const processedStudents = studentsData.map(student => {
        // Try to extract the student name from various properties
        let studentName = 'Unknown';
        let combinationInfo = null;
        let subjectIds = [];

        // Check if this is a combination object
        if (student.student && typeof student.student === 'object') {
          const studentObj = student.student;
          if (studentObj.firstName || studentObj.lastName) {
            studentName = `${studentObj.firstName || ''} ${studentObj.lastName || ''}`.trim();
          } else if (studentObj.fullName) {
            studentName = studentObj.fullName;
          } else if (studentObj.name) {
            studentName = studentObj.name;
          }

          // Extract combination info
          if (student.name) {
            combinationInfo = student.name; // Combination name
          }

          // Extract subject IDs
          if (student.subjects && Array.isArray(student.subjects)) {
            subjectIds = student.subjects.map(s => ({
              id: s.subjectId,
              isPrincipal: s.isPrincipal
            }));
          }
        }
        // Check direct properties
        else if (student.firstName || student.lastName) {
          studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
        } else if (student.fullName) {
          studentName = student.fullName;
        } else if (student.name) {
          studentName = student.name;
        }

        return {
          id: student._id,
          name: studentName,
          combinationInfo,
          subjectIds,
          originalData: student
        };
      });

      setStudents(processedStudents);

      // Call the callback with the processed students
      if (onStudentsLoaded) {
        onStudentsLoaded(processedStudents);
      }

      console.log(`Processed ${processedStudents.length} students with names`);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError(`Failed to fetch students: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch students when classId changes
  useEffect(() => {
    if (classId) {
      fetchStudents();
    }
  }, [classId]);

  const toggleDebugExpanded = () => {
    setDebugInfo(prev => ({ ...prev, expanded: !prev.expanded }));
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Direct Student Data
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={fetchStudents}
        disabled={loading || !classId}
        sx={{ mb: 2, mr: 1 }}
      >
        Refresh Student Data
      </Button>

      <Button
        variant="outlined"
        color="info"
        onClick={toggleDebugExpanded}
        sx={{ mb: 2 }}
      >
        {debugInfo.expanded ? 'Hide Details' : 'Show Details'}
      </Button>

      <Typography variant="subtitle1" gutterBottom>
        Found {students.length} students
        {debugInfo.endpoint && ` from ${debugInfo.endpoint}`}
        {debugInfo.combinationsAvailable && ' (with combinations)'}
      </Typography>

      {debugInfo.expanded && (
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Student Combinations Debug</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="subtitle2" gutterBottom>
              Combination Data Available: {debugInfo.combinationsAvailable ? 'Yes' : 'No'}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <List dense>
              {students.slice(0, 5).map((student) => (
                <ListItem key={student.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <ListItemText
                    primary={student.name}
                    secondary={`ID: ${student.id}`}
                  />
                  {student.combinationInfo && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption">Combination: {student.combinationInfo}</Typography>
                    </Box>
                  )}
                  {student.subjectIds && student.subjectIds.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {student.subjectIds.map((subject, idx) => (
                        <Chip
                          key={idx}
                          label={subject.id}
                          size="small"
                          color={subject.isPrincipal ? 'primary' : 'default'}
                          variant={subject.isPrincipal ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  )}
                  <Divider sx={{ width: '100%', my: 1 }} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      <List dense>
        {students.slice(0, 10).map((student) => (
          <ListItem key={student.id}>
            <ListItemText
              primary={student.name}
              secondary={`ID: ${student.id}`}
            />
          </ListItem>
        ))}
        {students.length > 10 && (
          <ListItem>
            <ListItemText
              primary={`... and ${students.length - 10} more students`}
            />
          </ListItem>
        )}
      </List>
    </Paper>
  );
};

export default DirectStudentFetcher;
