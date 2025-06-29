const https = require('https');
const http = require('http');

const BASE_URL = 'https://tktai.up.railway.app';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (options.body) {
      const bodyString = JSON.stringify(options.body);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testEndpoints() {
  console.log('🔍 Testing Railway app endpoints...\n');
  
  const tests = [
    {
      name: 'Root endpoint (/)',
      url: `${BASE_URL}/`,
      method: 'GET'
    },
    {
      name: 'Simple health check (/health-simple)',
      url: `${BASE_URL}/health-simple`,
      method: 'GET'
    },
    {
      name: 'Health check (/health)',
      url: `${BASE_URL}/health`,
      method: 'GET'
    },
    {
      name: 'API health check (/api/v1/health)',
      url: `${BASE_URL}/api/v1/health`,
      method: 'GET'
    },
    {
      name: 'Detailed health check (/api/v1/health/detailed)',
      url: `${BASE_URL}/api/v1/health/detailed`,
      method: 'GET'
    },
    {
      name: 'Ping endpoint (/ping)',
      url: `${BASE_URL}/ping`,
      method: 'GET'
    },
    {
      name: 'Test POST endpoint (/api/v1/test)',
      url: `${BASE_URL}/api/v1/test`,
      method: 'POST',
      body: { test: 'data' }
    },
    {
      name: 'Auth token endpoint (/api/v1/auth/token)',
      url: `${BASE_URL}/api/v1/auth/token`,
      method: 'POST',
      body: { email: 'test@example.com', password: 'testpassword' }
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`URL: ${test.url}`);
      console.log(`Method: ${test.method}`);
      
      const result = await makeRequest(test.url, {
        method: test.method,
        body: test.body
      });
      
      console.log(`Status: ${result.status}`);
      console.log(`Response:`, JSON.stringify(result.data, null, 2));
      console.log('---\n');
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('---\n');
    }
  }
}

testEndpoints().catch(console.error); 