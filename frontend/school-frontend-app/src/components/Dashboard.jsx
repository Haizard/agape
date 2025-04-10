import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';

const Dashboard = () => {
  // Example of different card sizes
  return (
    <Grid container spacing={2}>
      {/* Full-width card */}
      <Grid item xs={12}>
        <Card className="dashboard-card">
          <CardContent>
            <Typography variant="h5">Full Width Card</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Half-width cards (2 per row) */}
      <Grid item xs={6}>
        <Card className="dashboard-card">
          <CardContent>
            <Typography variant="h5">Half Width</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6}>
        <Card className="dashboard-card">
          <CardContent>
            <Typography variant="h5">Half Width</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Quarter-width cards on desktop, half-width on mobile */}
      {[1, 2, 3, 4].map((item) => (
        <Grid item xs={6} md={3} key={item}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h5">Quarter Width</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Third-width cards on desktop, half-width on mobile */}
      {[1, 2, 3].map((item) => (
        <Grid item xs={6} md={4} key={item}>
          <Card className="dashboard-card">
            <CardContent>
              <Typography variant="h5">Third Width</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default Dashboard;