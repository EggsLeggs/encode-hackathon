const axios = require('axios');

const VERIFIER_URL = 'http://localhost:8100';

async function testVerificationFlow() {
  console.log('🧪 Testing Proctora Verifier Flow...\n');
  
  try {
    // 1. Test health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${VERIFIER_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    
    // 2. Test statement endpoint
    console.log('\n2. Testing statement endpoint...');
    const statementResponse = await axios.get(`${VERIFIER_URL}/statement`);
    console.log('✅ Statement retrieved:', statementResponse.data);
    
    // 3. Test names endpoint
    console.log('\n3. Testing names endpoint...');
    const namesResponse = await axios.get(`${VERIFIER_URL}/names`);
    console.log('✅ Names retrieved:', namesResponse.data);
    
    // 4. Test challenge generation
    console.log('\n4. Testing challenge generation...');
    const testAddress = 'test-account-address-123';
    const challengeResponse = await axios.get(`${VERIFIER_URL}/challenge`, {
      params: { address: testAddress }
    });
    console.log('✅ Challenge generated:', challengeResponse.data);
    
    // 5. Test proof verification (simplified)
    console.log('\n5. Testing proof verification...');
    const mockPresentation = {
      presentation_context: challengeResponse.data.challenge,
      verifiable_credential: [
        {
          type: 'Account'
        }
      ]
    };
    
    const proveResponse = await axios.post(`${VERIFIER_URL}/prove`, {
      presentation: mockPresentation,
      userName: 'Test User'
    });
    console.log('✅ Proof verified, token received:', proveResponse.data);
    
    // 6. Test token verification
    console.log('\n6. Testing token verification...');
    const token = proveResponse.data;
    const verifyResponse = await axios.get(`${VERIFIER_URL}/verify-token`, {
      params: { token }
    });
    console.log('✅ Token verified:', verifyResponse.data);
    
    console.log('\n🎉 All tests passed! The verifier is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testVerificationFlow();
