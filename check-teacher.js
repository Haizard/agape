const axios = require('axios');

async function checkTeacher() {
  try {
    const response = await axios.get('http://localhost:5000/api/teachers/profile', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2ZhNmFjN2Y1MTFjY2YwY2ZmMWY3ZTEiLCJyb2xlIjoidGVhY2hlciIsImVtYWlsIjoia2FheWFAZ21haWwuY29tIiwidXNlcm5hbWUiOiJLQUFZQSIsImlhdCI6MTc0NTA1ODUzMSwiZXhwIjoxNzQ1MTQ0OTMxfQ.7Ja09s3C5wAn4H6E5iCEw8ipYYn0X6dFIM0_akiMTjA'
      }
    });
    console.log('Teacher profile:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

checkTeacher();
