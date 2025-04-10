import React from 'react';
import { AppBar, Drawer, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { Link } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';

const drawerWidth = 280;

const Navigation = () => {
  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        {/* AppBar content */}
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {/* Drawer content */}
        <List>
          <ListItem button component={Link} to="/admin/create-academic-year">
            <ListItemText primary="Create Academic Year" />
          </ListItem>
          <ListItem button component={Link} to="/admin/teachers">
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Manage Teachers" />
          </ListItem>
          <ListItem button component={Link} to="/admin/classes">
            <ListItemText primary="Manage Classes" />
          </ListItem>
          <ListItem button component={Link} to="/admin/subjects">
            <ListItemText primary="Manage Subjects" />
          </ListItem>
          <ListItem button component={Link} to="/admin/teacher-assignments">
            <ListItemText primary="Assign Teachers" />
          </ListItem>
          <ListItem button component={Link} to="/admin/student-assignments">
            <ListItemText primary="Assign Students" />
          </ListItem>
          <ListItem button component={Link} to="/admin/generate-reports">
            <ListItemText primary="Generate Reports" />
          </ListItem>
          <ListItem button component={Link} to="/admin/results">
            <ListItemText primary="Results" />
          </ListItem>
          <ListItem button component={Link} to="/admin/exams">
            <ListItemText primary="Exams" />
          </ListItem>
          <ListItem button component={Link} to="/admin/exam-creation">
            <ListItemText primary="Create Exams" />
          </ListItem>
          <ListItem button component={Link} to="/admin/news">
            <ListItemText primary="News" />
          </ListItem>
          <ListItem button component={Link} to="/admin/exam-types">
            <ListItemText primary="Exam Types" />
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default Navigation;


