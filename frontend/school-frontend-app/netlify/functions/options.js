exports.handler = async function(event, context) {
  // This function handles OPTIONS requests for CORS preflight
  console.log('Handling OPTIONS request for CORS preflight');
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Max-Age': '86400'
    },
    body: ''
  };
};
