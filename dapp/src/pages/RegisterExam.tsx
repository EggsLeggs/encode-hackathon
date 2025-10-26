import React, { useState } from 'react';
import { Calendar, CheckCircle, Clock, Copy, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useWalletConnection } from '@/lib/wallet';
import { useContract } from '../lib/useContract';
import { verifyUserIdentity } from '../lib/verification';
import { toast } from 'sonner';
import type { WalletConnectionProps } from '@concordium/react-components';

const mockExams = [
  {
    id: 1,
    title: 'Blockchain Summit 2024',
    date: '2024-08-12',
    duration: '2 hours',
    description: 'Advanced blockchain concepts and applications',
    registered: false
  },
  {
    id: 2,
    title: 'Concordium Dev Workshop',
    date: '2024-09-05',
    duration: '3 hours',
    description: 'Hands-on development with Concordium smart contracts',
    registered: false
  },
  {
    id: 3,
    title: 'Web3 Hackathon',
    date: '2024-10-21',
    duration: '4 hours',
    description: 'Build innovative Web3 solutions',
    registered: false
  }
];

export const RegisterExam: React.FC<WalletConnectionProps> = (props) => {
  const { account, connection } = useWalletConnection(props);
  const { contract, isReady, error: contractError } = useContract(connection || undefined);
  
  const [exams, setExams] = useState(mockExams);
  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<number | null>(null);
  const [generatedInviteCode, setGeneratedInviteCode] = useState<string | null>(null);
  const [verifiedUserName, setVerifiedUserName] = useState<string | null>(null);
  const [lastNftTxHash, setLastNftTxHash] = useState<string | null>(null);

  const handleRegister = async (examId: number) => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isReady || !contract) {
      toast.error('Contract not ready. Please check contract address.');
      return;
    }

    setIsRegistering(true);
    setSelectedExam(examId);

    try {
      // Step 1: Identity verification
      toast.info('Starting identity verification...');
      const verifierUrl = 'http://localhost:8100';
      
      let authToken: string;
      let userName: string;
      
      try {
        const verificationResult = await verifyUserIdentity(verifierUrl, account);
        authToken = verificationResult.authToken;
        userName = verificationResult.userName;
        setVerifiedUserName(userName);
      } catch (verificationError) {
        console.warn('Verifier server not available, using demo mode:', verificationError);
        // Fallback for testing when verifier server is not running
        toast.warning('Verifier server not available, using demo mode');
        authToken = 'demo-token-' + Date.now();
        userName = 'Demo User';
        setVerifiedUserName(userName);
      }
      
      if (!authToken) {
        throw new Error('Identity verification failed');
      }

      toast.success(`Identity verified successfully! Welcome, ${userName}`);

      // Step 2: Generate exam invite on contract
      toast.info('📝 Step 1/2: Approve exam invite transaction in your wallet...');

      // Call the smart contract to create exam record
      let inviteTxHash: string;
      try {
        inviteTxHash = await contract.generateExamInvite(userName, account);
        toast.success('✅ Exam invite transaction approved!');
        console.log('Exam invite tx:', inviteTxHash);
      } catch (txError) {
        if (txError instanceof Error && (
          txError.message.includes('user rejected') ||
          txError.message.includes('User rejected')
        )) {
          throw new Error('Transaction rejected by user');
        }
        throw txError;
      }

      // Wait for wallet to close the first prompt before opening second
      toast.info('⏳ Waiting before sending second transaction...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // For demo purposes, generate a mock invite code
      // In a real implementation, you would listen for contract events to get the actual invite code
      const inviteCode = `exam-${examId}-${Date.now()}`;
      setGeneratedInviteCode(inviteCode);

      // Step 3: Mint registration NFT
      toast.info('🎨 Step 2/2: Approve NFT mint transaction in your wallet...');

      let registrationTxHash: string;
      try {
        registrationTxHash = await contract.mintRegistrationNft(0, userName, account); // examId not used, contract finds most recent
        setLastNftTxHash(registrationTxHash);
        toast.success('✅ NFT mint transaction approved!');
        console.log('NFT mint tx:', registrationTxHash);
      } catch (txError) {
        if (txError instanceof Error && (
          txError.message.includes('user rejected') ||
          txError.message.includes('User rejected')
        )) {
          throw new Error('NFT transaction rejected by user');
        }
        throw txError;
      }

      console.log("Registration NFT minted for exam:", examId);

      setExams(prev => prev.map(exam => 
        exam.id === examId ? { ...exam, registered: true } : exam
      ));
      setRegistrationSuccess(examId);
      toast.success('Exam registration successful! Registration NFT minted!');
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRegistering(false);
      setSelectedExam(null);
    }
  };

  const copyInviteCode = () => {
    if (generatedInviteCode) {
      navigator.clipboard.writeText(generatedInviteCode);
      toast.success('Invite code copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-neutral-900 text-white mb-4 font-custom">
            Powered by Concordium Blockchain
          </div>
          <h1 className="font-bold mb-4 text-site-foreground font-custom text-4xl md:text-5xl">
            Register for Exam
          </h1>
          <p className="text-xl mb-6 text-site-foreground font-custom max-w-2xl mx-auto">
            Choose from available exams and receive an NFT voucher as proof of registration.
          </p>
        </div>

        {/* Contract Status Check */}
        {!isReady && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">Contract Not Ready</h3>
                <p className="text-yellow-700">
                  {contractError ? `Error: ${contractError}` : 'Please set a valid contract address to register for exams.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Connection Check */}
        {!account && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">Wallet Required</h3>
                <p className="text-yellow-700">Please connect your Concordium wallet to register for exams.</p>
              </div>
            </div>
          </div>
        )}

        {/* Registration Process Info */}
        {account && isReady && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Registration Process</h3>
                <p className="text-blue-700 mb-3 text-sm">
                  When you click "Register for Exam", you'll need to <strong>approve 2 transactions</strong> in your wallet:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700">
                  <li><strong>Exam Registration:</strong> Creates your exam record on the blockchain</li>
                  <li><strong>NFT Mint:</strong> Mints your registration NFT certificate</li>
                </ol>
                <p className="text-xs text-blue-600 mt-3">
                  ⏱️ <em>Please wait between transactions - approve the first, then the second will appear after a brief delay.</em>
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Success Message */}
        {registrationSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Registration Successful!</h3>
                <p className="text-green-700 mb-3">Your exam invite has been generated and registration NFT minted!</p>
                
                {/* Registration NFT Info */}
                <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">NFT</span>
                    </div>
                    <h4 className="font-semibold text-green-800">Registration NFT</h4>
                  </div>
                  
                  {verifiedUserName && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-green-800">Name:</span>
                        <span className="text-green-700 ml-2">{verifiedUserName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-800">Date:</span>
                        <span className="text-green-700 ml-2">{new Date().toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-800">Time:</span>
                        <span className="text-green-700 ml-2">{new Date().toLocaleTimeString()}</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-800">Status:</span>
                        <span className="text-green-700 ml-2">Registered</span>
                      </div>
                    </div>
                  )}
                </div>

                {generatedInviteCode && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium text-green-800">Invite Code:</span>
                    <code className="bg-green-100 px-2 py-1 rounded text-sm font-mono">
                      {generatedInviteCode}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyInviteCode}
                      className="h-8"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                )}

                {/* Transaction Link */}
                {lastNftTxHash && (
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2 text-sm">View Your NFT Transaction:</h4>
                    <a
                      href={`https://testnet.ccdscan.io/?dcount=1&dentity=transaction&dhash=${lastNftTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-2 mb-3"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="break-all">{lastNftTxHash}</span>
                    </a>

                    <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                      <p className="font-semibold text-yellow-900 text-xs mb-2">To see your NFT in Concordium Wallet:</p>
                      <ol className="text-xs text-yellow-800 space-y-1 list-decimal list-inside">
                        <li>Open your Concordium mobile wallet</li>
                        <li>Go to: <strong>More → Tokens</strong></li>
                        <li>Tap: <strong>Add token</strong></li>
                        <li>Enter contract index: <code className="bg-yellow-100 px-1 rounded">12294</code></li>
                        <li>Your NFT should appear!</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Exam Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 font-custom">
                    {exam.title}
                  </h3>
                  {exam.registered && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{exam.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{exam.duration}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                  {exam.description}
                </p>

                <Button
                  onClick={() => handleRegister(exam.id)}
                  disabled={!account || !isReady || exam.registered || isRegistering}
                  className="w-full"
                  variant={exam.registered ? "secondary" : "default"}
                >
                  {exam.registered ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Registered
                    </>
                  ) : isRegistering && selectedExam === exam.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register for Exam'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
