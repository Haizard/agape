import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components for the report
const ReportContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  border: '1px solid #000',
  position: 'relative',
  backgroundColor: '#fff',
  color: '#000',
  fontFamily: 'Arial, sans-serif',
  width: '100%',
  maxWidth: '210mm', // A4 width
  margin: '0 auto',
  '@media print': {
    boxShadow: 'none',
    border: 'none'
  }
}));

const SchoolHeader = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(2)
}));

const SchoolLogo = styled('img')({
  height: '80px',
  marginRight: '20px'
});

const SchoolName = styled(Typography)({
  fontWeight: 'bold',
  fontSize: '24px',
  textTransform: 'uppercase'
});

const SchoolAddress = styled(Typography)({
  fontSize: '14px'
});

const ReportTitle = styled(Typography)({
  fontWeight: 'bold',
  fontSize: '18px',
  textAlign: 'center',
  marginTop: '10px',
  marginBottom: '10px',
  textTransform: 'uppercase',
  textDecoration: 'underline'
});

const StudentInfoGrid = styled(Grid)({
  marginBottom: '15px'
});

const InfoLabel = styled(Typography)({
  fontWeight: 'bold',
  fontSize: '14px'
});

const InfoValue = styled(Typography)({
  fontSize: '14px'
});

const GradeTable = styled(TableContainer)({
  marginBottom: '15px'
});

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '8px',
  fontSize: '14px',
  border: '1px solid #000',
  '@media print': {
    padding: '4px'
  }
}));

const StyledTableHeadCell = styled(StyledTableCell)({
  fontWeight: 'bold',
  backgroundColor: '#f5f5f5'
});

const RemarksSection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2)
}));

const SignatureSection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  display: 'flex',
  justifyContent: 'space-between'
}));

const SignatureLine = styled(Box)({
  borderTop: '1px solid #000',
  width: '200px',
  textAlign: 'center',
  paddingTop: '5px'
});

const Watermark = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%) rotate(-45deg)',
  fontSize: '60px',
  color: 'rgba(0, 0, 0, 0.05)',
  fontWeight: 'bold',
  pointerEvents: 'none',
  zIndex: 0,
  '@media print': {
    display: 'none'
  }
});

/**
 * OLevelReportTemplate Component
 * 
 * Template for O-Level student reports
 */
