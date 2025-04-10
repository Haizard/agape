import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Typography,
  Alert
} from '@mui/material';

/**
 * WorkflowStepper Component
 * 
 * A reusable component that guides users through a multi-step workflow
 * Each step can contain its own component or content
 * 
 * @param {Object} props
 * @param {Array} props.steps - Array of step objects with label, description, and component
 * @param {string} props.title - Title of the workflow
 * @param {Function} props.onComplete - Function to call when workflow is completed
 */
const WorkflowStepper = ({ steps, title, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(null);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleComplete = () => {
    setCompleted(true);
    if (onComplete) {
      try {
        onComplete();
      } catch (err) {
        setError(`Error completing workflow: ${err.message}`);
      }
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setCompleted(false);
    setError(null);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      {title && (
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {completed ? (
        <Paper square elevation={0} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Workflow completed!
          </Typography>
          <Typography paragraph>
            You have successfully completed all steps in this workflow.
          </Typography>
          <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
            Start Again
          </Button>
        </Paper>
      ) : (
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                <Typography variant="subtitle1">{step.label}</Typography>
              </StepLabel>
              <StepContent>
                {step.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {step.description}
                  </Typography>
                )}
                
                {/* Render the step component */}
                <Box sx={{ mb: 2 }}>
                  {step.component}
                </Box>

                <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  {index === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleComplete}
                      color="primary"
                    >
                      Finish
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      color="primary"
                    >
                      Continue
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      )}
    </Box>
  );
};

WorkflowStepper.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      component: PropTypes.node.isRequired
    })
  ).isRequired,
  title: PropTypes.string,
  onComplete: PropTypes.func
};

export default WorkflowStepper;
