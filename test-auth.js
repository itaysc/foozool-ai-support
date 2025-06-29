const https = require('https');

const BASE_URL = 'https://tktai.up.railway.app';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script/1.0',
        ...options.headers
      },
      timeout: 30000 // 30 second timeout
    };

    if (options.body) {
      const bodyString = JSON.stringify(options.body);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const req = https.request(requestOptions, (res) => {
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

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testAuthEndpoint() {
  console.log('🔍 Testing authentication endpoint...\n');
  
  const testCases = [
    {
      name: 'Empty request body',
      body: {}
    },
    {
      name: 'Missing password',
      body: { email: 'test@example.com' }
    },
    {
      name: 'Missing email',
      body: { password: 'testpassword' }
    },
    {
      name: 'Invalid email format',
      body: { email: 'invalid-email', password: 'testpassword' }
    },
    {
      name: 'Valid format but non-existent user',
      body: { email: 'nonexistent@example.com', password: 'testpassword' }
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      console.log(`Body:`, JSON.stringify(testCase.body));
      
      const result = await makeRequest(`${BASE_URL}/api/v1/auth/token`, {
        method: 'POST',
        body: testCase.body
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

testAuthEndpoint().catch(console.error); 