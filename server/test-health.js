const http = require('http');

console.log('Testing health check endpoint...');

// Test the health check endpoint
const options = {
  hostname: 'localhost',
  port: process.env.PORT || 80,
  path: '/api/v1/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    if (res.statusCode === 200) {
      console.log('✅ Health check passed!');
      process.exit(0);
    } else {
      console.log('❌ Health check failed!');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error making request:', error);
  process.exit(1);
});

req.end(); 