import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import axios from 'axios';
import './ClassTabularReport.css';

/**
 * A printable version of the class report that can be used as a fallback
 * when PDF generation fails
 */
const PrintableClassReport = () => {
  const { classId, examId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classData, setClassData] = useState(null);
  const [examData, setExamData] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get the authentication token (optional)
        const token = localStorage.getItem('token');
        const headers = token ? {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        } : {
          'Accept': 'application/json'
        };

        // Fetch class data
        let classResponse;
        try {
          classResponse = await axios.get(
            `${process.env.REACT_APP_API_URL || ''}/api/classes/${classId}`,
            { headers }
          );
          setClassData(classResponse.data);
        } catch (classError) {
          console.warn('Could not fetch class data:', classError);
          // Use default class data
          setClassData({
            name: 'Class Report',
            educationLevel: 'A_LEVEL',
            academicYear: '2023-2024'
          });
        }

        // Fetch exam data
        let examResponse;
        try {
          examResponse = await axios.get(
            `${process.env.REACT_APP_API_URL || ''}/api/exams/${examId}`,
            { headers }
          );
          setExamData(examResponse.data);
        } catch (examError) {
          console.warn('Could not fetch exam data:', examError);
          // Use default exam data
          setExamData({
            name: 'Examination',
            academicYear: '2023-2024',
            term: 'Term'
          });
        }

        // Determine education level
        const educationLevel = classResponse?.data?.educationLevel || 'A_LEVEL';

        // Get the base API URL without duplicating 'api'
        const baseApiUrl = process.env.REACT_APP_API_URL || '';
        // Remove trailing '/api' if it exists to avoid duplication
        const apiBase = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`;

        console.log('API Base URL:', apiBase);

        // Fetch report data from the public API endpoint
        let reportUrl;
        if (educationLevel === 'A_LEVEL') {
          reportUrl = `${apiBase}/public/a-level/class/${classId}/${examId}?format=json`;
        } else {
          reportUrl = `${apiBase}/public/o-level/class/${classId}/${examId}?format=json`;
        }

        // Try to fetch with public access first
        let reportResponse;
        try {
          console.log(`Fetching report data from public API: ${reportUrl}`);
          reportResponse = await axios.get(reportUrl, {
            headers: { 'Accept': 'application/json' }
          });
        } catch (publicError) {
          console.error('Error fetching from public API:', publicError);

          // If public access fails, try with the regular API endpoint
          const fallbackUrl = educationLevel === 'A_LEVEL' ?
            `${apiBase}/a-level-results/class/${classId}/${examId}?format=json` :
            `${apiBase}/o-level-results/class/${classId}/${examId}?format=json`;

          console.log(`Trying fallback API: ${fallbackUrl}`);

          // If we have a token, try with it
          if (token) {
            try {
              reportResponse = await axios.get(fallbackUrl, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
                }
              });
            } catch (authError) {
              console.error('Error with authenticated request:', authError);

              // Try one more fallback - the API endpoint
              const apiEndpoint = educationLevel === 'A_LEVEL' ?
                `${apiBase}/a-level-results/api/class/${classId}/${examId}?format=json` :
                `${apiBase}/o-level-results/api/class/${classId}/${examId}?format=json`;

              console.log(`Trying API endpoint: ${apiEndpoint}`);
              reportResponse = await axios.get(apiEndpoint, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
                }
              });
            }
          } else {
            // If no token, try one more time without auth
            reportResponse = await axios.get(fallbackUrl, {
              headers: { 'Accept': 'application/json' }
            });
          }
        }

        // Process the report data
        const reportData = reportResponse.data;

        if (reportData.students && Array.isArray(reportData.students)) {
          setStudents(reportData.students);
        } else if (reportData.results && Array.isArray(reportData.results)) {
          setStudents(reportData.results);
        } else {
          console.warn('No student data found in report response:', reportData);
          setStudents([]);
        }

        // Extract subjects from the first student with subjects
        const firstStudentWithSubjects = reportData.students?.find(s => s.subjects && s.subjects.length > 0) ||
                                         reportData.results?.find(s => s.subjects && s.subjects.length > 0);

        if (firstStudentWithSubjects?.subjects) {
          setSubjects(firstStudentWithSubjects.subjects);
        } else {
          // If no subjects found, create a default set based on education level
          if (educationLevel === 'A_LEVEL') {
            setSubjects([
              { code: 'PHY', name: 'Physics', isPrincipal: true },
              { code: 'CHE', name: 'Chemistry', isPrincipal: true },
              { code: 'MAT', name: 'Mathematics', isPrincipal: true },
              { code: 'BIO', name: 'Biology', isPrincipal: true },
              { code: 'GEO', name: 'Geography', isPrincipal: true },
              { code: 'HIS', name: 'History', isPrincipal: true },
              { code: 'KIS', name: 'Kiswahili', isPrincipal: true },
              { code: 'GS', name: 'General Studies', isPrincipal: false }
            ]);
          } else {
            setSubjects([
              { code: 'ENG', name: 'English', isPrincipal: true },
              { code: 'KIS', name: 'Kiswahili', isPrincipal: true },
              { code: 'MAT', name: 'Mathematics', isPrincipal: true },
              { code: 'BIO', name: 'Biology', isPrincipal: true },
              { code: 'PHY', name: 'Physics', isPrincipal: true },
              { code: 'CHE', name: 'Chemistry', isPrincipal: true },
              { code: 'GEO', name: 'Geography', isPrincipal: true },
              { code: 'HIS', name: 'History', isPrincipal: true }
            ]);
          }
        }
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(`Failed to load report data: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId, examId]);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading printable report...
        </Typography>
      </Box>
    );
  }

  // If error, show error message with retry button
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.location.reload()}
          sx={{ mr: 2 }}
        >
          Retry
        </Button>
        <Button
          variant="outlined"
          onClick={() => window.print()}
        >
          Print Empty Template
        </Button>
      </Box>
    );
  }

  // Create safe versions of classData and examData with default values
  const safeClassData = classData || {
    name: 'Class',
    section: '',
    stream: '',
    academicYear: '2023-2024'
  };

  const safeExamData = examData || {
    name: 'Exam',
    academicYear: '2023-2024',
    term: 'Term'
  };

  return (
    <Box className="class-tabular-report-container">
      {/* Action Buttons - Hidden when printing */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }} className="no-print">
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print This Report
        </Button>
      </Box>

      {/* Report Header */}
      <Box className="report-header">
        <Box className="header-left">
          <Typography variant="h6" className="school-name">
            ST. JOHN VIANNEY SECONDARY SCHOOL
          </Typography>
          <Typography variant="body2" className="school-address">
            P.O. BOX 123, DAR ES SALAAM, TANZANIA
          </Typography>
          <Typography variant="body1" className="exam-info">
            {safeExamData.name || 'Exam'} - {
              (() => {
                try {
                  const year = safeExamData.academicYear || safeClassData.academicYear || '2023-2024';
                  return typeof year === 'object' && year._id ? year.name || year.year || '2023-2024' : year;
                } catch (err) {
                  return '2023-2024';
                }
              })()
            }
          </Typography>
        </Box>

        <Box className="header-center">
          <img
            src="/images/school-logo.png"
            alt="School Logo"
            className="school-logo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </Box>

        <Box className="header-right">
          <Typography variant="body1" className="report-title">
            CLASS ACADEMIC REPORT
          </Typography>
          <Typography variant="body2" className="class-info">
            {safeClassData.name}
          </Typography>
          <Typography variant="body2" className="term-info">
            {(() => {
              try {
                const term = safeExamData.term || safeClassData.term || 'Term';
                return typeof term === 'object' && term._id ? term.name || 'Term' : term;
              } catch (err) {
                return 'Term';
              }
            })()}
          </Typography>
        </Box>
      </Box>

      {/* Class Summary */}
      <Box className="class-summary">
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Typography variant="body1">
              <strong>Total Students:</strong> {students.length}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body1">
              <strong>Form:</strong> {safeClassData.form || 'All Forms'}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body1">
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {/* Main Report Table */}
      <TableContainer component={Paper} className="report-table-container">
        <Table className="report-table" size="small">
          <TableHead>
            <TableRow className="table-header-row">
              <TableCell key="header-student" className="student-header">STUDENT</TableCell>
              <TableCell key="header-sex" className="info-header">SEX</TableCell>
              <TableCell key="header-points" className="info-header">POINTS</TableCell>
              <TableCell key="header-div" className="info-header">DIV</TableCell>
              {subjects.map((subject) => (
                <TableCell
                  key={`header-${subject.code || subject.name || 'unknown'}`}
                  align="center"
                  className={subject.isPrincipal ? "principal-subject" : "subsidiary-subject"}
                >
                  {subject.code || (subject.name ? subject.name.substring(0, 3).toUpperCase() : 'UNK')}
                </TableCell>
              ))}
              <TableCell key="header-total" align="center" className="total-header">TOTAL</TableCell>
              <TableCell key="header-avg" align="center" className="average-header">AVG</TableCell>
              <TableCell key="header-rank" align="center" className="rank-header">RANK</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id || student._id} className="student-row">
                <TableCell className="student-name">
                  {student.name || `${student.firstName} ${student.lastName}`}
                  <div className="student-number">{student.admissionNumber}</div>
                  <div className="student-combination">{student.combination || student.subjectCombination}</div>
                </TableCell>
                <TableCell align="center" className="gender-cell">
                  {student.gender || '-'}
                </TableCell>
                <TableCell align="center" className="points-cell">
                  {student.summary?.bestThreePoints || student.points || '-'}
                </TableCell>
                <TableCell align="center" className="division-cell">
                  {student.summary?.division || student.division || '-'}
                </TableCell>
                {subjects.map((subject) => {
                  // Find the student's subject
                  let studentSubject = null;

                  // Try to find in subjects array
                  if (student.subjects && Array.isArray(student.subjects)) {
                    studentSubject = student.subjects.find(s =>
                      s.code === subject.code ||
                      (s.name && subject.name && s.name.toLowerCase() === subject.name.toLowerCase())
                    );
                  }

                  // If not found, try other arrays
                  if (!studentSubject && student.allSubjects && Array.isArray(student.allSubjects)) {
                    studentSubject = student.allSubjects.find(s =>
                      s.code === subject.code ||
                      (s.name && subject.name && s.name.toLowerCase() === subject.name.toLowerCase())
                    );
                  }

                  // Generate a unique key for this cell
                  const cellKey = `${student.id || student._id || 'unknown'}-${subject.code || subject.name || 'unknown'}`;

                  return (
                    <TableCell key={cellKey} align="center" className="subject-cell">
                      {studentSubject ? (
                        <div className="subject-data">
                          <div className="subject-marks">
                            {studentSubject.marks || studentSubject.marksObtained || '-'}
                          </div>
                          <div className="subject-grade">
                            {studentSubject.grade || '-'}
                          </div>
                        </div>
                      ) : (
                        <div className="subject-data">
                          <div className="subject-marks">-</div>
                          <div className="subject-grade">-</div>
                        </div>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell align="center" className="total-cell">
                  {student.summary?.totalMarks || student.totalMarks || '-'}
                </TableCell>
                <TableCell align="center" className="average-cell">
                  {student.summary?.average || student.average || '-'}
                </TableCell>
                <TableCell align="center" className="rank-cell">
                  {student.summary?.position || student.position || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Report Footer */}
      <Box className="report-footer" sx={{ mt: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Typography variant="body2">
              <strong>Class Teacher:</strong> ____________________
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2">
              <strong>Academic Master:</strong> ____________________
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="body2">
              <strong>Head of School:</strong> ____________________
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default PrintableClassReport;
