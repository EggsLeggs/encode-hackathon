const axios = require('axios');

async function testSimple() {
  try {
    // 1. Get a challenge
    console.log('Getting challenge...');
    const challengeResponse = await axios.get('http://localhost:8100/challenge?address=test-123');
    const challenge = challengeResponse.data.challenge;
    console.log('Challenge:', challenge);
    
    // 2. Try to verify with that exact challenge
    console.log('\nVerifying with challenge...');
    const proveResponse = await axios.post('http://localhost:8100/prove', {
      presentation: {
        presentation_context: challenge,
        verifiable_credential: [{ type: 'Account' }]
      },
      userName: 'Test User'
    });
    console.log('Success! Token:', proveResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testSimple();
