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
      timeout: 30000
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

async function testAuthWithValidData() {
  console.log('🔍 Testing authentication with valid data...\n');
  
  // Test with a valid user (you'll need to replace with actual user credentials)
  const testUser = {
    email: 'admin@example.com', // Replace with actual user email
    password: 'password123'     // Replace with actual user password
  };
  
  try {
    console.log(`Testing authentication for: ${testUser.email}`);
    
    const result = await makeRequest(`${BASE_URL}/api/v1/auth/token`, {
      method: 'POST',
      body: testUser
    });
    
    console.log(`Status: ${result.status}`);
    console.log(`Response:`, JSON.stringify(result.data, null, 2));
    
    if (result.status === 200) {
      console.log('✅ Authentication successful!');
    } else if (result.status === 400) {
      console.log('⚠️ User not found or invalid credentials');
    } else if (result.status === 500) {
      console.log('❌ Server error - check environment variables');
    } else if (result.status === 502) {
      console.log('❌ Application failed to respond - database connection issue');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

testAuthWithValidData().catch(console.error); 