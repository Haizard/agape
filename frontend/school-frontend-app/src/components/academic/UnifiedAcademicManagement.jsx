import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Typography,
  Tabs,
  Tab,
  Divider,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
  Grid,
  TextField
} from '@mui/material';
import {
  School as SchoolIcon,
  Book as BookIcon,
  Person as PersonIcon,
  Check as CheckIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Add as AddIcon
} from '@mui/icons-material';

// Import sub-components
import AcademicYearSetup from './unified/AcademicYearSetup';
import ClassSetup from './unified/ClassSetup';
import SubjectSetup from './unified/SubjectSetup';
import SubjectCombinationSetup from './unified/SubjectCombinationSetup';
import AssignmentSetup from './unified/AssignmentSetup';

/**
 * UnifiedAcademicManagement Component
 *
 * A comprehensive academic management system that simplifies the process of setting up
 * academic years, classes, subjects, and assignments through a guided workflow.
 *
 * This component replaces multiple separate forms with a unified approach that ensures
 * all necessary steps are completed in the correct order.
 */
const UnifiedAcademicManagement = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [customStepName, setCustomStepName] = useState('');
  const [customStepDescription, setCustomStepDescription] = useState('');
  const [managementMode, setManagementMode] = useState(false);

  // State for tracking completion of each step
  const [completed, setCompleted] = useState({
    academicYear: false,
    classes: false,
    subjects: false,
    combinations: false,
    assignments: false
  });

  // Handle next step
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Handle reset
  const handleReset = () => {
    setActiveStep(0);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle step completion
  const handleStepComplete = (step) => {
    setCompleted(prev => ({
      ...prev,
      [step]: true
    }));

    // Show success message
    setSuccess(`${step.charAt(0).toUpperCase() + step.slice(1)} setup completed successfully.`);

    // Only auto-advance if not in management mode
    if (!managementMode) {
      // Automatically move to next step after a delay
      setTimeout(() => {
        handleNext();
        setSuccess(null);
      }, 1500);
    } else {
      // In management mode, just clear the success message after a delay
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
  };

  // Define default steps for the workflow
  const defaultSteps = [
    {
      id: 'academicYear',
      label: 'Academic Year Setup',
      description: 'Create and configure academic years for both O-Level and A-Level',
      guidelines: [
        'Start by creating the current academic year',
        'Include clear start and end dates for each academic year',
        'Mark the current academic year as active',
        'Create separate academic years for O-Level and A-Level if needed',
        'Plan ahead by creating the next academic year in advance'
      ],
      component: <AcademicYearSetup onComplete={() => handleStepComplete('academicYear')} />,
      completed: completed.academicYear,
      required: true
    },
    {
      id: 'classes',
      label: 'Class Setup',
      description: 'Create classes for all forms and assign them to academic years',
      guidelines: [
        'Create classes for each form level (Form 1-6)',
        'Assign each class to the appropriate academic year',
        'Set the correct education level (O-Level or A-Level)',
        'Specify the class capacity to manage enrollment',
        'Add sections/streams if your school divides classes (e.g., Form 1A, Form 1B)'
      ],
      component: <ClassSetup onComplete={() => handleStepComplete('classes')} />,
      completed: completed.classes,
      required: true
    },
    {
      id: 'subjects',
      label: 'Subject Setup',
      description: 'Create subjects for both O-Level and A-Level',
      guidelines: [
        'Add all subjects taught in your school',
        'Categorize subjects as Core or Optional',
        'Assign the correct education level to each subject',
        'Use consistent naming and coding conventions',
        'Include pass marks and grading criteria for each subject'
      ],
      component: <SubjectSetup onComplete={() => handleStepComplete('subjects')} />,
      completed: completed.subjects,
      required: true
    },
    {
      id: 'combinations',
      label: 'Subject Combination Setup',
      description: 'Create subject combinations for A-Level students',
      guidelines: [
        'Create meaningful combinations based on career paths',
        'Include required principal and subsidiary subjects',
        'Ensure combinations follow national curriculum guidelines',
        'Use clear naming conventions for combinations',
        'Verify that all subjects in combinations have been created'
      ],
      component: <SubjectCombinationSetup onComplete={() => handleStepComplete('combinations')} />,
      completed: completed.combinations,
      required: false
    },
    {
      id: 'assignments',
      label: 'Assignment Setup',
      description: 'Assign subjects to classes, teachers to subjects, and subjects to students',
      guidelines: [
        'First assign subjects to appropriate classes',
        'Then assign teachers to subjects they will teach',
        'For A-Level, assign subject combinations to students',
        'Ensure each class has all required subjects assigned',
        'Verify teacher workloads are balanced appropriately'
      ],
      component: <AssignmentSetup onComplete={() => handleStepComplete('assignments')} />,
      completed: completed.assignments,
      required: false
    }
  ];

  // State for custom workflow steps
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [customizationMode, setCustomizationMode] = useState(false);

  // Initialize workflow steps from localStorage or defaults
  useEffect(() => {
    const savedSteps = localStorage.getItem('unifiedAcademicWorkflowSteps');
    if (savedSteps) {
      try {
        const parsedSteps = JSON.parse(savedSteps);
        // Map saved step IDs to actual components
        const mappedSteps = parsedSteps.map(step => {
          const defaultStep = defaultSteps.find(s => s.id === step.id);
          return {
            ...step,
            component: defaultStep ? defaultStep.component : null,
            completed: completed[step.id] || false
          };
        });
        setWorkflowSteps(mappedSteps);
      } catch (error) {
        console.error('Error parsing saved workflow steps:', error);
        setWorkflowSteps(defaultSteps);
      }
    } else {
      setWorkflowSteps(defaultSteps);
    }
  }, []);

  // Save workflow steps to localStorage when they change
  useEffect(() => {
    if (workflowSteps.length > 0) {
      // Save only the necessary data (not the React components)
      const stepsToSave = workflowSteps.map(({ id, label, description, required }) => ({
        id, label, description, required
      }));
      localStorage.setItem('unifiedAcademicWorkflowSteps', JSON.stringify(stepsToSave));
    }
  }, [workflowSteps]);

  // Add a custom step
  const handleAddCustomStep = (newStep) => {
    setWorkflowSteps(prev => [...prev, {
      id: `custom-${Date.now()}`,
      label: newStep.label,
      description: newStep.description,
      component: null, // Custom steps don't have components
      completed: false,
      required: false,
      custom: true
    }]);
  };

  // Remove a step
  const handleRemoveStep = (stepId) => {
    setWorkflowSteps(prev => prev.filter(step => step.id !== stepId));
  };

  // Reorder steps
  const handleReorderSteps = (startIndex, endIndex) => {
    const result = Array.from(workflowSteps);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setWorkflowSteps(result);
  };

  // Reset to default steps
  const handleResetSteps = () => {
    setWorkflowSteps(defaultSteps);
    localStorage.removeItem('unifiedAcademicWorkflowSteps');
  };

  // Get active steps (filtered if needed)
  const steps = workflowSteps.filter(step => !step.custom);

  // Define tabs for direct access to specific setups
  const tabs = [
    {
      label: 'Academic Years',
      component: <AcademicYearSetup standalone={true} />
    },
    {
      label: 'Classes',
      component: <ClassSetup standalone={true} />
    },
    {
      label: 'Subjects',
      component: <SubjectSetup standalone={true} />
    },
    {
      label: 'Subject Combinations',
      component: <SubjectCombinationSetup standalone={true} />
    },
    {
      label: 'Assignments',
      component: <AssignmentSetup standalone={true} />
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Unified Academic Management
      </Typography>

      <Typography variant="body1" paragraph>
        This unified system simplifies the process of setting up and managing your academic structure.
        You can either follow the guided workflow or directly access specific components.
      </Typography>

      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0f7ff', border: '1px solid #bbdefb' }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Getting Started: Academic Management Guide
        </Typography>
        <Typography variant="body2" paragraph>
          Welcome to the Unified Academic Management system. This tool helps you set up and manage all aspects of your school's academic structure in one place.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                <SchoolIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                Initial Setup
              </Typography>
              <Typography variant="body2" paragraph>
                For first-time setup, follow the guided workflow step by step. This ensures all components are properly configured in the correct order.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                <BookIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                Making Changes
              </Typography>
              <Typography variant="body2" paragraph>
                Use Management Mode to revisit and modify completed steps. This allows you to add, edit, or remove items even after initial setup.
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ p: 1 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                <PersonIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                Best Practices
              </Typography>
              <Typography variant="body2" paragraph>
                Follow the guidelines provided in each step for best results. Complete all required steps before the academic year begins.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress />
        </Box>
      )}

      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Choose Your Approach
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setActiveStep(0);
                setActiveTab(null);
              }}
              startIcon={<SchoolIcon />}
            >
              Guided Workflow
            </Button>

            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setActiveTab(0);
                setActiveStep(null);
              }}
              startIcon={<BookIcon />}
            >
              Direct Access
            </Button>

            <Button
              variant="outlined"
              color={managementMode ? "success" : "info"}
              onClick={() => setManagementMode(!managementMode)}
              startIcon={<PersonIcon />}
            >
              {managementMode ? 'Exit Management Mode' : 'Enter Management Mode'}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setCustomizationMode(!customizationMode)}
              startIcon={<SettingsIcon />}
            >
              {customizationMode ? 'Exit Customization' : 'Customize Workflow'}
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Workflow Customization */}
      {customizationMode && (
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Customize Workflow
            </Typography>

            <Alert severity="info" sx={{ mb: 2 }}>
              Drag and drop steps to reorder them. You can also add custom steps or remove optional steps.
              Required steps cannot be removed but can be reordered.
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Current Workflow Steps
              </Typography>

              <List>
                {workflowSteps.map((step, index) => (
                  <ListItem
                    key={step.id}
                    secondaryAction={
                      !step.required && (
                        <IconButton edge="end" onClick={() => handleRemoveStep(step.id)}>
                          <DeleteIcon />
                        </IconButton>
                      )
                    }
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: step.required ? '#f5f5f5' : 'white'
                    }}
                  >
                    <ListItemIcon>
                      <DragIndicatorIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={step.label}
                      secondary={step.description}
                      primaryTypographyProps={{
                        fontWeight: step.required ? 'bold' : 'normal'
                      }}
                    />
                    {step.required && (
                      <Chip label="Required" size="small" color="primary" sx={{ mr: 1 }} />
                    )}
                  </ListItem>
                ))}
              </List>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Add Custom Step
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                  <TextField
                    label="Step Name"
                    fullWidth
                    value={customStepName || ''}
                    onChange={(e) => setCustomStepName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    label="Step Description"
                    fullWidth
                    value={customStepDescription || ''}
                    onChange={(e) => setCustomStepDescription(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={!customStepName}
                    onClick={() => {
                      handleAddCustomStep({
                        label: customStepName,
                        description: customStepDescription
                      });
                      setCustomStepName('');
                      setCustomStepDescription('');
                    }}
                    sx={{ height: '100%' }}
                  >
                    Add Step
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleResetSteps}
                sx={{ mr: 1 }}
              >
                Reset to Default
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setCustomizationMode(false)}
              >
                Save Changes
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Guided Workflow */}
      <Box sx={{ display: activeStep !== null ? 'block' : 'none' }}>
        <Typography variant="h5" gutterBottom>
          {managementMode ? 'Academic Management Mode' : 'Guided Academic Setup Workflow'}
        </Typography>

        {managementMode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Management Mode Active:</strong> You can now access and modify all steps, even those that are already completed.
              This allows you to add, edit, or remove items from any step in the academic setup process.
            </Typography>
          </Alert>
        )}

        {/* Step Navigation Panel (only visible in management mode) */}
        {managementMode && (
          <Paper sx={{ p: 2, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {steps.map((step, idx) => (
              <Button
                key={step.id}
                variant={activeStep === idx ? "contained" : "outlined"}
                color={step.completed ? "success" : "primary"}
                onClick={() => setActiveStep(idx)}
                sx={{ mb: 1 }}
                startIcon={step.completed ? <CheckIcon /> : null}
              >
                {step.label}
              </Button>
            ))}
          </Paper>
        )}

        <Stepper activeStep={activeStep} orientation="vertical" nonLinear={managementMode}>
          {steps.map((step, index) => (
            <Step
              key={step.id || step.label}
              completed={step.completed}
              active={activeStep === index || (managementMode && step.completed)}
            >
              <StepLabel
                onClick={() => managementMode && setActiveStep(index)}
                sx={{ cursor: managementMode ? 'pointer' : 'default' }}
              >
                <Typography variant="subtitle1">
                  {step.label}
                  {managementMode && step.completed && (
                    <Chip
                      size="small"
                      label="Completed"
                      color="success"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {step.description}
                </Typography>

                {managementMode && step.completed && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    This step is already completed, but you can make changes as needed.
                  </Alert>
                )}

                {/* Guidelines */}
                {step.guidelines && (
                  <Paper sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Guidelines for {step.label}:
                    </Typography>
                    <List dense disablePadding>
                      {step.guidelines.map((guideline, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <CheckIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={guideline} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}

                {/* Step content */}
                <Box sx={{ mb: 2 }}>
                  {step.component}
                </Box>

                {/* Navigation buttons */}
                <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!step.completed && !managementMode}
                  >
                    {index === steps.length - 1 ? 'Finish' : 'Continue'}
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {activeStep === steps.length && (
          <Paper square elevation={0} sx={{ p: 3, mt: 3, bgcolor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom>
              <CheckIcon color="success" sx={{ mr: 1, verticalAlign: 'middle' }} />
              All steps completed - Academic setup is complete!
            </Typography>
            <Typography paragraph>
              You have successfully completed the academic setup workflow.
              All necessary components have been configured for both O-Level and A-Level education.
            </Typography>
            <Typography paragraph>
              <strong>Need to make changes?</strong> You can enter Management Mode to access and modify any step,
              even after completion. This allows you to add, edit, or remove items as needed.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Button onClick={handleReset} sx={{ mt: 1 }}>
                Reset Workflow
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  setManagementMode(true);
                  setActiveStep(0);
                }}
                sx={{ mt: 1 }}
              >
                Enter Management Mode
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setActiveTab(0)}
                sx={{ mt: 1 }}
              >
                Go to Direct Access
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/admin/dashboard')}
                sx={{ mt: 1 }}
              >
                Return to Dashboard
              </Button>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Direct Access Tabs */}
      <Box sx={{ display: activeTab !== null ? 'block' : 'none', mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Direct Component Access
        </Typography>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>

          <Box sx={{ p: 3 }}>
            {tabs[activeTab].component}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default UnifiedAcademicManagement;
