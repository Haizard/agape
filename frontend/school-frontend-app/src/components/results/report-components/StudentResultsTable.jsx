import React from 'react';
import PropTypes from 'prop-types';
import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';

/**
 * Student Results Table Component
 * Displays a table of individual student results
 */
const StudentResultsTable = ({
  students,
  uniqueSubjects,
  startIndex,
  sortField,
  sortDirection,
  onSortChange
}) => {
  return (
    <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 600, overflow: 'auto' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              #
            </TableCell>
            <TableCell
              onClick={() => onSortChange('studentName')}
              sx={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              STUDENT NAME {sortField === 'studentName' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>SEX</TableCell>
            <TableCell
              align="center"
              onClick={() => onSortChange('points')}
              sx={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              POINT {sortField === 'points' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableCell>
            <TableCell
              align="center"
              onClick={() => onSortChange('division')}
              sx={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              DIVISION {sortField === 'division' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableCell>

            {/* Subject Columns - All possible subjects */}
            {uniqueSubjects.map((subjectName) => (
              <TableCell
                key={subjectName}
                align="center"
                sx={{ fontWeight: 'bold' }}
              >
                {subjectName}
              </TableCell>
            ))}

            {/* Summary Columns */}
            <TableCell
              align="center"
              onClick={() => onSortChange('totalMarks')}
              sx={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              TOTAL {sortField === 'totalMarks' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableCell>
            <TableCell
              align="center"
              onClick={() => onSortChange('averageMarks')}
              sx={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              AVERAGE {sortField === 'averageMarks' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableCell>
            <TableCell
              align="center"
              onClick={() => onSortChange('rank')}
              sx={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              RANK {sortField === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.length > 0 ? (
            students.map((student, index) => {
              // Check if this is a placeholder student (no real data)
              const isPlaceholder = student.id?.startsWith('placeholder');

              return (
                <TableRow key={student.id || student.studentId || index} sx={isPlaceholder ? { opacity: 0.7, fontStyle: 'italic' } : {}}>
                  <TableCell>{startIndex + index + 1}</TableCell>
                  <TableCell>{student.studentName || `${student.firstName} ${student.lastName}`}</TableCell>
                  <TableCell>{student.sex || student.gender || '-'}</TableCell>
                  <TableCell align="center">{student.points || student.totalPoints || '-'}</TableCell>
                  <TableCell align="center">{student.division || '-'}</TableCell>

                  {/* Subject Marks - All possible subjects */}
                  {uniqueSubjects.map((subjectName) => {
                    // Find the subject result for this student
                    const subjectResult = student.subjectResults?.find(r => r.subject?.name === subjectName);

                    // Get the marks, handling missing values
                    const marks = subjectResult?.marks ||
                                subjectResult?.marksObtained ||
                                (subjectResult?.present ? subjectResult.marks : '-');

                    return (
                      <TableCell
                        key={`${student.id}-${subjectName}`}
                        align="center"
                      >
                        {marks === null || marks === undefined ? '-' : marks}
                      </TableCell>
                    );
                  })}

                  {/* Summary Columns */}
                  <TableCell align="center">{student.totalMarks || '-'}</TableCell>
                  <TableCell align="center">{student.averageMarks || '-'}</TableCell>
                  <TableCell align="center">{student.rank || '-'}</TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5 + uniqueSubjects.length + 3} align="center">
                No students available for this class and exam
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

StudentResultsTable.propTypes = {
  students: PropTypes.array.isRequired,
  uniqueSubjects: PropTypes.array.isRequired,
  startIndex: PropTypes.number.isRequired,
  sortField: PropTypes.string.isRequired,
  sortDirection: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired
};

export default StudentResultsTable;
