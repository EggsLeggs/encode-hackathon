# Proctoring Smart Contract

A Concordium smart contract for online proctoring with Web3 ID verification and NFT certificates.

## Features

- **Exam Management**: Generate exam invites, manage proctor sessions
- **Web3 ID Integration**: Verify examinee and proctor identities using Concordium's Web3 ID
- **NFT Certificates**: Mint CIS-2 compliant NFT certificates upon exam completion
- **Role-Based Access**: Proctor verification and access control
- **Event Emission**: Comprehensive event system for frontend integration

## Architecture

### State Management
- `exams`: All exams indexed by exam ID
- `user_exams`: User's exam history by account address
- `proctor_sessions`: Proctor's active sessions
- `nft_certificates`: Minted certificates by token ID
- `verified_proctors`: Set of verified proctor addresses

### Exam Lifecycle
1. **Invite Generation**: Examinee verifies identity and generates exam invite
2. **Proctor Assignment**: Verified proctor joins the exam session
3. **Exam Execution**: Backend handles question delivery and monitoring
4. **Results Submission**: Proctor submits exam results
5. **Certificate Minting**: Examinee re-verifies identity and mints NFT certificate

## Contract Functions

### Core Functions
- `generate_exam_invite`: Generate exam invite after identity verification
- `verify_proctor_credential`: Verify and register proctor credentials
- `join_as_proctor`: Join an exam session as a proctor
- `join_proctor_room`: Join proctor room using invite code
- `submit_exam_results`: Submit exam results (proctor only)
- `mint_certificate`: Mint NFT certificate after identity re-verification

### View Functions
- `get_exam`: Get exam details by ID
- `get_proctor_sessions`: Get all sessions for a proctor
- `list_user_exams`: Get all exams for a user
- `view_certificate`: Get certificate details by token ID
- `is_verified_proctor`: Check if address is a verified proctor
- `get_stats`: Get contract statistics

## Web3 ID Integration

### Examinee Verification
- Reveals `firstName` and `lastName` attributes
- Required before generating exam invite
- Required again before minting certificate

### Proctor Verification
- Reveals `firstName` and `lastName` attributes
- Verifies `role` attribute is in `["proctor", "administrator"]`
- Required before joining exam sessions

## NFT Certificates

Certificates are minted using the CIS-2 standard and include:
- Examinee name (from Web3 ID)
- Exam ID
- Proctor address
- Completion timestamp
- Metadata with additional attributes

## Events

- `ExamInviteGenerated`: Emitted when exam invite is created
- `ProctorJoined`: Emitted when proctor joins exam session
- `ExamSubmitted`: Emitted when exam results are submitted
- `CertificateMinted`: Emitted when certificate is minted
- `ProctorVerified`: Emitted when proctor credentials are verified

## Deployment

### Prerequisites
- Rust and Cargo installed
- Concordium CLI tools installed
- Concordium wallet with test CCD

### Build Contract
```bash
cargo concordium build --out ./deploy-scripts/proctoring.wasm.v1
```

### Deploy to Testnet
```bash
cd deploy-scripts
cargo run -- --node https://grpc.testnet.concordium.com:20000 --account ./your-account.export --module ./proctoring.wasm.v1 --admin YOUR_ADMIN_ADDRESS
```

## Integration with Frontend

The contract is designed to work with the existing dApp verifier backend:

1. **Identity Verification**: Frontend uses existing verifier for Web3 ID verification
2. **Contract Interaction**: Backend calls contract functions after verification
3. **Event Listening**: Frontend listens to contract events for real-time updates
4. **NFT Display**: Frontend displays minted certificates

## Security Considerations

- Identity verification required at key points
- Role-based access control for proctors
- Invite code validation for exam access
- Double verification for certificate minting
- Admin-only functions for contract management

## Testing

Run integration tests:
```bash
cargo test
```

## License

This project is licensed under the MIT License.
