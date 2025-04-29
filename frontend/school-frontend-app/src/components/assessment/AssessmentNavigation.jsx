import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  LibraryBooks as LibraryBooksIcon,
  GroupAdd as GroupAddIcon,
  BarChart as BarChartIcon,
  Person as PersonIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';

const AssessmentNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      text: 'Assessment Management',
      icon: <AssessmentIcon />,
      path: '/assessments'
    },
    {
      text: 'Bulk Entry',
      icon: <GroupAddIcon />,
      path: '/assessments/bulk-entry'
    },
    {
      text: 'Assessment Report',
      icon: <BarChartIcon />,
      path: '/assessments/report'
    },
    {
      text: 'Results',
      icon: <LibraryBooksIcon />,
      path: '/assessments/results'
    },
    {
      text: 'Character Assessment',
      icon: <PsychologyIcon />,
      path: '/assessments/character'
    }
  ];

  const isActive = (path) => {
    if (path === '/assessments') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Paper elevation={0} sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
      <List component="nav">
        {menuItems.map((item, index) => (
          <React.Fragment key={item.path}>
            <ListItem
              button
              selected={isActive(item.path)}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                borderRadius: 1,
                mb: 0.5
              }}
            >
              <ListItemIcon sx={{ color: isActive(item.path) ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{ 
                  '& .MuiListItemText-primary': {
                    color: isActive(item.path) ? 'primary.main' : 'inherit',
                    fontWeight: isActive(item.path) ? 500 : 400
                  }
                }}
              />
            </ListItem>
            {index < menuItems.length - 1 && <Divider sx={{ my: 1 }} />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default AssessmentNavigation;