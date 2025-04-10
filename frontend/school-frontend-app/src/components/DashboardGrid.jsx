import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import SafeDisplay from './common/SafeDisplay';

const DashboardGrid = ({ items }) => {
  return (
    <Box className="content-container">
      <Grid container spacing={2}>
        {items.map((item, index) => (
          <Grid
            item
            xs={6}
            sm={6}
            md={4}
            lg={3}
            key={item.id || `dashboard-item-${index}`}
          >
            <Card className="dashboard-card">
              <CardContent>
                <Typography
                  variant="h5"
                  component="h2"
                  noWrap
                  gutterBottom
                >
                  <SafeDisplay value={item.title} />
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  <SafeDisplay value={item.description} />
                </Typography>
                {item.link && (
                  <Box sx={{ mt: 2, textAlign: 'right' }}>
                    <Button
                      component={Link}
                      to={item.link}
                      variant="contained"
                      size="small"
                      color="primary"
                    >
                      View
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
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


