import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

import './ClassTabularReport.css';

/**
 * ClassTabularReport Component
 * Displays a comprehensive academic report for an entire class in a tabular format
 * with all students from different subject combinations in a single view
 */
const ClassTabularReport = () => {
  const { classId, examId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examData, setExamData] = useState(null);
  const [filterCombination, setFilterCombination] = useState('');
  const [filterForm, setFilterForm] = useState('');
  const [combinations, setCombinations] = useState([]);

  // Generate demo data for testing
  const generateDemoData = useCallback(() => {
    // Define subject combinations
    const subjectCombinations = [
      { code: 'PCM', name: 'Physics, Chemistry, Mathematics' },
      { code: 'PGM', name: 'Physics, Geography, Mathematics' },
      { code: 'HKL', name: 'History, Kiswahili, Literature' },
      { code: 'CBG', name: 'Chemistry, Biology, Geography' }
    ];

    // Define all possible subjects
    const allPossibleSubjects = [
      { code: 'PHY', name: 'Physics', isPrincipal: true },
      { code: 'CHE', name: 'Chemistry', isPrincipal: true },
      { code: 'MAT', name: 'Mathematics', isPrincipal: true },
      { code: 'BIO', name: 'Biology', isPrincipal: true },
      { code: 'GEO', name: 'Geography', isPrincipal: true },
      { code: 'HIS', name: 'History', isPrincipal: true },
      { code: 'KIS', name: 'Kiswahili', isPrincipal: true },
      { code: 'LIT', name: 'Literature', isPrincipal: true },
      { code: 'GS', name: 'General Studies', isPrincipal: false },
      { code: 'BAM', name: 'Basic Applied Mathematics', isPrincipal: false },
      { code: 'ENG', name: 'English Language', isPrincipal: false }
    ];

    // Generate demo students
    const demoStudents = [];

    // Helper function to get random marks
    const getRandomMarks = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Helper function to get grade from marks
    const getGrade = (marks) => {
      if (marks >= 80) return 'A';
      if (marks >= 70) return 'B';
      if (marks >= 60) return 'C';
      if (marks >= 50) return 'D';
      if (marks >= 40) return 'E';
      return 'F';
    };

    // Helper function to get points from grade
    const getPoints = (grade) => {
      switch (grade) {
        case 'A': return 1;
        case 'B': return 2;
        case 'C': return 3;
        case 'D': return 4;
        case 'E': return 5;
        case 'F': return 6;
        default: return null;
      }
    };

    // Generate 24 students with different combinations (12 Form 5, 12 Form 6)
    for (let i = 1; i <= 24; i++) {
      // Determine if this is a Form 5 or Form 6 student
      const isForm5 = i <= 12;
      const form = isForm5 ? 5 : 6;

      // Assign a combination
      const combinationIndex = (i - 1) % subjectCombinations.length;
      const combination = subjectCombinations[combinationIndex];

      // Determine which subjects this student takes based on combination
      let studentSubjects = [];

      // Add principal subjects based on combination
      if (combination.code === 'PCM') {
        studentSubjects.push(
          { ...allPossibleSubjects.find(s => s.code === 'PHY'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'CHE'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'MAT'), isPrincipal: true }
        );
      } else if (combination.code === 'PGM') {
        studentSubjects.push(
          { ...allPossibleSubjects.find(s => s.code === 'PHY'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'GEO'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'MAT'), isPrincipal: true }
        );
      } else if (combination.code === 'HKL') {
        studentSubjects.push(
          { ...allPossibleSubjects.find(s => s.code === 'HIS'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'KIS'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'LIT'), isPrincipal: true }
        );
      } else if (combination.code === 'CBG') {
        studentSubjects.push(
          { ...allPossibleSubjects.find(s => s.code === 'CHE'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'BIO'), isPrincipal: true },
          { ...allPossibleSubjects.find(s => s.code === 'GEO'), isPrincipal: true }
        );
      }

      // Add compulsory subjects for all students
      studentSubjects.push(
        { ...allPossibleSubjects.find(s => s.code === 'GS'), isPrincipal: false },
        { ...allPossibleSubjects.find(s => s.code === 'BAM'), isPrincipal: false },
        { ...allPossibleSubjects.find(s => s.code === 'ENG'), isPrincipal: false }
      );

      // Generate marks, grades, and points for each subject
      // Form 6 students generally perform better than Form 5
      const minMarks = isForm5 ? 40 : 50;
      const maxMarks = isForm5 ? 90 : 95;

      studentSubjects = studentSubjects.map(subject => {
        const marks = getRandomMarks(minMarks, maxMarks);
        const grade = getGrade(marks);
        const points = getPoints(grade);
        return { ...subject, marks, grade, points };
      });

      // Calculate total marks and points
      const totalMarks = studentSubjects.reduce((sum, s) => sum + s.marks, 0);
      const totalPoints = studentSubjects.reduce((sum, s) => sum + s.points, 0);
      const averageMarks = (totalMarks / studentSubjects.length).toFixed(2);

      // Calculate best three principal points
      const principalSubjects = studentSubjects.filter(s => s.isPrincipal);
      const bestThreePrincipal = [...principalSubjects].sort((a, b) => a.points - b.points).slice(0, 3);
      const bestThreePoints = bestThreePrincipal.reduce((sum, s) => sum + s.points, 0);

      // Determine division
      let division = 'N/A';
      if (bestThreePoints >= 3 && bestThreePoints <= 9) division = 'I';
      else if (bestThreePoints >= 10 && bestThreePoints <= 12) division = 'II';
      else if (bestThreePoints >= 13 && bestThreePoints <= 17) division = 'III';
      else if (bestThreePoints >= 18 && bestThreePoints <= 19) division = 'IV';
      else if (bestThreePoints >= 20 && bestThreePoints <= 21) division = 'V';

      // Create student object
      const student = {
        id: `student-${i}`,
        name: `Student ${i}`,
        admissionNumber: `F${form}-${i.toString().padStart(3, '0')}`,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        combination: combination.code,
        combinationName: combination.name,
        subjects: studentSubjects,
        form: form,
        summary: {
          totalMarks,
          averageMarks,
          totalPoints,
          bestThreePoints,
          division,
          rank: i // Will be recalculated later
        }
      };

      demoStudents.push(student);
    }

    // Calculate ranks based on best three points (separately for Form 5 and Form 6)
    const form5Students = demoStudents.filter(s => s.form === 5);
    const form6Students = demoStudents.filter(s => s.form === 6);

    // Sort and assign ranks for Form 5
    form5Students.sort((a, b) => a.summary.bestThreePoints - b.summary.bestThreePoints);
    for (let i = 0; i < form5Students.length; i++) {
      form5Students[i].summary.rank = i + 1;
    }

    // Sort and assign ranks for Form 6
    form6Students.sort((a, b) => a.summary.bestThreePoints - b.summary.bestThreePoints);
    for (let i = 0; i < form6Students.length; i++) {
      form6Students[i].summary.rank = i + 1;
    }

    // Get all unique subjects across all students
    const uniqueSubjects = [];
    for (const student of demoStudents) {
      for (const subject of student.subjects) {
        if (!uniqueSubjects.some(s => s.code === subject.code)) {
          uniqueSubjects.push({
            code: subject.code,
            name: subject.name,
            isPrincipal: subject.isPrincipal
          });
        }
      }
    }

    // Sort subjects: principal subjects first, then subsidiary subjects
    uniqueSubjects.sort((a, b) => {
      // First sort by principal/subsidiary
      if (a.isPrincipal && !b.isPrincipal) return -1;
      if (!a.isPrincipal && b.isPrincipal) return 1;
      // Then sort alphabetically by code
      return a.code.localeCompare(b.code);
    });

    // Create class data
    const classData = {
      id: 'demo-class',
      name: 'A-Level Science',
      educationLevel: 'A_LEVEL',
      academicYear: '2023-2024',
      term: 'Term 2',
      students: demoStudents,
      subjects: uniqueSubjects,
      combinations: subjectCombinations
    };

    // Create exam data
    const examData = {
      id: 'demo-exam',
      name: 'Mid-Term Examination',
      startDate: '2023-10-15',
      endDate: '2023-10-25',
      term: 'Term 2',
      academicYear: '2023-2024'
    };

    return { classData, examData };
  }, []);

  // Fetch class and exam data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if this is a demo request
      if (classId === 'demo-class' && examId === 'demo-exam') {
        console.log('Generating demo data');
        const { classData, examData } = generateDemoData();
        setClassData(classData);
        setExamData(examData);
        setStudents(classData.students);
        setSubjects(classData.subjects);
        setCombinations(classData.combinations);
        setLoading(false);
        return;
      }

      // Fetch the class data
      const classUrl = `${process.env.REACT_APP_API_URL || ''}/api/classes/${classId}`;
      console.log('Fetching class data from:', classUrl);

      const classResponse = await axios.get(classUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const classData = classResponse.data;
      setClassData(classData);

      // Determine if this is Form 5 or Form 6 class
      const isForm5 = classData.name?.includes('5') || classData.form === 5 || classData.form === '5';
      const isForm6 = classData.name?.includes('6') || classData.form === 6 || classData.form === '6';

      // Ensure this is an A-Level class
      if (!classData.educationLevel || classData.educationLevel !== 'A_LEVEL') {
        throw new Error('This report is only for A-Level classes (Form 5 and Form 6)');
      }

      // Fetch the exam data
      const examUrl = `${process.env.REACT_APP_API_URL || ''}/api/exams/${examId}`;
      console.log('Fetching exam data from:', examUrl);

      const examResponse = await axios.get(examUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setExamData(examResponse.data);

      // Fetch students in this class
      const studentsUrl = `${process.env.REACT_APP_API_URL || ''}/api/students?class=${classId}`;
      console.log('Fetching students from:', studentsUrl);

      const studentsResponse = await axios.get(studentsUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Fetch results for each student
      const studentsWithResults = await Promise.all(
        studentsResponse.data.map(async (student) => {
          try {
            // Use the a-level-comprehensive endpoint which handles both principal and subsidiary subjects
            const resultsUrl = `${process.env.REACT_APP_API_URL || ''}/api/a-level-comprehensive/student/${student._id}/${examId}`;
            const resultsResponse = await axios.get(resultsUrl, {
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });

            const resultData = resultsResponse.data;

            // Combine principal and subsidiary subjects
            const allSubjects = [
              ...(resultData.principalSubjects || []).map(s => ({ ...s, isPrincipal: true })),
              ...(resultData.subsidiarySubjects || []).map(s => ({ ...s, isPrincipal: false }))
            ];

            return {
              ...student,
              subjects: allSubjects,
              summary: resultData.summary,
              form: student.form || (isForm5 ? 5 : isForm6 ? 6 : null)
            };
          } catch (error) {
            console.error(`Error fetching results for student ${student._id}:`, error);
            return {
              ...student,
              subjects: [],
              summary: {
                totalMarks: 0,
                averageMarks: 0,
                totalPoints: 0,
                bestThreePoints: 0,
                division: 'N/A',
                rank: 'N/A'
              },
              form: student.form || (isForm5 ? 5 : isForm6 ? 6 : null)
            };
          }
        })
      );

      setStudents(studentsWithResults);

      // Get all unique subjects across all students
      const uniqueSubjects = [];
      for (const student of studentsWithResults) {
        for (const subject of (student.subjects || [])) {
          if (!uniqueSubjects.some(s => s.code === subject.code)) {
            uniqueSubjects.push({
              code: subject.code,
              name: subject.subject || subject.name,
              isPrincipal: subject.isPrincipal
            });
          }
        }
      }

      // Sort subjects: principal subjects first, then subsidiary subjects
      uniqueSubjects.sort((a, b) => {
        // First sort by principal/subsidiary
        if (a.isPrincipal && !b.isPrincipal) return -1;
        if (!a.isPrincipal && b.isPrincipal) return 1;
        // Then sort alphabetically by code
        return a.code.localeCompare(b.code);
      });

      setSubjects(uniqueSubjects);

      // Get all unique combinations
      const uniqueCombinations = [];
      for (const student of studentsWithResults) {
        const combination = student.subjectCombination || student.combination;
        if (combination && !uniqueCombinations.some(c => c.code === combination)) {
          uniqueCombinations.push({
            code: combination,
            name: combination
          });
        }
      }

      setCombinations(uniqueCombinations);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [classId, examId, generateDemoData]);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter students by combination and form
  const filteredStudents = students.filter(student => {
    // Filter by combination if selected
    if (filterCombination && (student.combination || student.subjectCombination) !== filterCombination) {
      return false;
    }

    // Filter by form if selected
    if (filterForm && student.form !== Number.parseInt(filterForm, 10)) {
      return false;
    }

    return true;
  });

  // Handle combination filter change
  const handleCombinationFilterChange = (event) => {
    setFilterCombination(event.target.value);
  };

  // Handle form filter change
  const handleFormFilterChange = (event) => {
    setFilterForm(event.target.value);
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  // Download report as PDF
  const handleDownload = () => {
    // Open the PDF version in a new tab (backend will generate PDF)
    const pdfUrl = `${process.env.REACT_APP_API_URL || ''}/api/reports/class/${classId}/${examId}`;
    window.open(pdfUrl, '_blank');
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading class report...
        </Typography>
      </Box>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  // If no data, show empty state
  if (!classData || !examData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          No class or exam data available.
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box className="class-tabular-report-container">
      {/* Action Buttons - Hidden when printing */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }} className="no-print">
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print Report
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            Download PDF
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="combination-filter-label">Filter by Combination</InputLabel>
            <Select
              labelId="combination-filter-label"
              value={filterCombination}
              onChange={handleCombinationFilterChange}
              label="Filter by Combination"
            >
              <MenuItem value="">All Combinations</MenuItem>
              {combinations.map((combination) => (
                <MenuItem key={combination.code} value={combination.code}>
                  {combination.code} - {combination.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="form-filter-label">Filter by Form</InputLabel>
            <Select
              labelId="form-filter-label"
              value={filterForm}
              onChange={handleFormFilterChange}
              label="Filter by Form"
            >
              <MenuItem value="">All Forms</MenuItem>
              <MenuItem value="5">Form 5</MenuItem>
              <MenuItem value="6">Form 6</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Report Header */}
      <Box className="report-header">
        <Box className="header-left">
          <Typography variant="h6" className="school-name">
            AGAPE LUTHERAN JUNIOR SEMINARY
          </Typography>
          <Typography variant="body2" className="school-address">
            P.O. BOX 8882, MOSHI, KILIMANJARO
          </Typography>
          <Typography variant="body1" className="exam-info">
            {examData.name} - {examData.academicYear || classData.academicYear}
          </Typography>
        </Box>

        <Box className="header-center">
          <img
            src="/images/school-logo.png"
            alt="School Logo"
            className="school-logo"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/80?text=Logo';
            }}
          />
        </Box>

        <Box className="header-right">
          <Typography variant="body1" className="report-title">
            CLASS ACADEMIC REPORT
          </Typography>
          <Typography variant="body2" className="class-info">
            {classData.name}
          </Typography>
          <Typography variant="body2" className="term-info">
            {examData.term || classData.term}
          </Typography>
        </Box>
      </Box>

      {/* Class Summary */}
      <Box className="class-summary">
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Typography variant="body1">
              <strong>Total Students:</strong> {filteredStudents.length}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body1">
              <strong>Form:</strong> {filterForm ? `Form ${filterForm}` : 'All Forms'}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="body1">
              <strong>Combination:</strong> {filterCombination || 'All Combinations'}
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
              <TableCell className="student-header">STUDENT</TableCell>
              <TableCell className="info-header">SEX</TableCell>
              <TableCell className="info-header">POINTS</TableCell>
              <TableCell className="info-header">DIV</TableCell>
              {subjects.map((subject) => (
                <TableCell
                  key={subject.code}
                  align="center"
                  className={subject.isPrincipal ? "principal-subject" : "subsidiary-subject"}
                >
                  {subject.code}
                </TableCell>
              ))}
              <TableCell align="center" className="total-header">TOTAL</TableCell>
              <TableCell align="center" className="average-header">AVG</TableCell>
              <TableCell align="center" className="rank-header">RANK</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student) => (
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
                  {student.summary?.bestThreePoints || '-'}
                </TableCell>
                <TableCell align="center" className="division-cell">
                  {student.summary?.division || '-'}
                </TableCell>
                {subjects.map((subject) => {
                  const studentSubject = (student.subjects || []).find(s =>
                    (s.code === subject.code) || (s.subject?.includes(subject.name))
                  );
                  return (
                    <TableCell key={`${student.id || student._id}-${subject.code}`} align="center" className="subject-cell">
                      {studentSubject ? (
                        <div className="subject-data">
                          <div className="subject-marks">{studentSubject.marks}</div>
                          <div className="subject-grade">{studentSubject.grade}</div>
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
                  {student.summary?.totalMarks || '-'}
                </TableCell>
                <TableCell align="center" className="average-cell">
                  {student.summary?.averageMarks || '-'}
                </TableCell>
                <TableCell align="center" className="rank-cell">
                  {student.summary?.rank || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Division Summary */}
      <Box className="division-summary">
        <Typography variant="subtitle1" className="summary-title">
          Division Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={2}>
            <Paper className="division-count">
              <Typography variant="body1">
                <strong>Division I:</strong> {filteredStudents.filter(s => s.summary?.division === 'I').length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={2}>
            <Paper className="division-count">
              <Typography variant="body1">
                <strong>Division II:</strong> {filteredStudents.filter(s => s.summary?.division === 'II').length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={2}>
            <Paper className="division-count">
              <Typography variant="body1">
                <strong>Division III:</strong> {filteredStudents.filter(s => s.summary?.division === 'III').length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={2}>
            <Paper className="division-count">
              <Typography variant="body1">
                <strong>Division IV:</strong> {filteredStudents.filter(s => s.summary?.division === 'IV').length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={2}>
            <Paper className="division-count">
              <Typography variant="body1">
                <strong>Division V:</strong> {filteredStudents.filter(s => s.summary?.division === 'V').length}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={2}>
            <Paper className="division-count">
              <Typography variant="body1">
                <strong>Failed:</strong> {filteredStudents.filter(s => s.summary?.division === 'F').length}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Signature Section */}
      <Box className="signature-section">
        <Grid container spacing={4}>
          <Grid item xs={6}>
            <Box className="signature-box">
              <Typography variant="body1" className="signature-title">
                Class Teacher's Signature
              </Typography>
              <Box className="signature-line" />
              <Typography variant="body2" className="signature-name">
                Name: _______________________________
              </Typography>
              <Typography variant="body2" className="signature-date">
                Date: _______________________________
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box className="signature-box">
              <Typography variant="body1" className="signature-title">
                Principal's Signature
              </Typography>
              <Box className="signature-line" />
              <Typography variant="body2" className="signature-name">
                Name: _______________________________
              </Typography>
              <Typography variant="body2" className="signature-date">
                Date: _______________________________
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Footer */}
      <Box className="report-footer">
        <Typography variant="body2" className="footer-text">
          This report was issued without any erasure or alteration whatsoever.
        </Typography>
        <Typography variant="body2" className="school-motto">
          "Excellence Through Discipline and Hard Work"
        </Typography>
      </Box>
    </Box>
  );
};

// Define PropTypes for the component
ClassTabularReport.propTypes = {
  classId: PropTypes.string,
  examId: PropTypes.string
};

export default ClassTabularReport;
