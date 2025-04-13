import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Grid,
  useTheme,
  alpha,
  Button,
  Stack
} from '@mui/material';

/**
 * ArtisticFormLayout - A component for consistent form layouts
 *
 * Features:
 * - Consistent spacing and alignment
 * - Support for section headers
 * - Responsive grid layout
 * - Proper dark/light mode support
 * - Consistent action buttons
 */
const ArtisticFormLayout = ({
  title,
  subtitle,
  children,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  loading = false,
  error = null,
  success = null,
  maxWidth = 'md',
  spacing = 3,
  elevation = 2,
  sections = [],
  actions,
  disableSubmit = false,
  hideActions = false,
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  // Default values for theme properties that might be missing
  const defaultBackgroundPaper = isDark ? '#1E293B' : '#FFFFFF';
  const defaultDividerColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const defaultBorderRadius = 12;
  const defaultBreakpoints = {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
  };

  return (
    <Paper
      elevation={elevation}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: theme.shape?.borderRadius ? theme.shape.borderRadius * 1.5 : defaultBorderRadius,
        backgroundColor: isDark
          ? alpha(theme.palette?.background?.paper || defaultBackgroundPaper, 0.8)
          : (theme.palette?.background?.paper || defaultBackgroundPaper),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette?.divider || defaultDividerColor, isDark ? 0.1 : 0.05)}`,
        boxShadow: isDark
          ? '0 10px 30px rgba(0, 0, 0, 0.2)'
          : '0 10px 30px rgba(0, 0, 0, 0.05)',
        maxWidth: maxWidth === 'custom' ? 'none' : (theme.breakpoints?.values?.[maxWidth] || defaultBreakpoints[maxWidth]),
        width: '100%',
        mx: 'auto',
        position: 'relative',
        overflow: 'hidden',
        ...sx
      }}
      {...props}
    >
      {/* Form header */}
      {(title || subtitle) && (
        <Box sx={{ mb: 3 }}>
          {title && (
            <Typography
              variant="h5"
              component="h2"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {subtitle}
            </Typography>
          )}
          <Divider sx={{ mt: 2 }} />
        </Box>
      )}

      {/* Form content */}
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{ width: '100%' }}
      >
        {/* If sections are provided, render them */}
        {sections.length > 0 ? (
          <Stack spacing={4}>
            {sections.map((section, index) => (
              <Box key={`section-${section.title || index}`}>
                {section.title && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="h6"
                      color="primary"
                      fontWeight="medium"
                    >
                      {section.title}
                    </Typography>
                    {section.subtitle && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {section.subtitle}
                      </Typography>
                    )}
                    <Divider sx={{ mt: 1 }} />
                  </Box>
                )}
                <Grid container spacing={spacing}>
                  {section.fields}
                </Grid>
              </Box>
            ))}
          </Stack>
        ) : (
          // Otherwise, render children directly in a grid
          <Grid container spacing={spacing}>
            {children}
          </Grid>
        )}

        {/* Form actions */}
        {!hideActions && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mt: 4,
              gap: 2,
              flexWrap: 'wrap'
            }}
          >
            {actions ? (
              actions
            ) : (
              <>
                {onCancel && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    {cancelLabel}
                  </Button>
                )}
                {onSubmit && (
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={loading || disableSubmit}
                  >
                    {submitLabel}
                  </Button>
                )}
              </>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

ArtisticFormLayout.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  submitLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  loading: PropTypes.bool,
  error: PropTypes.any,
  success: PropTypes.any,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', 'custom']),
  spacing: PropTypes.number,
  elevation: PropTypes.number,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      subtitle: PropTypes.string,
      fields: PropTypes.node.isRequired,
    })
  ),
  actions: PropTypes.node,
  disableSubmit: PropTypes.bool,
  hideActions: PropTypes.bool,
  sx: PropTypes.object,
};

export default ArtisticFormLayout;
