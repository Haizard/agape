import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Breadcrumbs,
  Link,
  Divider,
  alpha,
  styled,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import { GradientHeading } from './StyledComponents';

/**
 * Enhanced Layout Components
 *
 * A collection of layout components with modern styling, animations, and consistent design.
 */

/**
 * PageContainer - A container for pages with consistent styling
 */
export const PageContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
}));

/**
 * ContentContainer - A container for content with consistent styling
 */
export const ContentContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

/**
 * PageHeader - A header for pages with title, subtitle, and actions
 */
export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  color = 'primary',
  ...props
}) => {
  return (
    <Box
      sx={{
        mb: 4,
        ...props.sx,
      }}
      {...props}
    >
      {breadcrumbs && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 2 }}
        >
          {breadcrumbs.map((crumb, index) => (
            <Link
              key={index}
              color="inherit"
              href={crumb.href}
              onClick={crumb.onClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {index === 0 && <HomeIcon fontSize="small" sx={{ mr: 0.5 }} />}
              {crumb.icon && <Box component="span" sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>{crumb.icon}</Box>}
              {crumb.label}
            </Link>
          ))}
        </Breadcrumbs>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <GradientHeading variant="h4" color={color}>
            {title}
          </GradientHeading>

          {subtitle && (
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            {actions}
          </Box>
        )}
      </Box>

      <Divider
        sx={{
          mt: 3,
          mb: 4,
          borderColor: (theme) => alpha(theme.palette[color].main, 0.1),
        }}
      />
    </Box>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
      onClick: PropTypes.func,
      icon: PropTypes.node,
    })
  ),
  actions: PropTypes.node,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  sx: PropTypes.object,
};

/**
 * SectionContainer - A container for sections with consistent styling
 */
export const SectionContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 16,
  boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.05)',
  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  '&:hover': {
    boxShadow: '0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.08)',
  },
}));

/**
 * SectionHeader - A header for sections with title and actions
 */
export const SectionHeader = ({
  title,
  subtitle,
  actions,
  color = 'primary',
  divider = true,
  ...props
}) => {
  return (
    <Box
      sx={{
        mb: divider ? 3 : 2,
        ...props.sx,
      }}
      {...props}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
          mb: 1,
        }}
      >
        <Box>
          <GradientHeading variant="h5" color={color}>
            {title}
          </GradientHeading>

          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {actions && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            {actions}
          </Box>
        )}
      </Box>

      {divider && (
        <Divider
          sx={{
            mt: 2,
            borderColor: (theme) => alpha(theme.palette[color].main, 0.1),
          }}
        />
      )}
    </Box>
  );
};

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  divider: PropTypes.bool,
  sx: PropTypes.object,
};

/**
 * GridContainer - A grid container with consistent spacing
 */
export const GridContainer = ({ spacing = 3, children, ...props }) => {
  return (
    <Grid container spacing={spacing} {...props}>
      {children}
    </Grid>
  );
};

GridContainer.propTypes = {
  spacing: PropTypes.number,
  children: PropTypes.node.isRequired,
};

/**
 * GridItem - A grid item with consistent styling
 */
export const GridItem = ({ xs = 12, sm, md, lg, children, ...props }) => {
  return (
    <Grid item xs={xs} sm={sm} md={md} lg={lg} {...props}>
      {children}
    </Grid>
  );
};

GridItem.propTypes = {
  xs: PropTypes.number,
  sm: PropTypes.number,
  md: PropTypes.number,
  lg: PropTypes.number,
  children: PropTypes.node.isRequired,
};

/**
 * DashboardLayout - A layout for dashboard pages
 */
export const DashboardLayout = ({
  header,
  sidebar,
  children,
  sidebarWidth = 280,
  ...props
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
      }}
      {...props}
    >
      {/* Sidebar */}
      {sidebar && (
        <Box
          component="aside"
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
          }}
        >
          {sidebar}
        </Box>
      )}

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        {header && (
          <Box
            component="header"
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            {header}
          </Box>
        )}

        {/* Content */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 3,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

DashboardLayout.propTypes = {
  header: PropTypes.node,
  sidebar: PropTypes.node,
  children: PropTypes.node.isRequired,
  sidebarWidth: PropTypes.number,
};

/**
 * TwoColumnLayout - A two-column layout for pages
 */
export const TwoColumnLayout = ({
  left,
  right,
  leftWidth = 4,
  rightWidth = 8,
  spacing = 3,
  ...props
}) => {
  return (
    <Grid container spacing={spacing} {...props}>
      <Grid item xs={12} md={leftWidth}>
        {left}
      </Grid>
      <Grid item xs={12} md={rightWidth}>
        {right}
      </Grid>
    </Grid>
  );
};

TwoColumnLayout.propTypes = {
  left: PropTypes.node.isRequired,
  right: PropTypes.node.isRequired,
  leftWidth: PropTypes.number,
  rightWidth: PropTypes.number,
  spacing: PropTypes.number,
};

// Export all layout components
export default {
  PageContainer,
  ContentContainer,
  PageHeader,
  SectionContainer,
  SectionHeader,
  GridContainer,
  GridItem,
  DashboardLayout,
  TwoColumnLayout,
};
