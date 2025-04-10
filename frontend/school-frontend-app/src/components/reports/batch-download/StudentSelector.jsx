import React from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Person as PersonIcon
} from '@mui/icons-material';

/**
 * StudentSelector Component
 * 
 * Allows selecting students from a class
 */
const StudentSelector = ({
  students,
  selectedStudents,
  selectAll,
  handleSelectAll,
  handleStudentSelect
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1">
          Students ({students.length})
        </Typography>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={selectAll}
              onChange={handleSelectAll}
              disabled={students.length === 0}
            />
          }
          label="Select All"
        />
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {students.length === 0 ? (
        <Alert severity="info">No students found in this class</Alert>
      ) : (
        <List>
          {students.map(student => (
            <ListItem key={student._id} dense button onClick={() => handleStudentSelect(student._id)}>
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={selectedStudents.includes(student._id)}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText 
                primary={student.name} 
                secondary={`Reg No: ${student.registrationNumber}`} 
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default StudentSelector;
