const axios = require('axios');

// Test configuration
const ML_SERVICE_URL = process.env.PYTHON_ML_SERVICE_URL || 'http://ml-service.up.railway.app';

async function testMLService() {
    console.log('Testing ML Service connection...');
    console.log('ML Service URL:', ML_SERVICE_URL);

    // Test 1: Simple SBERT embedding
    try {
        console.log('\n=== Test 1: SBERT Embedding ===');
        const testTickets = [
            {
                subject: 'Test Subject',
                description: 'Test Description'
            }
        ];

        const response = await axios.post(`${ML_SERVICE_URL}/api/v1/sbert-embed`, testTickets, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log('✅ SBERT embedding test successful');
        console.log('Response length:', response.data.length);
        console.log('First embedding length:', response.data[0]?.length);
    } catch (error) {
        console.error('❌ SBERT embedding test failed:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
    }

    // Test 2: Summarization
    try {
        console.log('\n=== Test 2: Summarization ===');
        const testTickets = [
            {
                subject: 'Test Subject',
                description: 'This is a test description for summarization. It should be long enough to be summarized properly.'
            }
        ];

        const response = await axios.post(`${ML_SERVICE_URL}/api/v1/summarize`, testTickets, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log('✅ Summarization test successful');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('❌ Summarization test failed:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
    }

    // Test 3: Health check
    try {
        console.log('\n=== Test 3: Health Check ===');
        const response = await axios.get(`${ML_SERVICE_URL}/health`, {
            timeout: 10000
        });

        console.log('✅ Health check successful');
        console.log('Response:', response.data);
    } catch (error) {
        console.error('❌ Health check failed:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
    }
}

// Run the tests
testMLService().catch(console.error); 