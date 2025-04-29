{/* Student Information Header */}
<Box className="student-info-header">
  <Box className="student-info-item">
    <Typography className="student-info-label">Name:</Typography>
    <Typography className="student-info-value">{student.name || 'N/A'}</Typography>
  </Box>
  <Box className="student-info-item">
    <Typography className="student-info-label">Class:</Typography>
    <Typography className="student-info-value">{student.className || 'N/A'}</Typography>
  </Box>
  <Box className="student-info-item">
    <Typography className="student-info-label">Roll Number:</Typography>
    <Typography className="student-info-value">{student.rollNumber || 'N/A'}</Typography>
  </Box>
  <Box className="student-info-item">
    <Typography className="student-info-label">Rank:</Typography>
    <Typography className="student-info-value">
      {student.rank ? `${student.rank} of ${totalStudents}` : 'N/A of N/A'}
    </Typography>
  </Box>
  <Box className="student-info-item">
    <Typography className="student-info-label">Gender:</Typography>
    <Typography className="student-info-value">{student.gender || student.sex || 'N/A'}</Typography>
  </Box>
  <Box className="student-info-item">
    <Typography className="student-info-label">Exam:</Typography>
    <Typography className="student-info-value">{examName || 'N/A'}</Typography>
  </Box>
  <Box className="student-info-item">
    <Typography className="student-info-label">Date:</Typography>
    <Typography className="student-info-value">
      {new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      })}
    </Typography>
  </Box>
</Box>

{/* Principal Subjects Header */}
<Typography className="subject-header">Principal Subjects</Typography>
{principalSubjects.length > 0 ? (
  // ... existing principal subjects table code ...
) : (
  <Typography className="no-subjects-message">No principal subjects found</Typography>
)}

{/* Subsidiary Subjects Header */}
<Typography className="subject-header">Subsidiary Subjects</Typography>
{subsidiarySubjects.length > 0 ? (
  // ... existing subsidiary subjects table code ...
) : (
  <Typography className="no-subjects-message">No subsidiary subjects found</Typography>
)} 