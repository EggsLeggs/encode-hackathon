# Proctora Verifier

A simple Node.js verifier backend for the Proctora dApp that handles Concordium identity verification.

## Features

- Challenge generation for identity verification
- Statement configuration for name-based verification
- Token-based authentication
- Automatic cleanup of expired challenges and tokens
- CORS support for web applications

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## API Endpoints

### GET /challenge?address={address}
Generates a challenge for the given address.

**Response:**
```json
{
  "challenge": "hex-encoded-challenge"
}
```

### GET /statement
Returns the statement configuration for verification.

**Response:**
```json
[
  {
    "type": "reveal",
    "attributeTag": "firstName"
  },
  {
    "type": "reveal", 
    "attributeTag": "lastName"
  }
]
```

### GET /names
Returns available names for verification.

**Response:**
```json
["John Doe", "Jane Smith", "Alice Johnson", "Bob Wilson", "Carol Davis"]
```

### POST /prove
Verifies a presentation and returns an auth token.

**Request:**
```json
{
  "presentation": { ... },
  "userName": "John Doe"
}
```

**Response:**
```json
"auth-token-uuid"
```

### GET /verify-token?token={token}
Verifies an auth token and returns user info.

**Response:**
```json
{
  "valid": true,
  "address": "account-address",
  "userName": "John Doe"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "challenges": 0,
  "tokens": 0
}
```

## Configuration

The verifier uses configuration files in the `config/` directory:

- `statement.json`: Defines what attributes need to be revealed
- `names.json`: List of valid names for verification

## Environment Variables

- `PORT`: Server port (default: 8100)

## Security Notes

This is a simplified verifier for demonstration purposes. In production, you should:

1. Implement proper cryptographic proof verification
2. Use a secure database instead of in-memory storage
3. Add rate limiting and other security measures
4. Implement proper logging and monitoring
