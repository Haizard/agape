import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length >= 3) {
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          p: 2,
          border: '1px solid #ccc',
          borderRadius: 1,
          boxShadow: 1
        }}
      >
        <Typography variant="subtitle2">{label}</Typography>
        <Typography variant="body2" color="primary">
          Total: TZS {payload[2]?.value?.toLocaleString() || 0}
        </Typography>
        <Typography variant="body2" color="success.main">
          Collected: TZS {payload[0]?.value?.toLocaleString() || 0}
          ({payload[2]?.value ? Math.round((payload[0]?.value || 0) / payload[2].value * 100) : 0}%)
        </Typography>
        <Typography variant="body2" color="error.main">
          Balance: TZS {payload[1]?.value?.toLocaleString() || 0}
          ({payload[2]?.value ? Math.round((payload[1]?.value || 0) / payload[2].value * 100) : 0}%)
        </Typography>
      </Box>
    );
  }
  return null;
};

// Add prop types for the CustomTooltip component
CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string
};

const FeeCollectionChart = ({ data }) => {
  // Prepare data for the chart
  const chartData = data.map(item => ({
    name: item.className,
    collected: item.amountPaid,
    balance: item.balance,
    total: item.totalAmount
  }));

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="collected" name="Collected" stackId="a" fill="#4caf50" />
            <Bar dataKey="balance" name="Balance" stackId="a" fill="#ff9800" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography variant="body1" color="text.secondary">
            No data available
          </Typography>
        </Box>
      )}
    </Box>
  );
};

FeeCollectionChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      className: PropTypes.string,
      collected: PropTypes.number,
      balance: PropTypes.number,
      total: PropTypes.number
    })
  ).isRequired
};


export default FeeCollectionChart;
