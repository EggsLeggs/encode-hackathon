const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8100;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for challenges and tokens
const challenges = new Map();
const tokens = new Map();

// Configuration
const CHALLENGE_EXPIRY_SECONDS = 600; // 10 minutes
const TOKEN_EXPIRY_SECONDS = 1200; // 20 minutes
const CLEAN_INTERVAL_SECONDS = 600; // 10 minutes

// Load configuration files
const configDir = path.join(__dirname, 'config');
const statementPath = path.join(configDir, 'statement.json');
const namesPath = path.join(configDir, 'names.json');

let statement;
let names;

try {
  statement = JSON.parse(fs.readFileSync(statementPath, 'utf8'));
  names = JSON.parse(fs.readFileSync(namesPath, 'utf8'));
} catch (error) {
  console.error('Error loading configuration files:', error);
  process.exit(1);
}

// Clean up expired challenges and tokens
setInterval(() => {
  const now = Date.now();
  
  // Clean challenges
  for (const [challenge, data] of challenges.entries()) {
    if (now - data.createdAt > CHALLENGE_EXPIRY_SECONDS * 1000) {
      challenges.delete(challenge);
    }
  }
  
  // Clean tokens
  for (const [token, data] of tokens.entries()) {
    if (now - data.createdAt > TOKEN_EXPIRY_SECONDS * 1000) {
      tokens.delete(token);
    }
  }
}, CLEAN_INTERVAL_SECONDS * 1000);

// Routes

// 1. Get challenge
app.get('/challenge', (req, res) => {
  const { address } = req.query;
  
  if (!address) {
    return res.status(400).json({ 
      message: 'Address parameter is required',
      code: 400 
    });
  }
  
  // Generate a random challenge
  const challenge = crypto.randomBytes(32).toString('hex');
  
  // Store challenge with metadata using the raw challenge as the key
  challenges.set(challenge, {
    address,
    challenge,
    createdAt: Date.now()
  });
  
  console.log(`Generated challenge for address: ${address}`);
  
  res.json({ challenge });
});

// 2. Get statement
app.get('/statement', (req, res) => {
  res.json(statement);
});

// 3. Get names (for compatibility with gallery)
app.get('/names', (req, res) => {
  res.json(names);
});

// 4. Verify proof
app.post('/prove', (req, res) => {
  console.log('Received prove request:', JSON.stringify(req.body, null, 2));
  const { presentation, userName } = req.body;
  
  if (!presentation) {
    console.log('No presentation provided');
    return res.status(400).json({
      message: 'Presentation is required',
      code: 400
    });
  }
  
  // For now, we'll do a simplified verification
  // In a real implementation, you would verify the cryptographic proof
  try {
    // Extract challenge from presentation
    const challengeId = presentation.presentationContext || presentation.presentation_context || presentation.challenge;
    
    if (!challengeId) {
      return res.status(400).json({
        message: 'Challenge not found in presentation',
        code: 400
      });
    }
    
    // Check if challenge exists and is valid
    console.log('Looking for challenge:', challengeId);
    console.log('Available challenges:', Array.from(challenges.keys()));
    
    const challengeData = challenges.get(challengeId);
    if (!challengeData) {
      return res.status(400).json({
        message: 'Invalid or expired challenge',
        code: 400
      });
    }
    
    // Check if challenge is not expired
    if (Date.now() - challengeData.createdAt > CHALLENGE_EXPIRY_SECONDS * 1000) {
      challenges.delete(challengeId);
      return res.status(400).json({
        message: 'Challenge has expired',
        code: 400
      });
    }
    
    // For demo purposes, we'll accept any presentation that has the required structure
    // In a real implementation, you would verify the cryptographic proof here
    const verifiableCredential = presentation.verifiableCredential || presentation.verifiable_credential;
    if (!verifiableCredential || !Array.isArray(verifiableCredential)) {
      return res.status(400).json({
        message: 'Invalid presentation format',
        code: 400
      });
    }
    
    // Generate a token
    const token = uuidv4();
    tokens.set(token, {
      address: challengeData.address,
      userName: userName || 'Anonymous',
      createdAt: Date.now()
    });
    
    // Remove used challenge
    challenges.delete(challengeId);
    
    console.log(`Verification successful for address: ${challengeData.address}, user: ${userName || 'Anonymous'}`);
    
    res.json(token);
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      message: `Internal server error during verification: ${error.message}`,
      code: 500
    });
  }
});

// 5. Verify token (for protected routes)
app.get('/verify-token', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({
      message: 'Token is required',
      code: 400
    });
  }
  
  const tokenData = tokens.get(token);
  if (!tokenData) {
    return res.status(401).json({
      message: 'Invalid token',
      code: 401
    });
  }
  
  // Check if token is expired
  if (Date.now() - tokenData.createdAt > TOKEN_EXPIRY_SECONDS * 1000) {
    tokens.delete(token);
    return res.status(401).json({
      message: 'Token has expired',
      code: 401
    });
  }
  
  res.json({
    valid: true,
    address: tokenData.address,
    userName: tokenData.userName
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    challenges: challenges.size,
    tokens: tokens.size
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    code: 500
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Not found',
    code: 404
  });
});

app.listen(PORT, () => {
  console.log(`Proctora Verifier running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Statement: http://localhost:${PORT}/statement`);
  console.log(`Names: http://localhost:${PORT}/names`);
});
