import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  alpha,
  styled,
} from '@mui/material';
import { GradientHeading, IconContainer, StyledChip } from './StyledComponents';
import LaunchIcon from '@mui/icons-material/Launch';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

/**
 * Enhanced Card Components
 * 
 * A collection of card components with modern styling, animations, and consistent design.
 */

/**
 * FeatureCard - A card for displaying features or options
 */
export const FeatureCard = ({
  title,
  description,
  icon,
  color = 'primary',
  onClick,
  buttonText = 'Learn More',
  elevation = 3,
  sx = {},
  ...props
}) => {
  // Get color values based on the color prop
  const getColorValues = (theme) => {
    const colorObj = theme.palette[color] || theme.palette.primary;
    return {
      main: colorObj.main,
      light: colorObj.light,
      dark: colorObj.dark,
    };
  };

  return (
    <Card
      elevation={elevation}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.05)',
        transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
        position: 'relative',
        transform: 'translateY(0)',
        '&:hover': {
          transform: 'translateY(-10px)',
          boxShadow: '0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.08)',
        },
        ...sx
      }}
      {...props}
    >
      {/* Gradient top border */}
      <Box
        sx={(theme) => ({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '5px',
          background: `linear-gradient(90deg, ${getColorValues(theme).main}, ${getColorValues(theme).light})`,
          zIndex: 1
        })}
      />
      
      <CardContent sx={{ flexGrow: 1, pt: 4, pb: 2 }}>
        {/* Icon in circle */}
        <Box
          sx={(theme) => ({
            display: 'flex',
            alignItems: 'center',
            mb: 2
          })}
        >
          <IconContainer color={color} sx={{ mr: 2 }}>
            {icon}
          </IconContainer>
          
          <GradientHeading variant="h5" color={color}>
            {title}
          </GradientHeading>
        </Box>
        
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            lineHeight: 1.6,
            mb: 2
          }}
        >
          {description}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="contained"
          color={color}
          fullWidth
          onClick={onClick}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            py: 1.2,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)'
            }
          }}
          endIcon={<ArrowForwardIcon />}
        >
          {buttonText}
        </Button>
      </CardActions>
    </Card>
  );
};

FeatureCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  onClick: PropTypes.func,
  buttonText: PropTypes.string,
  elevation: PropTypes.number,
  sx: PropTypes.object,
};

/**
 * ReportCard - A card for displaying report options
 */
export const ReportCard = ({
  title,
  description,
  color = 'primary',
  tags = [],
  buttonText = 'Access Report',
  onClick,
  icon = null,
  sx = {},
  ...props
}) => {
  // Define color values based on the color prop
  const getColorValues = (theme) => {
    const colorObj = theme.palette[color] || theme.palette.primary;
    return {
      main: colorObj.main,
      light: colorObj.light,
      dark: colorObj.dark,
      contrastText: colorObj.contrastText,
    };
  };

  return (
    <Box
      sx={{
        transform: 'translateY(0)',
        transition: 'transform 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-10px)'
        }
      }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.05)',
          transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
          position: 'relative',
          '&:hover': {
            boxShadow: '0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.08)',
          },
          ...sx
        }}
        {...props}
      >
        {/* Gradient top border */}
        <Box
          sx={(theme) => ({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '5px',
            background: `linear-gradient(90deg, ${getColorValues(theme).main}, ${getColorValues(theme).light})`,
            zIndex: 1
          })}
        />
        
        {/* Icon circle in top right */}
        <Box
          sx={(theme) => ({
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: alpha(getColorValues(theme).main, 0.1),
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'rotate(10deg) scale(1.1)',
              background: alpha(getColorValues(theme).main, 0.2),
            }
          })}
        >
          {icon}
        </Box>
        
        <CardContent sx={{ flexGrow: 1, pt: 4, pb: 2 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={(theme) => ({
              fontWeight: 600,
              color: getColorValues(theme).main,
              display: 'flex',
              alignItems: 'center',
              mb: 2
            })}
          >
            {title}
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.6,
              mb: 2
            }}
          >
            {description}
          </Typography>
          
          {tags.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                mb: 2
              }}
            >
              {tags.map((tag, index) => (
                <StyledChip
                  key={index}
                  size="small"
                  label={tag}
                  color={color}
                />
              ))}
            </Box>
          )}
        </CardContent>
        
        <CardActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant="contained"
            color={color}
            fullWidth
            size="large"
            onClick={onClick}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              py: 1.2,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}
            startIcon={<LaunchIcon />}
          >
            {buttonText}
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
};

ReportCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  tags: PropTypes.arrayOf(PropTypes.string),
  buttonText: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.node,
  sx: PropTypes.object,
};

/**
 * StatCard - A card for displaying statistics
 */
export const StatCard = ({
  title,
  value,
  icon,
  color = 'primary',
  trend = null,
  trendLabel = '',
  sx = {},
  ...props
}) => {
  return (
    <Card
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.05)',
        transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.08)',
        },
        ...sx
      }}
      {...props}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            
            {trend !== null && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Chip
                  size="small"
                  label={`${trend > 0 ? '+' : ''}${trend}% ${trendLabel}`}
                  color={trend > 0 ? 'success' : 'error'}
                  sx={{ height: 24 }}
                />
              </Box>
            )}
          </Box>
          
          <Avatar
            sx={(theme) => ({
              bgcolor: alpha(theme.palette[color].main, 0.1),
              color: theme.palette[color].main,
              width: 56,
              height: 56,
            })}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  trend: PropTypes.number,
  trendLabel: PropTypes.string,
  sx: PropTypes.object,
};

/**
 * ProfileCard - A card for displaying user profiles
 */
export const ProfileCard = ({
  name,
  role,
  avatar,
  stats = [],
  actions = [],
  color = 'primary',
  sx = {},
  ...props
}) => {
  return (
    <Card
      sx={{
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.05)',
        transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 14px 28px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.08)',
        },
        ...sx
      }}
      {...props}
    >
      {/* Header with gradient background */}
      <Box
        sx={(theme) => ({
          background: `linear-gradient(45deg, ${theme.palette[color].main} 30%, ${theme.palette[color].light} 90%)`,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'white',
        })}
      >
        <Avatar
          src={avatar}
          sx={{
            width: 80,
            height: 80,
            border: '4px solid white',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            mb: 1,
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {name}
        </Typography>
        <Typography variant="body2">
          {role}
        </Typography>
      </Box>
      
      {/* Stats section */}
      {stats.length > 0 && (
        <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          {stats.map((stat, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                p: 2,
                textAlign: 'center',
                borderRight: index < stats.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
      
      {/* Actions section */}
      <CardActions sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={index === 0 ? 'contained' : 'outlined'}
            color={color}
            fullWidth
            startIcon={action.icon}
            onClick={action.onClick}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)'
              }
            }}
          >
            {action.label}
          </Button>
        ))}
      </CardActions>
    </Card>
  );
};

ProfileCard.propTypes = {
  name: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  avatar: PropTypes.string,
  stats: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      onClick: PropTypes.func.isRequired,
    })
  ),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
  sx: PropTypes.object,
};

// Export all card components
export default {
  FeatureCard,
  ReportCard,
  StatCard,
  ProfileCard,
};
