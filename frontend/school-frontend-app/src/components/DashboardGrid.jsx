import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import SafeDisplay from './common/SafeDisplay';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

// Styled components
const StyledCard = styled(Card)(({ theme, highlight }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '12px',
  transition: 'all 0.3s ease',
  boxShadow: highlight
    ? `0 8px 24px ${theme.palette.primary.main}40`
    : '0 4px 12px rgba(0,0,0,0.05)',
  border: highlight ? `1px solid ${theme.palette.primary.main}` : 'none',
  overflow: 'hidden',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: highlight
      ? `0 12px 28px ${theme.palette.primary.main}60`
      : '0 8px 20px rgba(0,0,0,0.1)',
  },
  '&::before': highlight ? {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  } : {},
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(3),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: '8px 16px',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
  },
}));

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};

const DashboardGrid = ({ items }) => {
  return (
    <Box className="content-container">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          {items.map((item, index) => (
            <Grid
              item
              xs={6}
              sm={6}
              md={4}
              lg={3}
              key={item.id || `dashboard-item-${index}`}
            >
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <StyledCard highlight={item.highlight ? 1 : 0}>
                  <StyledCardContent>
                    <Typography
                      variant="h5"
                      component="h2"
                      noWrap
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                        color: item.highlight ? 'primary.main' : 'text.primary',
                        position: 'relative',
                        pb: 1,
                        '&::after': item.highlight ? {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          width: '40px',
                          height: '3px',
                          backgroundColor: 'primary.main',
                          borderRadius: '2px'
                        } : {}
                      }}
                    >
                      <SafeDisplay value={item.title} />
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1, mb: 2, flexGrow: 1 }}
                    >
                      <SafeDisplay value={item.description} />
                    </Typography>
                    {item.link && (
                      <Box sx={{ mt: 'auto', textAlign: 'right' }}>
                        <StyledButton
                          component={Link}
                          to={item.link}
                          variant="contained"
                          size="small"
                          color={item.highlight ? 'primary' : 'secondary'}
                        >
                          View
                        </StyledButton>
                      </Box>
                    )}
                  </StyledCardContent>
                </StyledCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Box>
  );
};

DashboardGrid.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      link: PropTypes.string, // Optional link property
    })
  ).isRequired
};

// Add default props if needed
DashboardGrid.defaultProps = {
  items: []
};

export default DashboardGrid;


