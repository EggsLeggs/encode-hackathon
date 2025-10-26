# 🎓 Proctora - Blockchain-Verified Online Proctoring Platform

[![Concordium](https://img.shields.io/badge/Built%20on-Concordium-blue)](https://concordium.com)
[![Web3](https://img.shields.io/badge/Web3-Enabled-green)](https://web3.foundation)
[![NFT](https://img.shields.io/badge/NFT-Certificates-purple)](https://eips.ethereum.org/EIPS/eip-721)
[![Zero-Knowledge](https://img.shields.io/badge/Zero--Knowledge-Proofs-orange)](https://z.cash)

> **Revolutionizing online education with privacy-preserving identity verification and tamper-proof NFT certificates**

## 🚀 What is Proctora?

Proctora is a **Web3-powered online proctoring platform** that solves the critical problem of academic integrity in remote examinations. Built on the **Concordium blockchain**, it combines **zero-knowledge identity verification**, **smart contract automation**, and **NFT certificates** to create a trustless, verifiable exam system.

### 🎯 The Problem We're Solving

- **Academic Fraud**: Traditional online exams are vulnerable to cheating, impersonation, and identity fraud
- **Trust Issues**: Institutions struggle to verify the authenticity of remote exam results  
- **Certificate Forgery**: Paper certificates can be easily forged or manipulated
- **Privacy Concerns**: Current identity verification systems are invasive and centralized
- **No Audit Trail**: No immutable record of exam integrity and completion

## ✨ Key Features

### 🔐 Privacy-Preserving Identity Verification
- **Concordium Web3 ID Integration**: Uses zero-knowledge proofs for identity verification
- **Selective Disclosure**: Students only reveal necessary attributes (name) while maintaining privacy
- **Double Verification**: Identity verified at both registration AND certificate minting
- **Tamper-Proof**: Cryptographic proofs ensure identity authenticity

### 📝 Smart Contract-Powered Exam Management
- **Automated Workflows**: Smart contracts handle the entire exam lifecycle
- **Role-Based Access**: Separate verification for students and proctors
- **Invite System**: Secure, blockchain-generated exam invite codes
- **Real-Time Status**: Live tracking of exam states

### 🏆 NFT Certificate System
- **CIS-2 Compliant NFTs**: Industry-standard non-fungible tokens
- **Immutable Records**: Certificate data permanently stored on blockchain
- **Rich Metadata**: Includes examinee name, exam details, proctor info, timestamps
- **Transferable**: Certificates can be shared, verified, and transferred
- **Fraud-Proof**: Impossible to forge or duplicate

### 👨‍🏫 Proctor Verification & Monitoring
- **Credential Verification**: Proctors must prove their credentials via Web3 ID
- **Session Management**: Proctors can monitor multiple exam sessions
- **Results Submission**: Blockchain-verified exam result submission
- **Audit Trail**: Complete record of proctor actions and decisions

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Smart Contract │    │   Identity      │
│   (React/TS)    │◄──►│   (Rust)         │◄──►│   Verifier      │
│                 │    │                  │    │   (Node.js)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Concordium    │    │   Concordium     │    │   Concordium    │
│   Wallet        │    │   Blockchain     │    │   Web3 ID       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Rust** (latest stable)
- **Concordium CLI** tools
- **Concordium Wallet** with test CCD

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/proctora.git
   cd proctora
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd dapp
   npm install
   
   # Smart contract
   cd ../smart\ contacts/proctoring-contract
   cargo build
   
   # Identity verifier
   cd ../dapp/verifier
   npm install
   ```

3. **Start the development servers**
   ```bash
   # Terminal 1: Start identity verifier
   cd dapp/verifier
   npm start
   
   # Terminal 2: Start frontend
   cd dapp
   npm run dev
   
   # Terminal 3: Deploy smart contract (one-time)
   cd smart\ contacts/proctoring-contract/deploy-scripts
   cargo run -- --node https://grpc.testnet.concordium.com:20000 --account ./your-account.export --module ./proctoring.wasm.v1 --admin YOUR_ADMIN_ADDRESS
   ```

4. **Open your browser**
   - Navigate to `http://localhost:5173`
   - Connect your Concordium wallet
   - Start taking exams!

## 📱 User Journey

### For Students
1. **Connect Wallet** → Link Concordium wallet
2. **Identity Verification** → Prove identity using Web3 ID (reveals name only)
3. **Register for Exam** → Generate blockchain exam invite + receive registration NFT
4. **Take Exam** → Complete exam with proctor monitoring
5. **Mint Certificate** → Re-verify identity and receive completion NFT certificate

### For Proctors
1. **Credential Verification** → Prove proctor credentials via Web3 ID
2. **Join Sessions** → Monitor assigned exam sessions
3. **Oversee Exams** → Real-time monitoring dashboard
4. **Submit Results** → Blockchain-verified result submission

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for components
- **Concordium React Components** for wallet integration

### Smart Contract
- **Rust** with Concordium SDK
- **CIS-2 Standard** for NFT compliance
- **Concordium Smart Contract** framework

### Identity Verification
- **Node.js** backend
- **Concordium Web3 ID** integration
- **Zero-Knowledge Proofs** for privacy

### Blockchain
- **Concordium Testnet** for development
- **Concordium Mainnet** for production
- **Concordium Web3 ID** for identity

## 🔧 Development

### Project Structure
```
proctora/
├── dapp/                          # Frontend application
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/               # Page components
│   │   ├── lib/                 # Utilities and contracts
│   │   └── ...
│   ├── verifier/                # Identity verification backend
│   └── package.json
├── smart contacts/
│   └── proctoring-contract/     # Rust smart contract
│       ├── src/lib.rs           # Main contract logic
│       ├── deploy-scripts/      # Deployment scripts
│       └── tests/               # Contract tests
└── README.md
```

### Available Scripts

```bash
# Frontend development
cd dapp
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Smart contract
cd smart\ contacts/proctoring-contract
cargo build          # Build contract
cargo test           # Run tests
cargo concordium build --out ./deploy-scripts/proctoring.wasm.v1

# Identity verifier
cd dapp/verifier
npm start            # Start verifier server
```

## 🧪 Testing

### Smart Contract Tests
```bash
cd smart\ contacts/proctoring-contract
cargo test
```

### Frontend Tests
```bash
cd dapp
npm test
```

### Integration Tests
```bash
# Start all services and run end-to-end tests
npm run test:integration
```

## 🚀 Deployment

### Smart Contract Deployment
```bash
cd smart\ contacts/proctoring-contract/deploy-scripts
cargo run -- --node https://grpc.testnet.concordium.com:20000 --account ./your-account.export --module ./proctoring.wasm.v1 --admin YOUR_ADMIN_ADDRESS
```

### Frontend Deployment
```bash
cd dapp
npm run build
# Deploy dist/ folder to your hosting service
```

### Production Environment
- Update contract addresses in `dapp/src/lib/config.ts`
- Configure environment variables
- Deploy to Concordium Mainnet

## 📊 Smart Contract Functions

### Core Functions
- `generate_exam_invite` - Generate exam invite after identity verification
- `verify_proctor_credential` - Verify and register proctor credentials
- `join_as_proctor` - Join an exam session as a proctor
- `submit_exam_results` - Submit exam results (proctor only)
- `mint_certificate` - Mint NFT certificate after identity re-verification
- `mint_registration_nft` - Mint registration NFT

### View Functions
- `get_exam` - Get exam details by ID
- `get_proctor_sessions` - Get all sessions for a proctor
- `list_user_exams` - Get all exams for a user
- `get_stats` - Get contract statistics

## 🔒 Security Features

- **Zero-Knowledge Proofs**: Privacy-preserving identity verification
- **Smart Contract Logic**: Automated, trustless execution
- **Role-Based Access**: Separate verification for different user types
- **Immutable Records**: All exam data stored on blockchain
- **Cryptographic Signatures**: All actions cryptographically signed

## 🌟 Key Innovations

### Web3 Identity Integration
- First proctoring platform to use Concordium's Web3 ID
- Privacy-preserving identity verification
- Zero-knowledge proof integration

### Smart Contract Automation
- Complete exam lifecycle on blockchain
- Automated certificate minting
- Event-driven architecture

### NFT Certificate System
- CIS-2 compliant certificates
- Rich metadata and verification
- Transferable and tradeable credentials

## 📈 Impact & Benefits

### For Educational Institutions
- **Reduced Fraud**: Dramatically decrease cheating and impersonation
- **Cost Savings**: Lower proctoring costs through automation
- **Global Reach**: Enable secure remote examinations worldwide
- **Reputation Protection**: Maintain academic integrity standards

### For Students
- **Privacy Protection**: Maintain privacy while proving identity
- **Portable Credentials**: Own and control their certificates
- **Global Recognition**: Blockchain-verified credentials accepted worldwide
- **Fair Assessment**: Level playing field for all students

### For Proctors
- **Efficient Monitoring**: Streamlined proctoring workflow
- **Verified Credentials**: Blockchain-verified proctor status
- **Flexible Scheduling**: Monitor multiple sessions simultaneously
- **Audit Protection**: Complete record of proctoring decisions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Concordium Foundation** for the blockchain infrastructure
- **Concordium Web3 ID** for privacy-preserving identity verification
- **React Community** for the amazing frontend framework
- **Rust Community** for the excellent smart contract development experience

## 📞 Contact

- **Project Link**: [https://github.com/yourusername/proctora](https://github.com/yourusername/proctora)
- **Demo**: [https://proctora-demo.vercel.app](https://proctora-demo.vercel.app)
- **Issues**: [https://github.com/yourusername/proctora/issues](https://github.com/yourusername/proctora/issues)

## 🏆 Hackathon Submission

This project was built for **[Hackathon Name]** and demonstrates:

- ✅ **Innovation**: Novel use of Web3 identity verification in education
- ✅ **Technical Excellence**: Full-stack Web3 application with smart contracts
- ✅ **User Experience**: Intuitive interface for complex blockchain interactions
- ✅ **Real-World Impact**: Solves actual problems in online education
- ✅ **Privacy & Security**: Privacy-preserving identity verification
- ✅ **Scalability**: Built for production use with proper architecture

---

**Built with ❤️ for the future of education**

*Proctora - Where academic integrity meets Web3 innovation*
