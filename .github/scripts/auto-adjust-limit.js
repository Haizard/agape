const axios = require('axios');

async function adjustBuildLimit() {
  try {
    console.log('Checking Render build minutes usage...');
    
    // Get current usage
    const response = await axios.get('https://api.render.com/v1/billing', {
      headers: {
        'Authorization': `Bearer ${process.env.RENDER_API_KEY}`
      }
    });
    
    const currentUsage = response.data.buildMinutesUsed;
    const currentLimit = response.data.buildMinutesLimit;
    
    console.log(`Current usage: ${currentUsage} minutes`);
    console.log(`Current limit: ${currentLimit} minutes`);
    
    // If usage is approaching limit (80%), increase by 20%
    if (currentUsage > currentLimit * 0.8) {
      const newLimit = Math.ceil(currentLimit * 1.2);
      
      console.log(`Usage is approaching limit. Increasing limit to ${newLimit} minutes...`);
      
      await axios.patch('https://api.render.com/v1/billing', {
        buildMinutesLimit: newLimit
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.RENDER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Build limit successfully increased from ${currentLimit} to ${newLimit} minutes`);
    } else {
      console.log('Current usage is within safe limits. No adjustment needed.');
    }
  } catch (error) {
    console.error('Error adjusting build limit:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

adjustBuildLimit();
