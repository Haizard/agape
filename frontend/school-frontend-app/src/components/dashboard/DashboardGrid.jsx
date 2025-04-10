const DashboardGrid = ({ items = [], cols = 12 }) => {
  // Replace defaultProps with default parameters in the function signature
  return (
    <Grid container spacing={2}>
      {items.map((item, index) => (
        <Grid item xs={12} sm={6} md={cols} key={index}>
          {item}
        </Grid>
      ))}
    </Grid>
  );
};

// Remove this if it exists
// DashboardGrid.defaultProps = {
//   items: [],
//   cols: 12
// };

export default DashboardGrid;