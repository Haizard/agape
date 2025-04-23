import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tabs,
  Tab
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import axios from 'axios';

/**
 * PrismaTest Component
 *
 * This component allows testing the Prisma implementation by providing
 * interfaces to test different Prisma-based API endpoints.
 */
const PrismaTest = () => {
  // State for API health check
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // State for O-Level marks check
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [marksData, setMarksData] = useState(null);
  const [marksLoading, setMarksLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for Exam Management
  const [activeTab, setActiveTab] = useState(0);
  const [academicYears, setAcademicYears] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [examName, setExamName] = useState('');
  const [examTerm, setExamTerm] = useState('');
  const [examStartDate, setExamStartDate] = useState(null);
  const [examEndDate, setExamEndDate] = useState(null);
  const [examStatus, setExamStatus] = useState('DRAFT');
  const [examsList, setExamsList] = useState([]);
  const [examLoading, setExamLoading] = useState(false);
  const [examError, setExamError] = useState(null);
  const [selectedExamForEdit, setSelectedExamForEdit] = useState(null);

  // State for Results Management
  const [resultsActiveTab, setResultsActiveTab] = useState(0);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedExamForResults, setSelectedExamForResults] = useState('');
  const [selectedClassForResults, setSelectedClassForResults] = useState('');
  const [selectedSubjectForResults, setSelectedSubjectForResults] = useState('');
  const [marks, setMarks] = useState('');
  const [comments, setComments] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [classResults, setClassResults] = useState([]);
  const [subjectResults, setSubjectResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);

  // State for Attendance Management
  const [attendanceActiveTab, setAttendanceActiveTab] = useState(0);
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState('');
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [attendanceStatus, setAttendanceStatus] = useState('PRESENT');
  const [attendanceReason, setAttendanceReason] = useState('');
  const [attendanceStartDate, setAttendanceStartDate] = useState(new Date());
  const [attendanceEndDate, setAttendanceEndDate] = useState(new Date());
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [classAttendance, setClassAttendance] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);

  // State for Timetable Management
  const [timetableActiveTab, setTimetableActiveTab] = useState(0);
  const [terms, setTerms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClassForTimetable, setSelectedClassForTimetable] = useState('');
  const [selectedAcademicYearForTimetable, setSelectedAcademicYearForTimetable] = useState('');
  const [selectedTermForTimetable, setSelectedTermForTimetable] = useState('');
  const [selectedTeacherForTimetable, setSelectedTeacherForTimetable] = useState('');
  const [timetableName, setTimetableName] = useState('');
  const [timetableDescription, setTimetableDescription] = useState('');
  const [timetableIsActive, setTimetableIsActive] = useState(false);
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [timetableDetails, setTimetableDetails] = useState(null);
  const [teacherTimetable, setTeacherTimetable] = useState(null);
  const [sessionSubject, setSessionSubject] = useState('');
  const [sessionTeacher, setSessionTeacher] = useState('');
  const [sessionDay, setSessionDay] = useState('MONDAY');
  const [sessionStartTime, setSessionStartTime] = useState('08:00');
  const [sessionEndTime, setSessionEndTime] = useState('09:00');
  const [sessionRoom, setSessionRoom] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [timetableError, setTimetableError] = useState(null);

  // Fetch health status on component mount
  useEffect(() => {
    checkHealthStatus();
    fetchClasses();
    fetchExams();
    fetchAcademicYears();
    fetchExamTypes();
    fetchStudents();
    fetchTerms();
    fetchRooms();
    fetchTeachers();
  }, []);

  // Fetch subjects when class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchSubjects(selectedClass);
    } else {
      setSubjects([]);
    }
  }, [selectedClass]);

  // Check Prisma API health status
  const checkHealthStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/prisma/health');
      setHealthStatus(response.data);
    } catch (error) {
      console.error('Error checking health status:', error);
      setHealthStatus({ status: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Fetch classes
  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/classes');
      setClasses(response.data.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setError('Failed to fetch classes');
    }
  };

  // Fetch subjects for a class
  const fetchSubjects = async (classId) => {
    try {
      const response = await axios.get(`/api/classes/${classId}/subjects`);
      setSubjects(response.data.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Failed to fetch subjects');
    }
  };

  // Fetch exams
  const fetchExams = async () => {
    try {
      const response = await axios.get('/api/exams');
      setExams(response.data.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('Failed to fetch exams');
    }
  };

  // Check marks for selected class, subject, and exam
  const checkMarks = async () => {
    if (!selectedClass || !selectedSubject || !selectedExam) {
      setError('Please select class, subject, and exam');
      return;
    }

    setMarksLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/prisma/o-level/marks/check', {
        classId: selectedClass,
        subjectId: selectedSubject,
        examId: selectedExam
      });

      setMarksData(response.data.data);
    } catch (error) {
      console.error('Error checking marks:', error);
      setError(error.response?.data?.message || 'Failed to check marks');
    } finally {
      setMarksLoading(false);
    }
  };

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const response = await axios.get('/api/academic-years');
      setAcademicYears(response.data.data);
    } catch (error) {
      console.error('Error fetching academic years:', error);
      setExamError('Failed to fetch academic years');
    }
  };

  // Fetch exam types
  const fetchExamTypes = async () => {
    try {
      const response = await axios.get('/api/exam-types');
      setExamTypes(response.data.data);
    } catch (error) {
      console.error('Error fetching exam types:', error);
      setExamError('Failed to fetch exam types');
    }
  };

  // Fetch exams by academic year
  const fetchExamsByAcademicYear = async (academicYearId) => {
    if (!academicYearId) return;

    setExamLoading(true);
    setExamError(null);

    try {
      const response = await axios.get(`/api/prisma/exams/academic-year/${academicYearId}`);
      setExamsList(response.data.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
      setExamError(error.response?.data?.message || 'Failed to fetch exams');
    } finally {
      setExamLoading(false);
    }
  };

  // Create a new exam
  const createExam = async () => {
    if (!selectedAcademicYear || !selectedExamType || !examName || !examTerm) {
      setExamError('Please fill in all required fields');
      return;
    }

    setExamLoading(true);
    setExamError(null);

    try {
      const examData = {
        name: examName,
        type: 'REGULAR', // Default type
        examTypeId: selectedExamType,
        academicYearId: selectedAcademicYear,
        term: examTerm,
        startDate: examStartDate,
        endDate: examEndDate,
        status: examStatus
      };

      const response = await axios.post('/api/prisma/exams', examData);

      // Reset form
      setExamName('');
      setExamTerm('');
      setExamStartDate(null);
      setExamEndDate(null);
      setExamStatus('DRAFT');

      // Refresh exams list
      fetchExamsByAcademicYear(selectedAcademicYear);

      alert('Exam created successfully!');
    } catch (error) {
      console.error('Error creating exam:', error);
      setExamError(error.response?.data?.message || 'Failed to create exam');
    } finally {
      setExamLoading(false);
    }
  };

  // Update an existing exam
  const updateExam = async () => {
    if (!selectedExamForEdit) {
      setExamError('No exam selected for editing');
      return;
    }

    setExamLoading(true);
    setExamError(null);

    try {
      const examData = {
        name: examName,
        type: 'REGULAR', // Default type
        examTypeId: selectedExamType,
        academicYearId: selectedAcademicYear,
        term: examTerm,
        startDate: examStartDate,
        endDate: examEndDate,
        status: examStatus
      };

      const response = await axios.put(`/api/prisma/exams/${selectedExamForEdit}`, examData);

      // Reset form
      setSelectedExamForEdit(null);
      setExamName('');
      setExamTerm('');
      setExamStartDate(null);
      setExamEndDate(null);
      setExamStatus('DRAFT');

      // Refresh exams list
      fetchExamsByAcademicYear(selectedAcademicYear);

      alert('Exam updated successfully!');
    } catch (error) {
      console.error('Error updating exam:', error);
      setExamError(error.response?.data?.message || 'Failed to update exam');
    } finally {
      setExamLoading(false);
    }
  };

  // Delete an exam
  const deleteExam = async (examId) => {
    if (!examId) return;

    if (!window.confirm('Are you sure you want to delete this exam?')) {
      return;
    }

    setExamLoading(true);
    setExamError(null);

    try {
      const response = await axios.delete(`/api/prisma/exams/${examId}`);

      // Refresh exams list
      fetchExamsByAcademicYear(selectedAcademicYear);

      alert('Exam deleted successfully!');
    } catch (error) {
      console.error('Error deleting exam:', error);
      setExamError(error.response?.data?.message || 'Failed to delete exam');
    } finally {
      setExamLoading(false);
    }
  };

  // Load exam for editing
  const loadExamForEdit = async (examId) => {
    if (!examId) return;

    setExamLoading(true);
    setExamError(null);

    try {
      const response = await axios.get(`/api/prisma/exams/${examId}`);
      const exam = response.data.data;

      setSelectedExamForEdit(examId);
      setExamName(exam.name);
      setSelectedExamType(exam.examTypeId);
      setSelectedAcademicYear(exam.academicYearId);
      setExamTerm(exam.term);
      setExamStartDate(exam.startDate ? new Date(exam.startDate) : null);
      setExamEndDate(exam.endDate ? new Date(exam.endDate) : null);
      setExamStatus(exam.status);

      // Switch to create/edit tab
      setActiveTab(0);
    } catch (error) {
      console.error('Error loading exam:', error);
      setExamError(error.response?.data?.message || 'Failed to load exam');
    } finally {
      setExamLoading(false);
    }
  };

  // Handle academic year change
  const handleAcademicYearChange = (event) => {
    const academicYearId = event.target.value;
    setSelectedAcademicYear(academicYearId);
    fetchExamsByAcademicYear(academicYearId);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle results tab change
  const handleResultsTabChange = (event, newValue) => {
    setResultsActiveTab(newValue);
  };

  // Fetch students
  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students');
      setStudents(response.data.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setResultsError('Failed to fetch students');
    }
  };

  // Save a result
  const saveResult = async () => {
    if (!selectedStudent || !selectedExamForResults || !selectedSubjectForResults || !marks) {
      setResultsError('Please fill in all required fields');
      return;
    }

    setResultsLoading(true);
    setResultsError(null);

    try {
      const resultData = {
        studentId: selectedStudent,
        examId: selectedExamForResults,
        subjectId: selectedSubjectForResults,
        marks: Number(marks),
        comments
      };

      const response = await axios.post('/api/prisma/results', resultData);

      // Reset form
      setMarks('');
      setComments('');

      alert('Result saved successfully!');

      // Refresh student results if the same student is selected
      if (selectedStudent) {
        fetchStudentResults(selectedStudent, selectedExamForResults);
      }
    } catch (error) {
      console.error('Error saving result:', error);
      setResultsError(error.response?.data?.message || 'Failed to save result');
    } finally {
      setResultsLoading(false);
    }
  };

  // Fetch student results
  const fetchStudentResults = async (studentId, examId) => {
    if (!studentId) {
      setResultsError('Please select a student');
      return;
    }

    setResultsLoading(true);
    setResultsError(null);

    try {
      const url = `/api/prisma/results/student/${studentId}${examId ? `?examId=${examId}` : ''}`;
      const response = await axios.get(url);

      setStudentResults(response.data.data);
    } catch (error) {
      console.error('Error fetching student results:', error);
      setResultsError(error.response?.data?.message || 'Failed to fetch student results');
    } finally {
      setResultsLoading(false);
    }
  };

  // Fetch class results
  const fetchClassResults = async () => {
    if (!selectedClassForResults || !selectedExamForResults) {
      setResultsError('Please select a class and exam');
      return;
    }

    setResultsLoading(true);
    setResultsError(null);

    try {
      const response = await axios.get(`/api/prisma/results/class/${selectedClassForResults}/exam/${selectedExamForResults}`);

      setClassResults(response.data.data);
    } catch (error) {
      console.error('Error fetching class results:', error);
      setResultsError(error.response?.data?.message || 'Failed to fetch class results');
    } finally {
      setResultsLoading(false);
    }
  };

  // Fetch subject results
  const fetchSubjectResults = async () => {
    if (!selectedClassForResults || !selectedExamForResults || !selectedSubjectForResults) {
      setResultsError('Please select a class, exam, and subject');
      return;
    }

    setResultsLoading(true);
    setResultsError(null);

    try {
      const response = await axios.get(`/api/prisma/results/subject/${selectedSubjectForResults}/class/${selectedClassForResults}/exam/${selectedExamForResults}`);

      setSubjectResults(response.data.data);
    } catch (error) {
      console.error('Error fetching subject results:', error);
      setResultsError(error.response?.data?.message || 'Failed to fetch subject results');
    } finally {
      setResultsLoading(false);
    }
  };

  // Calculate O-Level division
  const calculateOLevelDivision = async () => {
    if (!selectedStudent || !selectedExamForResults) {
      setResultsError('Please select a student and exam');
      return;
    }

    setResultsLoading(true);
    setResultsError(null);

    try {
      const response = await axios.get(`/api/prisma/results/o-level/division/student/${selectedStudent}/exam/${selectedExamForResults}`);

      const divisionData = response.data.data;

      alert(`Student Division: ${divisionData.division}\nTotal Points: ${divisionData.totalPoints}\nSubjects: ${divisionData.subjects.length}`);
    } catch (error) {
      console.error('Error calculating O-Level division:', error);
      setResultsError(error.response?.data?.message || 'Failed to calculate O-Level division');
    } finally {
      setResultsLoading(false);
    }
  };

  // Handle attendance tab change
  const handleAttendanceTabChange = (event, newValue) => {
    setAttendanceActiveTab(newValue);
  };

  // Record attendance for a student
  const recordAttendance = async () => {
    if (!selectedStudentForAttendance || !attendanceDate || !attendanceStatus) {
      setAttendanceError('Please fill in all required fields');
      return;
    }

    setAttendanceLoading(true);
    setAttendanceError(null);

    try {
      const attendanceData = {
        studentId: selectedStudentForAttendance,
        date: attendanceDate.toISOString(),
        status: attendanceStatus,
        reason: attendanceReason,
        classId: selectedClassForAttendance
      };

      const response = await axios.post('/api/prisma/attendance', attendanceData);

      // Reset form
      setAttendanceReason('');

      alert('Attendance recorded successfully!');

      // Refresh student attendance if the same student is selected
      if (selectedStudentForAttendance) {
        fetchStudentAttendance(selectedStudentForAttendance);
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
      setAttendanceError(error.response?.data?.message || 'Failed to record attendance');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Fetch student attendance
  const fetchStudentAttendance = async (studentId) => {
    if (!studentId) {
      setAttendanceError('Please select a student');
      return;
    }

    setAttendanceLoading(true);
    setAttendanceError(null);

    try {
      const startDate = attendanceStartDate ? attendanceStartDate.toISOString().split('T')[0] : '';
      const endDate = attendanceEndDate ? attendanceEndDate.toISOString().split('T')[0] : '';

      const url = `/api/prisma/attendance/student/${studentId}?startDate=${startDate}&endDate=${endDate}`;
      const response = await axios.get(url);

      setStudentAttendance(response.data.data);
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      setAttendanceError(error.response?.data?.message || 'Failed to fetch student attendance');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Fetch class attendance
  const fetchClassAttendance = async () => {
    if (!selectedClassForAttendance || !attendanceDate) {
      setAttendanceError('Please select a class and date');
      return;
    }

    setAttendanceLoading(true);
    setAttendanceError(null);

    try {
      const formattedDate = attendanceDate.toISOString().split('T')[0];
      const response = await axios.get(`/api/prisma/attendance/class/${selectedClassForAttendance}/date/${formattedDate}`);

      setClassAttendance(response.data.data);
    } catch (error) {
      console.error('Error fetching class attendance:', error);
      setAttendanceError(error.response?.data?.message || 'Failed to fetch class attendance');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Fetch class attendance summary
  const fetchClassAttendanceSummary = async () => {
    if (!selectedClassForAttendance || !attendanceStartDate || !attendanceEndDate) {
      setAttendanceError('Please select a class and date range');
      return;
    }

    setAttendanceLoading(true);
    setAttendanceError(null);

    try {
      const startDate = attendanceStartDate.toISOString().split('T')[0];
      const endDate = attendanceEndDate.toISOString().split('T')[0];

      const response = await axios.get(`/api/prisma/attendance/class/${selectedClassForAttendance}/summary?startDate=${startDate}&endDate=${endDate}`);

      setAttendanceSummary(response.data.data);
    } catch (error) {
      console.error('Error fetching class attendance summary:', error);
      setAttendanceError(error.response?.data?.message || 'Failed to fetch class attendance summary');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Record bulk attendance
  const recordBulkAttendance = async () => {
    if (!selectedClassForAttendance || !attendanceDate || !classAttendance) {
      setAttendanceError('Please fetch class attendance first');
      return;
    }

    setAttendanceLoading(true);
    setAttendanceError(null);

    try {
      // Prepare attendance records for all students in the class
      const attendanceRecords = classAttendance.students.map(student => ({
        studentId: student.id,
        date: attendanceDate.toISOString(),
        status: student.attendance?.status || 'PRESENT', // Default to present if no status is set
        reason: student.attendance?.reason || '',
        classId: selectedClassForAttendance
      }));

      const response = await axios.post('/api/prisma/attendance/bulk', {
        attendanceRecords
      });

      alert(`Attendance recorded for ${response.data.data.results.length} students!`);

      // Refresh class attendance
      fetchClassAttendance();
    } catch (error) {
      console.error('Error recording bulk attendance:', error);
      setAttendanceError(error.response?.data?.message || 'Failed to record bulk attendance');
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Handle timetable tab change
  const handleTimetableTabChange = (event, newValue) => {
    setTimetableActiveTab(newValue);
  };

  // Fetch terms
  const fetchTerms = async () => {
    try {
      const response = await axios.get('/api/terms');
      setTerms(response.data.data);
    } catch (error) {
      console.error('Error fetching terms:', error);
      setTimetableError('Failed to fetch terms');
    }
  };

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms');
      setRooms(response.data.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setTimetableError('Failed to fetch rooms');
    }
  };

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      const response = await axios.get('/api/teachers');
      setTeachers(response.data.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTimetableError('Failed to fetch teachers');
    }
  };

  // Create a new timetable
  const createTimetable = async () => {
    if (!timetableName || !selectedClassForTimetable || !selectedAcademicYearForTimetable || !selectedTermForTimetable) {
      setTimetableError('Please fill in all required fields');
      return;
    }

    setTimetableLoading(true);
    setTimetableError(null);

    try {
      const timetableData = {
        name: timetableName,
        description: timetableDescription,
        academicYearId: selectedAcademicYearForTimetable,
        termId: selectedTermForTimetable,
        classId: selectedClassForTimetable,
        isActive: timetableIsActive
      };

      const response = await axios.post('/api/prisma/timetables', timetableData);

      // Reset form
      setTimetableName('');
      setTimetableDescription('');
      setTimetableIsActive(false);

      // Set the newly created timetable as selected
      setSelectedTimetable(response.data.data.id);

      // Refresh timetables list
      fetchTimetablesByClass(selectedClassForTimetable);

      alert('Timetable created successfully!');
    } catch (error) {
      console.error('Error creating timetable:', error);
      setTimetableError(error.response?.data?.message || 'Failed to create timetable');
    } finally {
      setTimetableLoading(false);
    }
  };

  // Fetch timetables by class
  const fetchTimetablesByClass = async (classId) => {
    if (!classId) {
      setTimetableError('Please select a class');
      return;
    }

    setTimetableLoading(true);
    setTimetableError(null);

    try {
      const url = `/api/prisma/timetables/class/${classId}`;
      const response = await axios.get(url);

      setTimetables(response.data.data);
    } catch (error) {
      console.error('Error fetching timetables:', error);
      setTimetableError(error.response?.data?.message || 'Failed to fetch timetables');
    } finally {
      setTimetableLoading(false);
    }
  };

  // Fetch timetable details
  const fetchTimetableDetails = async (timetableId) => {
    if (!timetableId) {
      setTimetableError('Please select a timetable');
      return;
    }

    setTimetableLoading(true);
    setTimetableError(null);

    try {
      const response = await axios.get(`/api/prisma/timetables/${timetableId}`);

      setTimetableDetails(response.data.data);
    } catch (error) {
      console.error('Error fetching timetable details:', error);
      setTimetableError(error.response?.data?.message || 'Failed to fetch timetable details');
    } finally {
      setTimetableLoading(false);
    }
  };

  // Fetch teacher timetable
  const fetchTeacherTimetable = async () => {
    if (!selectedTeacherForTimetable) {
      setTimetableError('Please select a teacher');
      return;
    }

    setTimetableLoading(true);
    setTimetableError(null);

    try {
      const url = `/api/prisma/timetables/teacher/${selectedTeacherForTimetable}`;
      const response = await axios.get(url);

      setTeacherTimetable(response.data.data);
    } catch (error) {
      console.error('Error fetching teacher timetable:', error);
      setTimetableError(error.response?.data?.message || 'Failed to fetch teacher timetable');
    } finally {
      setTimetableLoading(false);
    }
  };

  // Add a session to a timetable
  const addSession = async () => {
    if (!selectedTimetable || !sessionSubject || !sessionTeacher || !sessionDay || !sessionStartTime || !sessionEndTime) {
      setTimetableError('Please fill in all required fields');
      return;
    }

    setTimetableLoading(true);
    setTimetableError(null);

    try {
      const sessionData = {
        subjectId: sessionSubject,
        teacherId: sessionTeacher,
        dayOfWeek: sessionDay,
        startTime: sessionStartTime,
        endTime: sessionEndTime,
        roomId: sessionRoom || undefined,
        notes: sessionNotes
      };

      const response = await axios.post(`/api/prisma/timetables/${selectedTimetable}/sessions`, sessionData);

      // Reset form
      setSessionSubject('');
      setSessionTeacher('');
      setSessionDay('MONDAY');
      setSessionStartTime('08:00');
      setSessionEndTime('09:00');
      setSessionRoom('');
      setSessionNotes('');

      // Refresh timetable details
      fetchTimetableDetails(selectedTimetable);

      alert('Session added successfully!');
    } catch (error) {
      console.error('Error adding session:', error);
      setTimetableError(error.response?.data?.message || 'Failed to add session');
    } finally {
      setTimetableLoading(false);
    }
  };

  // Delete a session
  const deleteSession = async (sessionId) => {
    if (!sessionId) return;

    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }

    setTimetableLoading(true);
    setTimetableError(null);

    try {
      await axios.delete(`/api/prisma/timetables/sessions/${sessionId}`);

      // Refresh timetable details
      fetchTimetableDetails(selectedTimetable);

      alert('Session deleted successfully!');
    } catch (error) {
      console.error('Error deleting session:', error);
      setTimetableError(error.response?.data?.message || 'Failed to delete session');
    } finally {
      setTimetableLoading(false);
    }
  };

  // Set timetable as active
  const setTimetableActive = async (timetableId) => {
    if (!timetableId) return;

    setTimetableLoading(true);
    setTimetableError(null);

    try {
      await axios.put(`/api/prisma/timetables/${timetableId}`, {
        isActive: true
      });

      // Refresh timetables list
      fetchTimetablesByClass(selectedClassForTimetable);

      alert('Timetable set as active successfully!');
    } catch (error) {
      console.error('Error setting timetable as active:', error);
      setTimetableError(error.response?.data?.message || 'Failed to set timetable as active');
    } finally {
      setTimetableLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Prisma Implementation Test
      </Typography>

      {/* Health Status Card */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Prisma API Health Status" />
        <Divider />
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : healthStatus ? (
            <Box>
              <Typography variant="body1" color={healthStatus.status === 'ok' ? 'success.main' : 'error.main'}>
                Status: {healthStatus.status}
              </Typography>
              <Typography variant="body1">
                Message: {healthStatus.message}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Timestamp: {healthStatus.timestamp}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary">
              No health status available. Click the button to check.
            </Typography>
          )}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={checkHealthStatus} disabled={loading}>
              Check Health Status
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Exam Management Card */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Exam Management (Prisma)" />
        <Divider />
        <CardContent>
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Create/Edit Exam" />
            <Tab label="View Exams" />
          </Tabs>

          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedExamForEdit ? 'Edit Exam' : 'Create New Exam'}
              </Typography>

              {examError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {examError}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="academic-year-select-label">Academic Year</InputLabel>
                    <Select
                      labelId="academic-year-select-label"
                      value={selectedAcademicYear}
                      label="Academic Year"
                      onChange={handleAcademicYearChange}
                    >
                      <MenuItem value="">
                        <em>Select an academic year</em>
                      </MenuItem>
                      {academicYears.map((year) => (
                        <MenuItem key={year._id} value={year._id}>
                          {year.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="exam-type-select-label">Exam Type</InputLabel>
                    <Select
                      labelId="exam-type-select-label"
                      value={selectedExamType}
                      label="Exam Type"
                      onChange={(e) => setSelectedExamType(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select an exam type</em>
                      </MenuItem>
                      {examTypes.map((type) => (
                        <MenuItem key={type._id} value={type._id}>
                          {type.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Exam Name"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="term-select-label">Term</InputLabel>
                    <Select
                      labelId="term-select-label"
                      value={examTerm}
                      label="Term"
                      onChange={(e) => setExamTerm(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a term</em>
                      </MenuItem>
                      <MenuItem value="TERM1">Term 1</MenuItem>
                      <MenuItem value="TERM2">Term 2</MenuItem>
                      <MenuItem value="TERM3">Term 3</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Start Date"
                    value={examStartDate}
                    onChange={(date) => setExamStartDate(date)}
                    renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="End Date"
                    value={examEndDate}
                    onChange={(date) => setExamEndDate(date)}
                    renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="status-select-label">Status</InputLabel>
                    <Select
                      labelId="status-select-label"
                      value={examStatus}
                      label="Status"
                      onChange={(e) => setExamStatus(e.target.value)}
                    >
                      <MenuItem value="DRAFT">Draft</MenuItem>
                      <MenuItem value="PUBLISHED">Published</MenuItem>
                      <MenuItem value="COMPLETED">Completed</MenuItem>
                      <MenuItem value="ARCHIVED">Archived</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    {selectedExamForEdit && (
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setSelectedExamForEdit(null);
                          setExamName('');
                          setExamTerm('');
                          setExamStartDate(null);
                          setExamEndDate(null);
                          setExamStatus('DRAFT');
                        }}
                      >
                        Cancel Edit
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      onClick={selectedExamForEdit ? updateExam : createExam}
                      disabled={examLoading}
                    >
                      {examLoading ? <CircularProgress size={24} /> : (selectedExamForEdit ? 'Update Exam' : 'Create Exam')}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                View Exams
              </Typography>

              {examError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {examError}
                </Alert>
              )}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="academic-year-view-label">Academic Year</InputLabel>
                <Select
                  labelId="academic-year-view-label"
                  value={selectedAcademicYear}
                  label="Academic Year"
                  onChange={handleAcademicYearChange}
                >
                  <MenuItem value="">
                    <em>Select an academic year</em>
                  </MenuItem>
                  {academicYears.map((year) => (
                    <MenuItem key={year._id} value={year._id}>
                      {year.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {examLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : examsList.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Term</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {examsList.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell>{exam.name}</TableCell>
                          <TableCell>{exam.term}</TableCell>
                          <TableCell>{exam.startDate ? new Date(exam.startDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{exam.endDate ? new Date(exam.endDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{exam.status}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => loadExamForEdit(exam.id)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => deleteExam(exam.id)}
                              >
                                Delete
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ my: 3, textAlign: 'center' }}>
                  {selectedAcademicYear ? 'No exams found for the selected academic year.' : 'Please select an academic year to view exams.'}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Results Management Card */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Results Management (Prisma)" />
        <Divider />
        <CardContent>
          <Tabs value={resultsActiveTab} onChange={handleResultsTabChange} sx={{ mb: 2 }}>
            <Tab label="Enter Results" />
            <Tab label="View Student Results" />
            <Tab label="View Class Results" />
            <Tab label="View Subject Results" />
          </Tabs>

          {resultsActiveTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Enter Student Results
              </Typography>

              {resultsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {resultsError}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="student-select-label">Student</InputLabel>
                    <Select
                      labelId="student-select-label"
                      value={selectedStudent}
                      label="Student"
                      onChange={(e) => setSelectedStudent(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a student</em>
                      </MenuItem>
                      {students.map((student) => (
                        <MenuItem key={student._id} value={student._id}>
                          {student.firstName} {student.lastName} ({student.admissionNumber})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="exam-select-label">Exam</InputLabel>
                    <Select
                      labelId="exam-select-label"
                      value={selectedExamForResults}
                      label="Exam"
                      onChange={(e) => setSelectedExamForResults(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select an exam</em>
                      </MenuItem>
                      {exams.map((exam) => (
                        <MenuItem key={exam._id} value={exam._id}>
                          {exam.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="subject-select-label">Subject</InputLabel>
                    <Select
                      labelId="subject-select-label"
                      value={selectedSubjectForResults}
                      label="Subject"
                      onChange={(e) => setSelectedSubjectForResults(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a subject</em>
                      </MenuItem>
                      {subjects.map((subject) => (
                        <MenuItem key={subject._id} value={subject._id}>
                          {subject.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Marks"
                    type="number"
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    inputProps={{ min: 0, max: 100 }}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={saveResult}
                      disabled={resultsLoading}
                    >
                      {resultsLoading ? <CircularProgress size={24} /> : 'Save Result'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {resultsActiveTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                View Student Results
              </Typography>

              {resultsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {resultsError}
                </Alert>
              )}

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={5}>
                  <FormControl fullWidth>
                    <InputLabel id="student-view-label">Student</InputLabel>
                    <Select
                      labelId="student-view-label"
                      value={selectedStudent}
                      label="Student"
                      onChange={(e) => setSelectedStudent(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a student</em>
                      </MenuItem>
                      {students.map((student) => (
                        <MenuItem key={student._id} value={student._id}>
                          {student.firstName} {student.lastName} ({student.admissionNumber})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={5}>
                  <FormControl fullWidth>
                    <InputLabel id="exam-view-label">Exam</InputLabel>
                    <Select
                      labelId="exam-view-label"
                      value={selectedExamForResults}
                      label="Exam"
                      onChange={(e) => setSelectedExamForResults(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select an exam</em>
                      </MenuItem>
                      {exams.map((exam) => (
                        <MenuItem key={exam._id} value={exam._id}>
                          {exam.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <Box sx={{ display: 'flex', height: '100%', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={() => fetchStudentResults(selectedStudent, selectedExamForResults)}
                      disabled={resultsLoading || !selectedStudent}
                      fullWidth
                    >
                      View Results
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={calculateOLevelDivision}
                  disabled={resultsLoading || !selectedStudent || !selectedExamForResults}
                  sx={{ mr: 2 }}
                >
                  Calculate Division
                </Button>
              </Box>

              {resultsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : studentResults.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell>Marks</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Points</TableCell>
                        <TableCell>Comments</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studentResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell>{result.subject?.name || 'N/A'}</TableCell>
                          <TableCell>{result.marks}</TableCell>
                          <TableCell>{result.grade}</TableCell>
                          <TableCell>{result.points}</TableCell>
                          <TableCell>{result.comments || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ my: 3, textAlign: 'center' }}>
                  {selectedStudent ? 'No results found for the selected student.' : 'Please select a student to view results.'}
                </Typography>
              )}
            </Box>
          )}

          {resultsActiveTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                View Class Results
              </Typography>

              {resultsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {resultsError}
                </Alert>
              )}

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={5}>
                  <FormControl fullWidth>
                    <InputLabel id="class-view-label">Class</InputLabel>
                    <Select
                      labelId="class-view-label"
                      value={selectedClassForResults}
                      label="Class"
                      onChange={(e) => setSelectedClassForResults(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a class</em>
                      </MenuItem>
                      {classes.map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={5}>
                  <FormControl fullWidth>
                    <InputLabel id="exam-class-view-label">Exam</InputLabel>
                    <Select
                      labelId="exam-class-view-label"
                      value={selectedExamForResults}
                      label="Exam"
                      onChange={(e) => setSelectedExamForResults(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select an exam</em>
                      </MenuItem>
                      {exams.map((exam) => (
                        <MenuItem key={exam._id} value={exam._id}>
                          {exam.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <Box sx={{ display: 'flex', height: '100%', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={fetchClassResults}
                      disabled={resultsLoading || !selectedClassForResults || !selectedExamForResults}
                      fullWidth
                    >
                      View Results
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {resultsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : classResults.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Admission Number</TableCell>
                        <TableCell>Subjects</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {classResults.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.firstName} {student.lastName}</TableCell>
                          <TableCell>{student.admissionNumber}</TableCell>
                          <TableCell>{student.results.length}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setSelectedStudent(student.id);
                                setResultsActiveTab(1);
                                fetchStudentResults(student.id, selectedExamForResults);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ my: 3, textAlign: 'center' }}>
                  {selectedClassForResults && selectedExamForResults ? 'No results found for the selected class and exam.' : 'Please select a class and exam to view results.'}
                </Typography>
              )}
            </Box>
          )}

          {resultsActiveTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                View Subject Results
              </Typography>

              {resultsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {resultsError}
                </Alert>
              )}

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="class-subject-view-label">Class</InputLabel>
                    <Select
                      labelId="class-subject-view-label"
                      value={selectedClassForResults}
                      label="Class"
                      onChange={(e) => setSelectedClassForResults(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a class</em>
                      </MenuItem>
                      {classes.map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id="exam-subject-view-label">Exam</InputLabel>
                    <Select
                      labelId="exam-subject-view-label"
                      value={selectedExamForResults}
                      label="Exam"
                      onChange={(e) => setSelectedExamForResults(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select an exam</em>
                      </MenuItem>
                      {exams.map((exam) => (
                        <MenuItem key={exam._id} value={exam._id}>
                          {exam.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel id="subject-view-label">Subject</InputLabel>
                    <Select
                      labelId="subject-view-label"
                      value={selectedSubjectForResults}
                      label="Subject"
                      onChange={(e) => setSelectedSubjectForResults(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a subject</em>
                      </MenuItem>
                      {subjects.map((subject) => (
                        <MenuItem key={subject._id} value={subject._id}>
                          {subject.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={2}>
                  <Box sx={{ display: 'flex', height: '100%', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={fetchSubjectResults}
                      disabled={resultsLoading || !selectedClassForResults || !selectedExamForResults || !selectedSubjectForResults}
                      fullWidth
                    >
                      View Results
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {resultsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : subjectResults.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Admission Number</TableCell>
                        <TableCell>Marks</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell>Points</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subjectResults.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.firstName} {student.lastName}</TableCell>
                          <TableCell>{student.admissionNumber}</TableCell>
                          <TableCell>{student.result ? student.result.marks : '-'}</TableCell>
                          <TableCell>{student.result ? student.result.grade : '-'}</TableCell>
                          <TableCell>{student.result ? student.result.points : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ my: 3, textAlign: 'center' }}>
                  {selectedClassForResults && selectedExamForResults && selectedSubjectForResults ? 'No results found for the selected subject, class, and exam.' : 'Please select a subject, class, and exam to view results.'}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Attendance Management Card */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Attendance Management (Prisma)" />
        <Divider />
        <CardContent>
          <Tabs value={attendanceActiveTab} onChange={handleAttendanceTabChange} sx={{ mb: 2 }}>
            <Tab label="Record Attendance" />
            <Tab label="View Student Attendance" />
            <Tab label="View Class Attendance" />
            <Tab label="Attendance Summary" />
          </Tabs>

          {attendanceActiveTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Record Student Attendance
              </Typography>

              {attendanceError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {attendanceError}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="student-attendance-label">Student</InputLabel>
                    <Select
                      labelId="student-attendance-label"
                      value={selectedStudentForAttendance}
                      label="Student"
                      onChange={(e) => setSelectedStudentForAttendance(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a student</em>
                      </MenuItem>
                      {students.map((student) => (
                        <MenuItem key={student._id} value={student._id}>
                          {student.firstName} {student.lastName} ({student.admissionNumber})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="class-attendance-label">Class</InputLabel>
                    <Select
                      labelId="class-attendance-label"
                      value={selectedClassForAttendance}
                      label="Class"
                      onChange={(e) => setSelectedClassForAttendance(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a class</em>
                      </MenuItem>
                      {classes.map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Date"
                    value={attendanceDate}
                    onChange={(date) => setAttendanceDate(date)}
                    renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="status-select-label">Status</InputLabel>
                    <Select
                      labelId="status-select-label"
                      value={attendanceStatus}
                      label="Status"
                      onChange={(e) => setAttendanceStatus(e.target.value)}
                    >
                      <MenuItem value="PRESENT">Present</MenuItem>
                      <MenuItem value="ABSENT">Absent</MenuItem>
                      <MenuItem value="LATE">Late</MenuItem>
                      <MenuItem value="EXCUSED">Excused</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reason"
                    value={attendanceReason}
                    onChange={(e) => setAttendanceReason(e.target.value)}
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={recordAttendance}
                      disabled={attendanceLoading}
                    >
                      {attendanceLoading ? <CircularProgress size={24} /> : 'Record Attendance'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {attendanceActiveTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                View Student Attendance
              </Typography>

              {attendanceError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {attendanceError}
                </Alert>
              )}

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="student-view-attendance-label">Student</InputLabel>
                    <Select
                      labelId="student-view-attendance-label"
                      value={selectedStudentForAttendance}
                      label="Student"
                      onChange={(e) => setSelectedStudentForAttendance(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a student</em>
                      </MenuItem>
                      {students.map((student) => (
                        <MenuItem key={student._id} value={student._id}>
                          {student.firstName} {student.lastName} ({student.admissionNumber})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={attendanceStartDate}
                    onChange={(date) => setAttendanceStartDate(date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="End Date"
                    value={attendanceEndDate}
                    onChange={(date) => setAttendanceEndDate(date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>

                <Grid item xs={12} md={2}>
                  <Box sx={{ display: 'flex', height: '100%', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={() => fetchStudentAttendance(selectedStudentForAttendance)}
                      disabled={attendanceLoading || !selectedStudentForAttendance}
                      fullWidth
                    >
                      View Attendance
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {attendanceLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : studentAttendance.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studentAttendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>{record.status}</TableCell>
                          <TableCell>{record.reason || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ my: 3, textAlign: 'center' }}>
                  {selectedStudentForAttendance ? 'No attendance records found for the selected student.' : 'Please select a student to view attendance records.'}
                </Typography>
              )}
            </Box>
          )}

          {attendanceActiveTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                View Class Attendance
              </Typography>

              {attendanceError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {attendanceError}
                </Alert>
              )}

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={5}>
                  <FormControl fullWidth>
                    <InputLabel id="class-view-attendance-label">Class</InputLabel>
                    <Select
                      labelId="class-view-attendance-label"
                      value={selectedClassForAttendance}
                      label="Class"
                      onChange={(e) => setSelectedClassForAttendance(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a class</em>
                      </MenuItem>
                      {classes.map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={5}>
                  <DatePicker
                    label="Date"
                    value={attendanceDate}
                    onChange={(date) => setAttendanceDate(date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>

                <Grid item xs={12} md={2}>
                  <Box sx={{ display: 'flex', height: '100%', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={fetchClassAttendance}
                      disabled={attendanceLoading || !selectedClassForAttendance || !attendanceDate}
                      fullWidth
                    >
                      View Attendance
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {classAttendance && classAttendance.students && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    Date: {new Date(classAttendance.date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body1">
                    Present: {classAttendance.presentCount} | Absent: {classAttendance.absentCount} | Late: {classAttendance.lateCount} | Excused: {classAttendance.excusedCount} | Total: {classAttendance.totalStudents}
                  </Typography>

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={recordBulkAttendance}
                      disabled={attendanceLoading || !classAttendance.students.length}
                    >
                      Save All Attendance
                    </Button>
                  </Box>
                </Box>
              )}

              {attendanceLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : classAttendance && classAttendance.students && classAttendance.students.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Admission Number</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {classAttendance.students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.firstName} {student.lastName}</TableCell>
                          <TableCell>{student.admissionNumber}</TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={student.attendance?.status || 'PRESENT'}
                                onChange={(e) => {
                                  // Update the student's attendance status in the state
                                  const updatedStudents = classAttendance.students.map(s => {
                                    if (s.id === student.id) {
                                      return {
                                        ...s,
                                        attendance: {
                                          ...s.attendance,
                                          status: e.target.value
                                        }
                                      };
                                    }
                                    return s;
                                  });

                                  setClassAttendance({
                                    ...classAttendance,
                                    students: updatedStudents
                                  });
                                }}
                              >
                                <MenuItem value="PRESENT">Present</MenuItem>
                                <MenuItem value="ABSENT">Absent</MenuItem>
                                <MenuItem value="LATE">Late</MenuItem>
                                <MenuItem value="EXCUSED">Excused</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={student.attendance?.reason || ''}
                              onChange={(e) => {
                                // Update the student's attendance reason in the state
                                const updatedStudents = classAttendance.students.map(s => {
                                  if (s.id === student.id) {
                                    return {
                                      ...s,
                                      attendance: {
                                        ...s.attendance,
                                        reason: e.target.value
                                      }
                                    };
                                  }
                                  return s;
                                });

                                setClassAttendance({
                                  ...classAttendance,
                                  students: updatedStudents
                                });
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ my: 3, textAlign: 'center' }}>
                  {selectedClassForAttendance && attendanceDate ? 'No students found for the selected class.' : 'Please select a class and date to view attendance.'}
                </Typography>
              )}
            </Box>
          )}

          {attendanceActiveTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Attendance Summary
              </Typography>

              {attendanceError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {attendanceError}
                </Alert>
              )}

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="class-summary-label">Class</InputLabel>
                    <Select
                      labelId="class-summary-label"
                      value={selectedClassForAttendance}
                      label="Class"
                      onChange={(e) => setSelectedClassForAttendance(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a class</em>
                      </MenuItem>
                      {classes.map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="Start Date"
                    value={attendanceStartDate}
                    onChange={(date) => setAttendanceStartDate(date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <DatePicker
                    label="End Date"
                    value={attendanceEndDate}
                    onChange={(date) => setAttendanceEndDate(date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>

                <Grid item xs={12} md={2}>
                  <Box sx={{ display: 'flex', height: '100%', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={fetchClassAttendanceSummary}
                      disabled={attendanceLoading || !selectedClassForAttendance || !attendanceStartDate || !attendanceEndDate}
                      fullWidth
                    >
                      Get Summary
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {attendanceSummary && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    Period: {new Date(attendanceSummary.startDate).toLocaleDateString()} to {new Date(attendanceSummary.endDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body1">
                    School Days: {attendanceSummary.schoolDays} | Total Students: {attendanceSummary.totalStudents}
                  </Typography>
                </Box>
              )}

              {attendanceLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : attendanceSummary && attendanceSummary.students && attendanceSummary.students.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Admission Number</TableCell>
                        <TableCell>Present</TableCell>
                        <TableCell>Absent</TableCell>
                        <TableCell>Late</TableCell>
                        <TableCell>Excused</TableCell>
                        <TableCell>Attendance Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceSummary.students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.firstName} {student.lastName}</TableCell>
                          <TableCell>{student.admissionNumber}</TableCell>
                          <TableCell>{student.presentCount}</TableCell>
                          <TableCell>{student.absentCount}</TableCell>
                          <TableCell>{student.lateCount}</TableCell>
                          <TableCell>{student.excusedCount}</TableCell>
                          <TableCell>{student.attendanceRate}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ my: 3, textAlign: 'center' }}>
                  {selectedClassForAttendance && attendanceStartDate && attendanceEndDate ? 'No attendance data found for the selected period.' : 'Please select a class and date range to view attendance summary.'}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Timetable Management Card */}
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Timetable Management (Prisma)" />
        <Divider />
        <CardContent>
          <Tabs value={timetableActiveTab} onChange={handleTimetableTabChange} sx={{ mb: 2 }}>
            <Tab label="Create Timetable" />
            <Tab label="View Timetables" />
            <Tab label="Add Sessions" />
            <Tab label="Teacher Timetable" />
          </Tabs>

          {timetableActiveTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Create New Timetable
              </Typography>

              {timetableError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {timetableError}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Timetable Name"
                    value={timetableName}
                    onChange={(e) => setTimetableName(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={timetableDescription}
                    onChange={(e) => setTimetableDescription(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="class-timetable-label">Class</InputLabel>
                    <Select
                      labelId="class-timetable-label"
                      value={selectedClassForTimetable}
                      label="Class"
                      onChange={(e) => {
                        setSelectedClassForTimetable(e.target.value);
                        fetchTimetablesByClass(e.target.value);
                      }}
                    >
                      <MenuItem value="">
                        <em>Select a class</em>
                      </MenuItem>
                      {classes.map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="academic-year-timetable-label">Academic Year</InputLabel>
                    <Select
                      labelId="academic-year-timetable-label"
                      value={selectedAcademicYearForTimetable}
                      label="Academic Year"
                      onChange={(e) => setSelectedAcademicYearForTimetable(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select an academic year</em>
                      </MenuItem>
                      {academicYears.map((year) => (
                        <MenuItem key={year._id} value={year._id}>
                          {year.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="term-timetable-label">Term</InputLabel>
                    <Select
                      labelId="term-timetable-label"
                      value={selectedTermForTimetable}
                      label="Term"
                      onChange={(e) => setSelectedTermForTimetable(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a term</em>
                      </MenuItem>
                      {terms.map((term) => (
                        <MenuItem key={term._id} value={term._id}>
                          {term.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={timetableIsActive}
                        onChange={(e) => setTimetableIsActive(e.target.checked)}
                      />
                    }
                    label="Set as active timetable"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={createTimetable}
                      disabled={timetableLoading}
                    >
                      {timetableLoading ? <CircularProgress size={24} /> : 'Create Timetable'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}

          {timetableActiveTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                View Timetables
              </Typography>

              {timetableError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {timetableError}
                </Alert>
              )}

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="class-view-timetable-label">Class</InputLabel>
                    <Select
                      labelId="class-view-timetable-label"
                      value={selectedClassForTimetable}
                      label="Class"
                      onChange={(e) => {
                        setSelectedClassForTimetable(e.target.value);
                        fetchTimetablesByClass(e.target.value);
                      }}
                    >
                      <MenuItem value="">
                        <em>Select a class</em>
                      </MenuItem>
                      {classes.map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                          {cls.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', height: '100%', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={() => fetchTimetablesByClass(selectedClassForTimetable)}
                      disabled={timetableLoading || !selectedClassForTimetable}
                    >
                      View Timetables
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {timetableLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : timetables.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Academic Year</TableCell>
                        <TableCell>Term</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Sessions</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {timetables.map((timetable) => (
                        <TableRow key={timetable.id}>
                          <TableCell>{timetable.name}</TableCell>
                          <TableCell>{timetable.academicYear?.name || '-'}</TableCell>
                          <TableCell>{timetable.term?.name || '-'}</TableCell>
                          <TableCell>
                            {timetable.isActive ? (
                              <Chip label="Active" color="success" size="small" />
                            ) : (
                              <Chip label="Inactive" color="default" size="small" />
                            )}
                          </TableCell>
                          <TableCell>{timetable._count?.sessions || 0}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                  setSelectedTimetable(timetable.id);
                                  fetchTimetableDetails(timetable.id);
                                  setTimetableActiveTab(2);
                                }}
                              >
                                Manage Sessions
                              </Button>
                              {!timetable.isActive && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => setTimetableActive(timetable.id)}
                                >
                                  Set Active
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ my: 3, textAlign: 'center' }}>
                  {selectedClassForTimetable ? 'No timetables found for the selected class.' : 'Please select a class to view timetables.'}
                </Typography>
              )}
            </Box>
          )}

          {timetableActiveTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {timetableDetails ? `Manage Sessions: ${timetableDetails.name}` : 'Add Sessions to Timetable'}
              </Typography>

              {timetableError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {timetableError}
                </Alert>
              )}

              {!selectedTimetable && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Please select a timetable from the "View Timetables" tab first.
                </Alert>
              )}

              {selectedTimetable && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="subject-session-label">Subject</InputLabel>
                      <Select
                        labelId="subject-session-label"
                        value={sessionSubject}
                        label="Subject"
                        onChange={(e) => setSessionSubject(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>Select a subject</em>
                        </MenuItem>
                        {subjects.map((subject) => (
                          <MenuItem key={subject._id} value={subject._id}>
                            {subject.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="teacher-session-label">Teacher</InputLabel>
                      <Select
                        labelId="teacher-session-label"
                        value={sessionTeacher}
                        label="Teacher"
                        onChange={(e) => setSessionTeacher(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>Select a teacher</em>
                        </MenuItem>
                        {teachers.map((teacher) => (
                          <MenuItem key={teacher._id} value={teacher._id}>
                            {teacher.firstName} {teacher.lastName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="day-session-label">Day</InputLabel>
                      <Select
                        labelId="day-session-label"
                        value={sessionDay}
                        label="Day"
                        onChange={(e) => setSessionDay(e.target.value)}
                      >
                        <MenuItem value="MONDAY">Monday</MenuItem>
                        <MenuItem value="TUESDAY">Tuesday</MenuItem>
                        <MenuItem value="WEDNESDAY">Wednesday</MenuItem>
                        <MenuItem value="THURSDAY">Thursday</MenuItem>
                        <MenuItem value="FRIDAY">Friday</MenuItem>
                        <MenuItem value="SATURDAY">Saturday</MenuItem>
                        <MenuItem value="SUNDAY">Sunday</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Start Time"
                      type="time"
                      value={sessionStartTime}
                      onChange={(e) => setSessionStartTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      sx={{ mb: 2 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="End Time"
                      type="time"
                      value={sessionEndTime}
                      onChange={(e) => setSessionEndTime(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      sx={{ mb: 2 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel id="room-session-label">Room</InputLabel>
                      <Select
                        labelId="room-session-label"
                        value={sessionRoom}
                        label="Room"
                        onChange={(e) => setSessionRoom(e.target.value)}
                      >
                        <MenuItem value="">
                          <em>Select a room (optional)</em>
                        </MenuItem>
                        {rooms.map((room) => (
                          <MenuItem key={room._id} value={room._id}>
                            {room.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Notes"
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      multiline
                      rows={2}
                      sx={{ mb: 2 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        onClick={addSession}
                        disabled={timetableLoading}
                      >
                        {timetableLoading ? <CircularProgress size={24} /> : 'Add Session'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {timetableDetails && timetableDetails.sessions && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Current Sessions
                  </Typography>

                  {timetableDetails.sessions.length > 0 ? (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Day</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Subject</TableCell>
                            <TableCell>Teacher</TableCell>
                            <TableCell>Room</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {timetableDetails.sessions.map((session) => (
                            <TableRow key={session.id}>
                              <TableCell>{session.dayOfWeek}</TableCell>
                              <TableCell>{session.startTime} - {session.endTime}</TableCell>
                              <TableCell>{session.subject?.name || '-'}</TableCell>
                              <TableCell>
                                {session.teacher?.user ?
                                  `${session.teacher.user.firstName} ${session.teacher.user.lastName}` :
                                  '-'}
                              </TableCell>
                              <TableCell>{session.room?.name || '-'}</TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => deleteSession(session.id)}
                                >
                                  Delete
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ my: 3, textAlign: 'center' }}>
                      No sessions found for this timetable.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}

          {timetableActiveTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Teacher Timetable
              </Typography>

              {timetableError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {timetableError}
                </Alert>
              )}

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="teacher-view-timetable-label">Teacher</InputLabel>
                    <Select
                      labelId="teacher-view-timetable-label"
                      value={selectedTeacherForTimetable}
                      label="Teacher"
                      onChange={(e) => setSelectedTeacherForTimetable(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Select a teacher</em>
                      </MenuItem>
                      {teachers.map((teacher) => (
                        <MenuItem key={teacher._id} value={teacher._id}>
                          {teacher.firstName} {teacher.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', height: '100%', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      onClick={fetchTeacherTimetable}
                      disabled={timetableLoading || !selectedTeacherForTimetable}
                    >
                      View Timetable
                    </Button>
                  </Box>
                </Grid>
              </Grid>

              {timetableLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                  <CircularProgress />
                </Box>
              ) : teacherTimetable ? (
                <Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Total Sessions: {teacherTimetable.totalSessions}
                  </Typography>

                  {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map(day => (
                    <Box key={day} sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        {day}
                      </Typography>

                      {teacherTimetable.sessionsByDay[day].length > 0 ? (
                        <TableContainer component={Paper}>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Time</TableCell>
                                <TableCell>Subject</TableCell>
                                <TableCell>Class</TableCell>
                                <TableCell>Room</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {teacherTimetable.sessionsByDay[day].map((session) => (
                                <TableRow key={session.id}>
                                  <TableCell>{session.startTime} - {session.endTime}</TableCell>
                                  <TableCell>{session.subject?.name || '-'}</TableCell>
                                  <TableCell>{session.timetable?.class?.name || '-'}</TableCell>
                                  <TableCell>{session.room?.name || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body1" color="text.secondary">
                          No sessions scheduled for {day}.
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ my: 3, textAlign: 'center' }}>
                  {selectedTeacherForTimetable ? 'No timetable data found for the selected teacher.' : 'Please select a teacher to view timetable.'}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* O-Level Marks Check Card */}
      <Card>
        <CardHeader title="O-Level Marks Check" />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            {/* Class Selection */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="class-select-label">Class</InputLabel>
                <Select
                  labelId="class-select-label"
                  value={selectedClass}
                  label="Class"
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select a class</em>
                  </MenuItem>
                  {classes.map((classObj) => (
                    <MenuItem key={classObj._id} value={classObj._id}>
                      {classObj.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Subject Selection */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="subject-select-label">Subject</InputLabel>
                <Select
                  labelId="subject-select-label"
                  value={selectedSubject}
                  label="Subject"
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={!selectedClass}
                >
                  <MenuItem value="">
                    <em>Select a subject</em>
                  </MenuItem>
                  {subjects.map((subjectObj) => (
                    <MenuItem
                      key={subjectObj.subject?._id || subjectObj._id}
                      value={subjectObj.subject?._id || subjectObj._id}
                    >
                      {subjectObj.subject?.name || subjectObj.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Exam Selection */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="exam-select-label">Exam</InputLabel>
                <Select
                  labelId="exam-select-label"
                  value={selectedExam}
                  label="Exam"
                  onChange={(e) => setSelectedExam(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Select an exam</em>
                  </MenuItem>
                  {exams.map((exam) => (
                    <MenuItem key={exam._id} value={exam._id}>
                      {exam.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Check Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={checkMarks}
                  disabled={marksLoading || !selectedClass || !selectedSubject || !selectedExam}
                >
                  {marksLoading ? <CircularProgress size={24} /> : 'Check Marks'}
                </Button>
              </Box>
            </Grid>

            {/* Error Message */}
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            {/* Results */}
            {marksData && (
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Results
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      Total Students: {marksData.totalStudents}
                    </Typography>
                    <Typography variant="body1">
                      Marks Entered: {marksData.totalMarksEntered}
                    </Typography>
                    <Typography variant="body1">
                      Progress: {marksData.progress}%
                    </Typography>
                  </Box>

                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Admission #</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Marks</TableCell>
                          <TableCell>Grade</TableCell>
                          <TableCell>Points</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {marksData.students.map((student) => (
                          <TableRow key={student.studentId}>
                            <TableCell>{student.admissionNumber}</TableCell>
                            <TableCell>{`${student.firstName} ${student.lastName}`}</TableCell>
                            <TableCell>{student.marksObtained !== null ? student.marksObtained : '-'}</TableCell>
                            <TableCell>{student.grade || '-'}</TableCell>
                            <TableCell>{student.points !== null ? student.points : '-'}</TableCell>
                            <TableCell>
                              {student.hasExistingMarks ? (
                                <Typography variant="body2" color="success.main">
                                  Marks Entered
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="error.main">
                                  No Marks
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PrismaTest;
