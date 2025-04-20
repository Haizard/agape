import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActionArea,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Message as MessageIcon,
  AccountBalance as FinanceIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

/**
 * UnifiedDashboard Component
 *
 * A dashboard that organizes system functionality into logical groups
 * and provides quick access to related components
 */
const UnifiedDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Define component groups based on functionality
  const componentGroups = [
    // Overview Group
    {
      id: 'overview',
      title: 'Overview',
      icon: <DashboardIcon />,
      components: [
        {
          name: 'Dashboard',
          description: 'System overview and statistics',
          path: '/admin/dashboard',
          icon: <DashboardIcon color="primary" />
        },
        {
          name: 'Task Dashboard',
          description: 'Task-based workflow organization',
          path: '/admin/tasks',
          icon: <DashboardIcon color="secondary" />
        }
      ]
    },
    // Academic Management Group
    {
      id: 'academic',
      title: 'Academic Management',
      icon: <SchoolIcon />,
      components: [
        {
          name: 'Unified Academic Management',
          description: 'Complete academic setup in one place',
          path: '/academic/unified',
          icon: <SchoolIcon color="success" />,
          highlight: true
        },
        {
          name: 'Education Levels',
          description: 'Manage O-Level and A-Level education',
          path: '/admin/education-levels',
          icon: <SchoolIcon color="primary" />
        },
        {
          name: 'Classes',
          description: 'Manage school classes',
          path: '/admin/classes',
          icon: <SchoolIcon color="secondary" />
        },
        {
          name: 'Subjects',
          description: 'Manage subjects and curriculum',
          path: '/admin/subjects',
          icon: <SchoolIcon color="success" />
        },
        {
          name: 'Subject Combinations',
          description: 'Manage subject combinations',
          path: '/admin/subject-combinations',
          icon: <SchoolIcon color="warning" />
        },
        {
          name: 'Subject-Class Assignment',
          description: 'Assign subjects to classes',
          path: '/admin/subject-class-assignment',
          icon: <SchoolIcon color="info" />
        },
        {
          name: 'Subject-Teacher Assignment',
          description: 'Assign teachers to subjects',
          path: '/admin/subject-teacher-assignment',
          icon: <SchoolIcon color="error" />
        },
        {
          name: 'Compulsory Subject Assignment',
          description: 'Assign compulsory subjects',
          path: '/admin/compulsory-subject-assignment',
          icon: <SchoolIcon color="primary" />
        },
        {
          name: 'Student Subject Selection',
          description: 'Manage student subject selections',
          path: '/admin/student-subject-selection',
          icon: <SchoolIcon color="secondary" />
        }
      ]
    },
    // Assessment Management Group
    {
      id: 'assessment',
      title: 'Assessment Management',
      icon: <AssessmentIcon />,
      components: [
        {
          name: 'Exams',
          description: 'Manage school examinations',
          path: '/admin/exams',
          icon: <AssessmentIcon color="primary" />
        },
        {
          name: 'Create Exams',
          description: 'Create new examinations',
          path: '/admin/exam-creation',
          icon: <AssessmentIcon color="secondary" />
        },
        {
          name: 'Exam Types',
          description: 'Manage exam types',
          path: '/admin/exam-types',
          icon: <AssessmentIcon color="success" />
        },
        {
          name: 'Results',
          description: 'Manage student results',
          path: '/admin/results',
          icon: <AssessmentIcon color="warning" />
        },
        {
          name: 'Marks Entry Dashboard',
          description: 'Access all marks entry options (O-Level and A-Level)',
          path: '/results/marks-entry-dashboard',
          icon: <AssessmentIcon color="success" />,
          highlight: true
        },
        {
          name: 'Result Management Workflow',
          description: 'Complete guided workflow for result management',
          path: '/workflows/result-management',
          icon: <AssessmentIcon color="primary" />,
          highlight: true
        },
        {
          name: 'Enter Marks (O-Level)',
          description: 'Enter marks for O-Level students (Legacy)',
          path: '/results/o-level/enter-marks',
          icon: <AssessmentIcon color="info" />
        },
        {
          name: 'Enter Marks (A-Level)',
          description: 'Enter marks for A-Level students (Legacy)',
          path: '/results/a-level/enter-marks',
          icon: <AssessmentIcon color="error" />
        },
        {
          name: 'Character Assessment',
          description: 'Enter character assessments',
          path: '/admin/character-assessment',
          icon: <AssessmentIcon color="primary" />
        },
        {
          name: 'Result Reports',
          description: 'Generate and view result reports',
          path: '/admin/result-reports',
          icon: <AssessmentIcon color="secondary" />
        },
        {
          name: 'Student-Class Diagnostic',
          description: 'Diagnose and fix student-class assignments',
          path: '/admin/student-class-diagnostic',
          icon: <AssessmentIcon color="warning" />
        }
      ]
    },
    // Student Management Group
    {
      id: 'students',
      title: 'Student Management',
      icon: <PersonIcon />,
      components: [
        {
          name: 'Student Registration',
          description: 'Register new students',
          path: '/admin/student-registration',
          icon: <PersonIcon color="primary" />
        },
        {
          name: 'Student List',
          description: 'View and manage students',
          path: '/admin/students',
          icon: <PersonIcon color="secondary" />
        }
      ]
    },
    // Communication Group
    {
      id: 'communication',
      title: 'Communication',
      icon: <MessageIcon />,
      components: [
        {
          name: 'SMS Settings',
          description: 'Configure SMS notification settings',
          path: '/admin/sms-settings',
          icon: <MessageIcon color="primary" />
        },
        {
          name: 'Parent Contacts',
          description: 'Manage parent contact information',
          path: '/admin/parent-contacts',
          icon: <MessageIcon color="secondary" />
        },
        {
          name: 'Result Notifications',
          description: 'Send result notifications to parents',
          path: '/admin/result-notifications',
          icon: <MessageIcon color="success" />
        }
      ]
    },
    // Finance Group
    {
      id: 'finance',
      title: 'Finance',
      icon: <FinanceIcon />,
      components: [
        {
          name: 'Fee Structures',
          description: 'Manage fee structures',
          path: '/admin/fee-structures',
          icon: <FinanceIcon color="primary" />
        },
        {
          name: 'QuickBooks Integration',
          description: 'Configure QuickBooks integration',
          path: '/admin/quickbooks',
          icon: <FinanceIcon color="secondary" />
        },
        {
          name: 'Payments',
          description: 'Process and track payments',
          path: '/admin/payments',
          icon: <FinanceIcon color="success" />
        }
      ]
    },
    // Settings Group
    {
      id: 'settings',
      title: 'Settings',
      icon: <SettingsIcon />,
      components: [
        {
          name: 'User Management',
          description: 'Manage system users',
          path: '/admin/users',
          icon: <SettingsIcon color="primary" />
        },
        {
          name: 'System Settings',
          description: 'Configure system settings',
          path: '/admin/settings',
          icon: <SettingsIcon color="secondary" />
        }
      ]
    }
  ];

  // Get the current tab group
  const currentGroup = componentGroups[activeTab];

  // Define workflow cards
  const workflowCards = [
    {
      title: 'Unified Academic Management',
      description: 'Complete academic setup in one place',
      path: '/academic/unified',
      icon: <SchoolIcon fontSize="large" color="success" />,
      highlight: true
    },
    {
      title: 'Result Management Workflow',
      description: 'Complete process from entering marks to sending notifications',
      path: '/workflows/result-management',
      icon: <AssessmentIcon fontSize="large" color="success" />,
      highlight: true
    },
    {
      title: 'Student Registration Workflow',
      description: 'Register students and assign subjects',
      path: '/admin/workflows/student-registration',
      icon: <PersonIcon fontSize="large" color="secondary" />
    },
    {
      title: 'Class Setup Workflow',
      description: 'Create classes and assign subjects and teachers',
      path: '/admin/workflows/class-setup',
      icon: <SchoolIcon fontSize="large" color="success" />
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Unified Dashboard
      </Typography>

      <Typography variant="body1" paragraph>
        Welcome to the unified dashboard. Access all system components organized by function.
      </Typography>

      {/* Workflow Cards */}
      <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
        Common Workflows
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {workflowCards.map((workflow, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card
              sx={{
                border: workflow.highlight ? '2px solid #4caf50' : 'none',
                boxShadow: workflow.highlight ? '0 0 10px rgba(76, 175, 80, 0.3)' : 'inherit'
              }}
            >
              <CardActionArea onClick={() => navigate(workflow.path)}>
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  {workflow.icon}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 2 }}>
                    <Typography variant="h6">
                      {workflow.title}
                    </Typography>
                    {workflow.highlight && (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{
                          ml: 1,
                          bgcolor: '#4caf50',
                          color: 'white',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.7rem'
                        }}
                      >
                        NEW
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {workflow.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Component Groups */}
      <Typography variant="h5" gutterBottom>
        System Components
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="component groups tabs"
        >
          {componentGroups.map((group) => (
            <Tab
              key={group.id}
              icon={group.icon}
              label={group.title}
              id={`tab-${group.id}`}
              aria-controls={`tabpanel-${group.id}`}
            />
          ))}
        </Tabs>
      </Box>

      {/* Current Tab Content */}
      <Box
        role="tabpanel"
        id={`tabpanel-${currentGroup.id}`}
        aria-labelledby={`tab-${currentGroup.id}`}
      >
        <Typography variant="h6" gutterBottom>
          {currentGroup.title} Components
        </Typography>

        <Grid container spacing={2}>
          {currentGroup.components.map((component, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                sx={{
                  p: 2,
                  height: '100%',
                  border: component.highlight ? '2px solid #4caf50' : 'none',
                  boxShadow: component.highlight ? '0 0 10px rgba(76, 175, 80, 0.3)' : 'inherit'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {component.icon}
                  <Typography variant="subtitle1" sx={{ ml: 1 }}>
                    {component.name}
                    {component.highlight && (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{
                          ml: 1,
                          bgcolor: '#4caf50',
                          color: 'white',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.7rem'
                        }}
                      >
                        NEW
                      </Typography>
                    )}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {component.description}
                </Typography>
                <Button
                  variant={component.highlight ? "contained" : "outlined"}
                  color={component.highlight ? "success" : "primary"}
                  size="small"
                  onClick={() => navigate(component.path)}
                  fullWidth
                >
                  {component.highlight ? "Try Now" : "Open"}
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default UnifiedDashboard;