const OLevelReportTemplate = ({ reportData }) => {
  // Calculate total marks and average
  const totalMarks = reportData.subjects.reduce((sum, subject) => sum + subject.mark, 0);
  const averageMark = totalMarks / reportData.subjects.length;
  
  // Calculate grade distribution
  const gradeDistribution = reportData.subjects.reduce((acc, subject) => {
    acc[subject.grade] = (acc[subject.grade] || 0) + 1;
    return acc;
  }, {});
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };
  
  return (
    <ReportContainer>
      <Watermark>PREVIEW</Watermark>
      
      <SchoolHeader>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <SchoolLogo src="/logo.png" alt="School Logo" />
          <Box>
            <SchoolName variant="h4">St. John Vianney School</SchoolName>
            <SchoolAddress variant="body2">P.O. Box 123, Dar es Salaam, Tanzania</SchoolAddress>
            <SchoolAddress variant="body2">Tel: +255 123 456 789 | Email: info@stjohnvianney.ac.tz</SchoolAddress>
          </Box>
        </Box>
      </SchoolHeader>
      
      <ReportTitle variant="h5">
        O-Level Student Progress Report
      </ReportTitle>
      
      <StudentInfoGrid container spacing={2}>
        <Grid item xs={6} md={3}>
          <InfoLabel variant="subtitle2">Student Name:</InfoLabel>
          <InfoValue variant="body2">{reportData.student.name}</InfoValue>
        </Grid>
        <Grid item xs={6} md={3}>
          <InfoLabel variant="subtitle2">Registration No:</InfoLabel>
          <InfoValue variant="body2">{reportData.student.registrationNumber}</InfoValue>
        </Grid>
        <Grid item xs={6} md={3}>
          <InfoLabel variant="subtitle2">Class:</InfoLabel>
          <InfoValue variant="body2">{reportData.student.class}</InfoValue>
        </Grid>
        <Grid item xs={6} md={3}>
          <InfoLabel variant="subtitle2">Term:</InfoLabel>
          <InfoValue variant="body2">{reportData.term} - {reportData.academicYear}</InfoValue>
        </Grid>
      </StudentInfoGrid>
      
      <GradeTable component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <StyledTableHeadCell>Subject</StyledTableHeadCell>
              <StyledTableHeadCell align="center">Mark (%)</StyledTableHeadCell>
              <StyledTableHeadCell align="center">Grade</StyledTableHeadCell>
              <StyledTableHeadCell align="center">Position</StyledTableHeadCell>
              <StyledTableHeadCell>Remarks</StyledTableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.subjects.map((subject, index) => (
              <TableRow key={index}>
                <StyledTableCell>{subject.name}</StyledTableCell>
                <StyledTableCell align="center">{subject.mark}</StyledTableCell>
                <StyledTableCell align="center">{subject.grade}</StyledTableCell>
                <StyledTableCell align="center">{subject.position}</StyledTableCell>
                <StyledTableCell>{subject.remarks}</StyledTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GradeTable>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <StyledTableHeadCell>Total Marks</StyledTableHeadCell>
                  <StyledTableCell align="center">{totalMarks}</StyledTableCell>
                </TableRow>
                <TableRow>
                  <StyledTableHeadCell>Average Mark</StyledTableHeadCell>
                  <StyledTableCell align="center">{averageMark.toFixed(2)}%</StyledTableCell>
                </TableRow>
                <TableRow>
                  <StyledTableHeadCell>Class Position</StyledTableHeadCell>
                  <StyledTableCell align="center">{reportData.classPosition} out of {reportData.totalStudents}</StyledTableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <StyledTableHeadCell colSpan={2}>Attendance</StyledTableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <StyledTableHeadCell>Days Present</StyledTableHeadCell>
                  <StyledTableCell align="center">{reportData.attendance.daysPresent}</StyledTableCell>
                </TableRow>
                <TableRow>
                  <StyledTableHeadCell>Days Absent</StyledTableHeadCell>
                  <StyledTableCell align="center">{reportData.attendance.daysAbsent}</StyledTableCell>
                </TableRow>
                <TableRow>
                  <StyledTableHeadCell>Total Days</StyledTableHeadCell>
                  <StyledTableCell align="center">{reportData.attendance.totalDays}</StyledTableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
      
      <RemarksSection>
        <InfoLabel variant="subtitle2">Class Teacher's Remarks:</InfoLabel>
        <Paper variant="outlined" sx={{ p: 1, mb: 2 }}>
          <Typography variant="body2">{reportData.classTeacherRemarks}</Typography>
        </Paper>
        
        <InfoLabel variant="subtitle2">Principal's Remarks:</InfoLabel>
        <Paper variant="outlined" sx={{ p: 1, mb: 2 }}>
          <Typography variant="body2">{reportData.principalRemarks}</Typography>
        </Paper>
      </RemarksSection>
      
      <Divider />
      
      <Box sx={{ mt: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <InfoLabel variant="subtitle2">School Fees:</InfoLabel>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <InfoValue variant="body2">Amount: TZS {reportData.schoolFees.amount.toLocaleString()}</InfoValue>
              <InfoValue variant="body2">Paid: TZS {reportData.schoolFees.paid.toLocaleString()}</InfoValue>
              <InfoValue variant="body2">Balance: TZS {reportData.schoolFees.balance.toLocaleString()}</InfoValue>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <InfoLabel variant="subtitle2">Next Term Begins:</InfoLabel>
            <InfoValue variant="body2">{formatDate(reportData.nextTermBegins)}</InfoValue>
          </Grid>
        </Grid>
      </Box>
      
      <SignatureSection>
        <Box>
          <SignatureLine>
            <Typography variant="body2">Class Teacher</Typography>
          </SignatureLine>
        </Box>
        <Box>
          <SignatureLine>
            <Typography variant="body2">Principal</Typography>
          </SignatureLine>
        </Box>
        <Box>
          <SignatureLine>
            <Typography variant="body2">Parent/Guardian</Typography>
          </SignatureLine>
        </Box>
      </SignatureSection>
      
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
          This report was generated on {new Date().toLocaleDateString()}
        </Typography>
      </Box>
    </ReportContainer>
  );
};

export default OLevelReportTemplate;
