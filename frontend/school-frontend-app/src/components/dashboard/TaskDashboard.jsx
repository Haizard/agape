import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Divider
} from '@mui/material';
import {
  School as SchoolIcon,
  Class as ClassIcon,
  Subject as SubjectIcon,
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Message as MessageIcon,
  AccountBalance as FinanceIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * TaskDashboard Component
 *
 * A dashboard that organizes system functionality into task-based cards
 * Each card represents a complete workflow with links to related components
 */
const TaskDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  // Task groups organized by functional area
  const taskGroups = [
    {
      id: 'academic',
      title: 'Academic Management',
      icon: <SchoolIcon fontSize="large" color="primary" />,
      description: 'Manage classes, subjects, and academic structure',
      tasks: [
        {
          name: 'Class Management',
          path: '/admin/classes',
          description: 'Create and manage school classes'
        },
        {
          name: 'Subject Management',
          path: '/admin/subjects',
          description: 'Manage subjects and assign to classes'
        },
        {
          name: 'Subject-Teacher Assignment',
          path: '/admin/subject-teacher-assignment',
          description: 'Assign teachers to specific subjects'
        },
        {
          name: 'Education Levels',
          path: '/admin/education-levels',
          description: 'Manage O-Level and A-Level education'
        }
      ],
      visible: isAdmin
    },
    {
      id: 'assessment',
      title: 'Assessment & Results',
      icon: <AssessmentIcon fontSize="large" color="secondary" />,
      description: 'Manage exams, results, and reports',
      tasks: [
        {
          name: 'Exam Management',
          path: '/admin/exams',
          description: 'Create and manage exams'
        },
        {
          name: 'Marks Entry Dashboard',
          path: '/results/marks-entry-dashboard',
          description: 'Enhanced interface for entering student marks'
        },
        {
          name: 'Generate Reports',
          path: '/admin/result-reports',
          description: 'Generate student result reports'
        },
        {
          name: 'Character Assessment',
          path: '/admin/character-assessment',
          description: 'Enter character assessments for students'
        }
      ],
      visible: isAdmin || isTeacher
    },
    {
      id: 'students',
      title: 'Student Management',
      icon: <PersonIcon fontSize="large" color="success" />,
      description: 'Manage students and their information',
      tasks: [
        {
          name: 'Student Registration',
          path: '/admin/student-registration',
          description: 'Register new students'
        },
        {
          name: 'Student Subject Selection',
          path: '/admin/student-subject-selection',
          description: 'Manage student subject selections'
        },
        {
          name: 'View Student Results',
          path: '/admin/student-results',
          description: 'View results for individual students'
        }
      ],
      visible: isAdmin
    },
    {
      id: 'communication',
      title: 'Communication',
      icon: <MessageIcon fontSize="large" color="info" />,
      description: 'Manage communication with parents and students',
      tasks: [
        {
          name: 'SMS Settings',
          path: '/admin/sms-settings',
          description: 'Configure SMS notification settings'
        },
        {
          name: 'Send Result Notifications',
          path: '/admin/result-notifications',
          description: 'Send result notifications to parents'
        },
        {
          name: 'Parent Contacts',
          path: '/admin/parent-contacts',
          description: 'Manage parent contact information'
        }
      ],
      visible: isAdmin
    },
    {
      id: 'finance',
      title: 'Finance Management',
      icon: <FinanceIcon fontSize="large" color="warning" />,
      description: 'Manage school finances and fee structures',
      tasks: [
        {
          name: 'Fee Structures',
          path: '/admin/fee-structures',
          description: 'Manage fee structures for students'
        },
        {
          name: 'QuickBooks Integration',
          path: '/admin/quickbooks',
          description: 'Configure QuickBooks integration'
        },
        {
          name: 'Payment Processing',
          path: '/admin/payments',
          description: 'Process and track student payments'
        }
      ],
      visible: isAdmin
    }
  ];

  // Filter task groups based on user role
  const visibleTaskGroups = taskGroups.filter(group => group.visible);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Task Dashboard
      </Typography>
      <Typography variant="body1" paragraph>
        Welcome to the task dashboard. Select a task category to get started.
      </Typography>

      <Grid container spacing={3}>
        {visibleTaskGroups.map((group) => (
          <Grid item xs={12} md={6} key={group.id}>
            <Card
              sx={{
                height: '100%',
                borderLeft: '5px solid',
                borderColor: group.id === 'academic' ? 'primary.main' :
                             group.id === 'assessment' ? 'secondary.main' :
                             group.id === 'students' ? 'success.main' :
                             group.id === 'communication' ? 'info.main' : 'warning.main'
              }}
            >
              <CardHeader
                avatar={group.icon}
                title={
                  <Typography variant="h6">{group.title}</Typography>
                }
              />
              <Divider />
              <CardContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {group.description}
                </Typography>
                <List>
                  {group.tasks.map((task, index) => (
                    <ListItem
                      key={index}
                      button
                      onClick={() => navigate(task.path)}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <ListItemText
                        primary={task.name}
                        secondary={task.description}
                      />
                    </ListItem>
                  ))}
                </List>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate(`/admin/${group.id}`)}
                  sx={{ mt: 2 }}
                >
                  View All {group.title} Tasks
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TaskDashboard;
