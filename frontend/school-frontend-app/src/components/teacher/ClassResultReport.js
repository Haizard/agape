import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { Download as DownloadIcon, Print as PrintIcon } from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import api from '../../services/api';
import { useSelector } from 'react-redux';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import SafeDisplay from '../common/SafeDisplay';

const ClassResultReport = () => {
  // Get user from Redux store
  const user = useSelector(state => state.user?.user);
  console.log('Current user from Redux store:', user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [resultData, setResultData] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    // Always fetch these regardless of teacher profile
    fetchExamTypes();
    fetchAcademicYears();

    // If user is admin, fetch all classes immediately
    if (user && user.role === 'admin') {
      console.log('User is admin, fetching all classes...');
      fetchAllClasses();
    }

    // Fetch teacher profile to get teacher ID
    const fetchTeacherProfile = async () => {
      try {
        console.log('Fetching teacher profile...');
        const response = await api.get('/api/teachers/profile/me');
        console.log('Teacher profile response:', response.data);
        const teacherId = response.data._id;
        fetchTeacherClasses(teacherId);
      } catch (err) {
        console.error('Error fetching teacher profile:', err);
        let errorMessage = 'Failed to fetch teacher profile';

        if (err.response?.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (err.response?.status === 403) {
          errorMessage = 'You do not have permission to access this page.';
        } else if (err.response?.status === 404) {
          // Special handling for the case where the teacher profile doesn't exist
          errorMessage = err.response.data.message || 'Teacher profile not found';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }

        setError(errorMessage);
      }
    };

    // Only try to fetch teacher profile if user is a teacher
    if (!user || user.role === 'teacher') {
      fetchTeacherProfile();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchExams();
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassInfo();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedExam) {
      fetchResults();
    }
  }, [selectedClass, selectedExam]);

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/api/academic-years');
      setAcademicYears(response.data);

      // Set the active academic year as default
      const activeYear = response.data.find(year => year.isActive);
      if (activeYear) {
        setSelectedAcademicYear(activeYear._id);
      } else if (response.data.length > 0) {
        setSelectedAcademicYear(response.data[0]._id);
      }
    } catch (err) {
      setError('Failed to fetch academic years');
    }
  };

  const fetchExamTypes = async () => {
    try {
      const response = await api.get('/api/exam-types');
      setExams(response.data);
    } catch (err) {
      setError('Failed to fetch exam types');
    }
  };

  const fetchTeacherClasses = async (teacherId) => {
    try {
      const response = await api.get(`/api/teachers/${teacherId}/classes`);
      setTeacherClasses(response.data);
    } catch (err) {
      console.error('Error fetching teacher classes:', err);
      setError(err.response?.data?.message || 'Failed to fetch assigned classes');
    }
  };

  // For admins who don't have a teacher profile
  const fetchAllClasses = async () => {
    try {
      console.log('Fetching all classes for admin user...');
      const response = await api.get('/api/classes');
      console.log('All classes:', response.data);
      setTeacherClasses(response.data);
    } catch (err) {
      console.error('Error fetching all classes:', err);
      setError(err.response?.data?.message || 'Failed to fetch classes');
    }
  };

  const fetchExams = async () => {
    try {
      const response = await api.get('/api/exams', {
        params: { academicYearId: selectedAcademicYear }
      });
      setExams(response.data);
    } catch (err) {
      setError('Failed to fetch exams');
    }
  };

  const fetchClassInfo = async () => {
    try {
      const response = await api.get(`/api/classes/${selectedClass}`);
      setClassInfo(response.data);

      // Get subjects for this class
      if (response.data.subjects && response.data.subjects.length > 0) {
        const subjectIds = response.data.subjects.map(s => s.subject);
        const subjectsResponse = await api.get('/api/subjects', {
          params: { ids: subjectIds.join(',') }
        });
        setSubjects(subjectsResponse.data);
      }

      // Get students for this class
      const studentsResponse = await api.get(`/api/students/class/${selectedClass}`);
      setStudents(studentsResponse.data);
    } catch (err) {
      setError('Failed to fetch class information');
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.get(`/api/results/class/${selectedClass}`, {
        params: { examId: selectedExam }
      });

      // Process results to create a comprehensive report
      processResults(response.data);
    } catch (err) {
      setError('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const processResults = (results) => {
    if (!results || results.length === 0 || !students || students.length === 0 || !subjects || subjects.length === 0) {
      setResultData(null);
      return;
    }

    // Create a map of student results by subject
    const studentResults = {};

    // Initialize student results
    for (const student of students) {
      studentResults[student._id] = {
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        sex: student.gender || 'M', // Default to 'M' if gender is not available
        subjects: {},
        totalMarks: 0,
        averageMarks: 0,
        grade: '',
        division: '',
        points: 0,
        rank: 0
      };

      // Initialize subject marks to 0
      for (const subject of subjects) {
        studentResults[student._id].subjects[subject._id] = {
          subjectId: subject._id,
          subjectName: subject.name,
          subjectCode: subject.code,
          marks: 0,
          grade: 'F',
          present: false
        };
      }
    }

    // Fill in the actual results
    for (const result of results) {
      if (result.studentId && result.subjectId) {
        const studentId = typeof result.studentId === 'object' ? result.studentId._id : result.studentId;
        const subjectId = typeof result.subjectId === 'object' ? result.subjectId._id : result.subjectId;

        if (studentResults[studentId]?.subjects[subjectId]) {
          const subjectName = typeof result.subjectId === 'object' ? result.subjectId.name :
            subjects.find(s => s._id === subjectId)?.name || 'Unknown Subject';

          const subjectCode = typeof result.subjectId === 'object' ? result.subjectId.code :
            subjects.find(s => s._id === subjectId)?.code || 'N/A';

          studentResults[studentId].subjects[subjectId] = {
            subjectId: subjectId,
            subjectName: subjectName,
            subjectCode: subjectCode,
            marks: result.marksObtained || 0,
            grade: result.grade || calculateGrade(result.marksObtained),
            present: true
          };
        }
      }
    }

    // Calculate totals, averages, and grades for each student
    for (const student of Object.values(studentResults)) {
      const presentSubjects = Object.values(student.subjects).filter(s => s.present);
      const totalMarks = presentSubjects.reduce((sum, subject) => sum + subject.marks, 0);
      const averageMarks = presentSubjects.length > 0 ? totalMarks / presentSubjects.length : 0;

      student.totalMarks = totalMarks;
      student.averageMarks = averageMarks.toFixed(2);
      student.grade = calculateGrade(averageMarks);
      student.presentSubjectsCount = presentSubjects.length;

      // Calculate points for each subject (based on grades)
      const pointsMap = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'F': 5 };

      // Assign points to each subject
      for (const subject of Object.values(student.subjects)) {
        if (subject.present) {
          subject.points = pointsMap[subject.grade] || 5; // Default to 5 (F) if grade is not recognized
        }
      }

      // Select best seven subjects (lowest points = highest grades)
      const subjectsWithPoints = presentSubjects
        .map(subject => ({
          subjectId: subject.subjectId,
          points: subject.points
        }))
        .sort((a, b) => a.points - b.points); // Sort by points ascending

      // Take the best 7 subjects or all if less than 7
      const bestSevenSubjects = subjectsWithPoints.slice(0, 7);

      // Calculate total points from best seven subjects
      const totalPoints = bestSevenSubjects.reduce((sum, subject) => sum + subject.points, 0);
      student.points = totalPoints;

      // Determine division based on total points from best seven subjects
      if (totalPoints >= 7 && totalPoints <= 14) {
        student.division = 'I';
      } else if (totalPoints >= 15 && totalPoints <= 21) {
        student.division = 'II';
      } else if (totalPoints >= 22 && totalPoints <= 25) {
        student.division = 'III';
      } else if (totalPoints >= 26 && totalPoints <= 32) {
        student.division = 'IV';
      } else {
        student.division = '0'; // Fail
      }
    }

    // Calculate ranks
    const studentArray = Object.values(studentResults);
    studentArray.sort((a, b) => b.averageMarks - a.averageMarks);

    for (let index = 0; index < studentArray.length; index++) {
      studentArray[index].rank = index + 1;
    }

    // Calculate subject statistics
    const subjectStats = {};
    for (const subject of subjects) {
      const subjectResults = Object.values(studentResults)
        .map(student => student.subjects[subject._id])
        .filter(result => result?.present);

      const totalMarks = subjectResults.reduce((sum, result) => sum + result.marks, 0);
      const averageMarks = subjectResults.length > 0 ? totalMarks / subjectResults.length : 0;

      // Count grades
      const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      for (const result of subjectResults) {
        if (grades[result.grade] !== undefined) {
          grades[result.grade]++;
        }
      }

      // Calculate GPA (weighted average of grade points)
      const gradePoints = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'F': 5 };
      const totalPoints = subjectResults.reduce((sum, result) =>
        sum + (gradePoints[result.grade] || 0), 0);
      const gpa = subjectResults.length > 0 ?
        (totalPoints / subjectResults.length).toFixed(4) : '---';

      subjectStats[subject._id] = {
        subjectId: subject._id,
        subjectName: subject.name,
        subjectCode: subject.code,
        totalStudents: subjectResults.length,
        averageMarks: averageMarks.toFixed(2),
        highestMarks: Math.max(...subjectResults.map(r => r.marks), 0),
        lowestMarks: Math.min(...subjectResults.map(r => r.marks), 0),
        grades: grades,
        gpa: gpa
      };
    }

    // Set the processed result data
    setResultData({
      students: studentArray,
      subjects: subjects,
      subjectStats: Object.values(subjectStats),
      classAverage: studentArray.reduce((sum, student) => sum + Number.parseFloat(student.averageMarks), 0) / studentArray.length,
      totalStudents: studentArray.length,
      examName: exams.find(e => e._id === selectedExam)?.name || 'Unknown Exam',
      className: classInfo?.name || 'Unknown Class',
      section: classInfo?.section || '',
      academicYear: academicYears.find(y => y._id === selectedAcademicYear)?.year || 'Unknown Year'
    });
  };

  const calculateGrade = (marks) => {
    if (!marks && marks !== 0) return '-';
    if (marks >= 75) return 'A';
    if (marks >= 65) return 'B';
    if (marks >= 45) return 'C';
    if (marks >= 30) return 'D';
    return 'F';
  };

  // Helper function to explain division calculation
  const getDivisionExplanation = (points) => {
    if (points >= 7 && points <= 14) return 'Division I (7-14 points)';
    if (points >= 15 && points <= 21) return 'Division II (15-21 points)';
    if (points >= 22 && points <= 25) return 'Division III (22-25 points)';
    if (points >= 26 && points <= 32) return 'Division IV (26-32 points)';
    return 'Division 0 (Fail)';
  };

  const generatePDF = () => {
    if (!resultData) return;
    setSuccess('PDF report generated successfully');

    const doc = new jsPDF('landscape');

    // Add title
    doc.setFontSize(16);
    doc.text(`${resultData.className} ${resultData.section} - ${resultData.examName} Results`, 14, 15);
    doc.setFontSize(12);
    doc.text(`Academic Year: ${resultData.academicYear}`, 14, 22);

    // Add student results table
    const tableHeaders = [
      ['#', 'Roll No', 'Student Name', ...resultData.subjects.map(s => s.name), 'Total', 'Average', 'Grade', 'Rank']
    ];

    const tableData = resultData.students.map((student, index) => [
      index + 1,
      student.rollNumber,
      student.studentName,
      ...resultData.subjects.map(subject => {
        const subjectResult = student.subjects[subject._id];
        return subjectResult?.present ? `${subjectResult.marks} (${subjectResult.grade})` : '-';
      }),
      student.totalMarks,
      student.averageMarks,
      student.grade,
      student.rank
    ]);

    doc.autoTable({
      head: tableHeaders,
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 10 }, // #
        1: { cellWidth: 20 }, // Roll No
        2: { cellWidth: 40 }, // Name
      }
    });

    // Add subject statistics
    doc.addPage();
    doc.text('Subject Statistics', 14, 15);

    const subjectStatsHeaders = [
      ['Subject', 'Code', 'Students', 'Average', 'Highest', 'Lowest', 'A', 'B', 'C', 'D', 'F']
    ];

    const subjectStatsData = resultData.subjectStats.map(stat => [
      stat.subjectName,
      stat.subjectCode,
      stat.totalStudents,
      stat.averageMarks,
      stat.highestMarks,
      stat.lowestMarks,
      stat.grades.A,
      stat.grades.B,
      stat.grades.C,
      stat.grades.D,
      stat.grades.F
    ]);

    doc.autoTable({
      head: subjectStatsHeaders,
      body: subjectStatsData,
      startY: 25,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    });

    // Add division explanation
    doc.text('Division Calculation Guide', 14, doc.autoTable.previous.finalY + 15);

    const divisionGuide = [
      ['Division I', '7-14 points'],
      ['Division II', '15-21 points'],
      ['Division III', '22-25 points'],
      ['Division IV', '26-32 points'],
      ['Division 0', '33+ points (Fail)']
    ];

    doc.autoTable({
      body: divisionGuide,
      startY: doc.autoTable.previous.finalY + 20,
      theme: 'grid',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold' }
      }
    });

    // Add class summary
    doc.text('Class Summary', 14, doc.autoTable.previous.finalY + 15);

    const summaryData = [
      ['Total Students', resultData.totalStudents],
      ['Class Average', resultData.classAverage.toFixed(2)],
      ['Exam', resultData.examName],
      ['Academic Year', resultData.academicYear],
      ['Note', 'Division is calculated based on best 7 subjects']
    ];

    doc.autoTable({
      body: summaryData,
      startY: doc.autoTable.previous.finalY + 20,
      theme: 'grid',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold' }
      }
    });

    // Save the PDF
    doc.save(`${resultData.className}_${resultData.section}_${resultData.examName}_Results.pdf`);
  };

  const generateExcel = () => {
    if (!resultData) return;
    setSuccess('Excel report generated successfully');

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create student results worksheet
    const studentHeaders = [
      'Roll No',
      'Student Name',
      ...resultData.subjects.map(s => s.name),
      'Total',
      'Average',
      'Grade',
      'Rank'
    ];

    const studentData = resultData.students.map(student => [
      student.rollNumber,
      student.studentName,
      ...resultData.subjects.map(subject => {
        const subjectResult = student.subjects[subject._id];
        return subjectResult?.present ? subjectResult.marks : '';
      }),
      student.totalMarks,
      student.averageMarks,
      student.grade,
      student.rank
    ]);

    const studentWs = XLSX.utils.aoa_to_sheet([studentHeaders, ...studentData]);
    XLSX.utils.book_append_sheet(wb, studentWs, 'Student Results');

    // Create subject statistics worksheet
    const subjectStatsHeaders = [
      'Subject', 'Code', 'Students', 'Average', 'Highest', 'Lowest', 'A', 'B', 'C', 'D', 'F'
    ];

    const subjectStatsData = resultData.subjectStats.map(stat => [
      stat.subjectName,
      stat.subjectCode,
      stat.totalStudents,
      stat.averageMarks,
      stat.highestMarks,
      stat.lowestMarks,
      stat.grades.A,
      stat.grades.B,
      stat.grades.C,
      stat.grades.D,
      stat.grades.F
    ]);

    const statsWs = XLSX.utils.aoa_to_sheet([subjectStatsHeaders, ...subjectStatsData]);
    XLSX.utils.book_append_sheet(wb, statsWs, 'Subject Statistics');

    // Create division guide worksheet
    const divisionGuide = [
      ['Division Calculation Guide', ''],
      ['Division I', '7-14 points'],
      ['Division II', '15-21 points'],
      ['Division III', '22-25 points'],
      ['Division IV', '26-32 points'],
      ['Division 0', '33+ points (Fail)'],
      ['Note', 'Division is calculated based on best 7 subjects']
    ];

    const divisionWs = XLSX.utils.aoa_to_sheet(divisionGuide);
    XLSX.utils.book_append_sheet(wb, divisionWs, 'Division Guide');

    // Create summary worksheet
    const summaryData = [
      ['Class', `${resultData.className} ${resultData.section}`],
      ['Exam', resultData.examName],
      ['Academic Year', resultData.academicYear],
      ['Total Students', resultData.totalStudents],
      ['Class Average', resultData.classAverage.toFixed(2)]
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Generate Excel file
    XLSX.writeFile(wb, `${resultData.className}_${resultData.section}_${resultData.examName}_Results.xlsx`);
  };

  const printReport = () => {
    window.print();
    setSuccess('Report sent to printer');
  };

  return (
    <Box sx={{ p: 3 }} className="class-result-report">
      <Typography variant="h5" gutterBottom>Class Result Report</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Academic Year</InputLabel>
            <Select
              value={selectedAcademicYear}
              label="Academic Year"
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
            >
              {academicYears.map((year) => (
                <MenuItem key={year._id} value={year._id}>
                  {year.year} {year.isActive && '(Active)'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Class</InputLabel>
            <Select
              value={selectedClass}
              label="Class"
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={teacherClasses.length === 0}
            >
              {teacherClasses.map((cls) => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.name} {cls.section}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Exam</InputLabel>
            <Select
              value={selectedExam}
              label="Exam"
              onChange={(e) => setSelectedExam(e.target.value)}
              disabled={!selectedClass || exams.length === 0}
            >
              {exams.map((exam) => (
                <MenuItem key={exam._id} value={exam._id}>
                  {exam.name} ({exam.type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={fetchResults}
            disabled={!selectedClass || !selectedExam}
            sx={{ height: 40, alignSelf: 'center' }}
          >
            Generate Report
          </Button>
        </Box>

        {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          {error.includes('Teacher profile not found') && user && user.role === 'admin' && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              As an admin, you can still generate reports for any class. Please select from the dropdowns below.
            </Typography>
          )}
          {error.includes('Teacher profile not found') && user && user.role === 'teacher' && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Your user account is not linked to a teacher profile. Please contact the administrator to set up your teacher profile.
            </Typography>
          )}
        </Alert>
      )}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : resultData ? (
          <Box className="report-content" sx={{ mt: 2 }}>
            {/* Report Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h5" gutterBottom>
                <SafeDisplay value={resultData.className} /> <SafeDisplay value={resultData.section} /> - <SafeDisplay value={resultData.examName} /> Results
              </Typography>
              <Typography variant="subtitle1">
                Academic Year: <SafeDisplay value={resultData.academicYear} />
              </Typography>
            </Box>

            {/* Export Buttons */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={generatePDF}
              >
                Export as PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={generateExcel}
              >
                Export as Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={printReport}
              >
                Print
              </Button>
            </Box>

            {/* Class Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Total Students</Typography>
                    <Typography variant="h4"><SafeDisplay value={resultData.totalStudents} /></Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Class Average</Typography>
                    <Typography variant="h4"><SafeDisplay value={`${resultData.classAverage.toFixed(2)}%`} /></Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Highest Average</Typography>
                    <Typography variant="h4">
                      <SafeDisplay value={`${resultData.students.length > 0 ? resultData.students[0].averageMarks : 'N/A'}%`} />
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Subjects</Typography>
                    <Typography variant="h4"><SafeDisplay value={resultData.subjects.length} /></Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Student Results Table */}
            <Typography variant="h6" gutterBottom>Student Results</Typography>
            <TableContainer component={Paper} sx={{ mb: 4, maxHeight: 400, overflow: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>STUDENT NAME</TableCell>
                    <TableCell>SEX</TableCell>
                    {resultData.subjects.map(subject => (
                      <TableCell key={subject._id} colSpan={2} align="center"><SafeDisplay value={subject.name} /></TableCell>
                    ))}
                    <TableCell align="center">TOTAL</TableCell>
                    <TableCell align="center">AVG</TableCell>
                    <TableCell align="center">DIV</TableCell>
                    <TableCell align="center">POINTS</TableCell>
                    <TableCell align="center">POS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultData.students.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell><SafeDisplay value={student.rank} /></TableCell>
                      <TableCell><SafeDisplay value={student.studentName} /></TableCell>
                      <TableCell><SafeDisplay value={student.sex} /></TableCell>
                      {resultData.subjects.map(subject => {
                        const subjectResult = student.subjects[subject._id];
                        return (
                          <React.Fragment key={subject._id}>
                            <TableCell align="center">
                              <SafeDisplay value={subjectResult?.present ? subjectResult.marks : '-'} />
                            </TableCell>
                            <TableCell align="center">
                              <SafeDisplay value={subjectResult?.present ? subjectResult.grade : '-'} />
                            </TableCell>
                          </React.Fragment>
                        );
                      })}
                      <TableCell align="center"><SafeDisplay value={student.totalMarks} /></TableCell>
                      <TableCell align="center"><SafeDisplay value={student.averageMarks} /></TableCell>
                      <TableCell align="center">
                        <SafeDisplay value={student.division} />
                        <Typography variant="caption" display="block">
                          <SafeDisplay value={getDivisionExplanation(student.points)} />
                        </Typography>
                      </TableCell>
                      <TableCell align="center"><SafeDisplay value={student.points} /></TableCell>
                      <TableCell align="center"><SafeDisplay value={student.rank} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Division Explanation */}
            <Typography variant="h6" gutterBottom>DIVISION CALCULATION</Typography>
            <Box sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
              <Typography variant="body2" gutterBottom>Division is calculated based on the best 7 subjects:</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2">Division I: 7-14 points</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2">Division II: 15-21 points</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2">Division III: 22-25 points</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2">Division IV: 26-32 points</Typography>
                </Grid>
              </Grid>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Points: A=1, B=2, C=3, D=4, F=5 (Lower points = better performance)
              </Typography>
            </Box>

            {/* Results Summary */}
            <Typography variant="h6" gutterBottom>RESULTS SUMMARY</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>SUBJECT NAME</TableCell>
                    <TableCell align="center">NO OF STUDENTS</TableCell>
                    <TableCell align="center">A</TableCell>
                    <TableCell align="center">B</TableCell>
                    <TableCell align="center">C</TableCell>
                    <TableCell align="center">D</TableCell>
                    <TableCell align="center">F</TableCell>
                    <TableCell align="center">GPA</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultData.subjectStats.map((stat, index) => (
                    <TableRow key={stat.subjectId}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{stat.subjectName}</TableCell>
                      <TableCell align="center">{stat.totalStudents}</TableCell>
                      <TableCell align="center">{stat.grades.A}</TableCell>
                      <TableCell align="center">{stat.grades.B}</TableCell>
                      <TableCell align="center">{stat.grades.C}</TableCell>
                      <TableCell align="center">{stat.grades.D}</TableCell>
                      <TableCell align="center">{stat.grades.F}</TableCell>
                      <TableCell align="center">{stat.gpa}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Approval Section */}
            <Box sx={{ mt: 4, p: 2, border: '1px solid #ddd' }}>
              <Typography variant="h6" gutterBottom>APPROVED BY</Typography>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={3}>
                  <Typography>1. ACADEMIC TEACHER</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>NAME: ___________________________</Typography>
                  <Typography sx={{ mt: 2 }}>SIGN: ___________________________</Typography>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 4 }}>
                <Grid item xs={3}>
                  <Typography>2. HEAD OF SCHOOL</Typography>
                </Grid>
                <Grid item xs={9}>
                  <Typography>NAME: ___________________________</Typography>
                  <Typography sx={{ mt: 2 }}>SIGN: ___________________________</Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        ) : (
          <Alert severity="info">
            Select a class and exam, then click "Generate Report" to view results.
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default ClassResultReport;
