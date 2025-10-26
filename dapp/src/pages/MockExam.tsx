import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, CheckCircle, AlertCircle, Award } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ContractDebugger } from '../components/ContractDebugger';
import { CertificateCard } from '../components/CertificateCard';
import { useWalletConnection } from '@/lib/wallet';
import { useContract } from '../lib/useContract';
import { verifyUserIdentity } from '../lib/verification';
import { toast } from 'sonner';
import type { WalletConnectionProps } from '@concordium/react-components';
import { useGrpcClient } from '@concordium/react-components';

const mockExams = {
  1: {
    id: 1,
    title: 'Blockchain Summit 2024',
    duration: 120, // minutes
    description: 'Advanced blockchain concepts and applications',
    questions: [
      {
        id: 1,
        question: 'What is a blockchain?',
        options: [
          'A type of database',
          'A distributed ledger',
          'A cryptocurrency',
          'A smart contract'
        ],
        correct: 1
      },
      {
        id: 2,
        question: 'What is Concordium known for?',
        options: [
          'Privacy-focused blockchain',
          'Identity verification',
          'Zero-knowledge proofs',
          'All of the above'
        ],
        correct: 3
      },
      {
        id: 3,
        question: 'What programming language is used for Concordium smart contracts?',
        options: [
          'Solidity',
          'Rust',
          'JavaScript',
          'Python'
        ],
        correct: 1
      },
      {
        id: 4,
        question: 'What is the main advantage of Concordium\'s identity layer?',
        options: [
          'Lower fees',
          'Privacy compliance',
          'Faster transactions',
          'Higher throughput'
        ],
        correct: 1
      },
      {
        id: 5,
        question: 'What type of consensus mechanism does Concordium use?',
        options: [
          'Proof of Work',
          'Proof of Stake',
          'Proof of Burn',
          'Delegated Proof of Stake'
        ],
        correct: 1
      }
    ]
  },
  2: {
    id: 2,
    title: 'Concordium Dev Workshop',
    duration: 180, // minutes
    description: 'Hands-on development with Concordium smart contracts',
    questions: [
      {
        id: 1,
        question: 'What is a verifiable credential in Concordium?',
        options: [
          'A type of cryptocurrency',
          'A digital identity document that can be verified',
          'A smart contract template',
          'A transaction record'
        ],
        correct: 1
      },
      {
        id: 2,
        question: 'What is Web3?',
        options: [
          'The third version of the web',
          'Decentralized internet',
          'Blockchain-based applications',
          'All of the above'
        ],
        correct: 3
      }
    ]
  },
  3: {
    id: 3,
    title: 'Web3 Hackathon',
    duration: 240, // minutes
    description: 'Build innovative Web3 solutions',
    questions: [
      {
        id: 1,
        question: 'What is the Concordium identity layer used for?',
        options: [
          'Mining rewards',
          'Privacy compliance and regulatory requirements',
          'Transaction fees',
          'Block validation'
        ],
        correct: 1
      }
    ]
  }
};

export const MockExam: React.FC<WalletConnectionProps> = (props) => {
  const { account, connection } = useWalletConnection(props);
  const rpc = useGrpcClient(props.network);
  const { contract, isReady, error: contractError } = useContract(connection || undefined, rpc);
  const [userExams, setUserExams] = useState<number[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0); // Will be set when exam starts
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [certificateMinted, setCertificateMinted] = useState(false);
  const [examineeName, setExamineeName] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);
  const [isGeneratingVoucher, setIsGeneratingVoucher] = useState(false);

  // Debug function
  const handleDebugCIS2 = async () => {
    if (!contract || !account) return;
    await contract.debugCIS2(account);
  };

  // Fetch user exams when component mounts - simulate having registered exams
  useEffect(() => {
    const fetchUserExams = async () => {
      if (!account) return;
      
      setLoadingExams(true);
      try {
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Mock user has registered for first 2 exams only
        setUserExams([1, 2]);
      } catch (error) {
        console.error('Failed to fetch user exams:', error);
        toast.error('Failed to load your exams');
      } finally {
        setLoadingExams(false);
      }
    };

    fetchUserExams();
  }, [account]);

  useEffect(() => {
    if (examStarted && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && examStarted) {
      handleSubmitExam();
    }
  }, [timeLeft, examStarted]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartExam = (examId: number) => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }
    const exam = mockExams[examId as keyof typeof mockExams];
    if (!exam) {
      toast.error('Exam not found');
      return;
    }
    setSelectedExamId(examId);
    setTimeLeft(exam.duration * 60); // Convert minutes to seconds
    setExamStarted(true);
  };

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleSubmitExam = () => {
    if (!selectedExamId) return;
    
    const exam = mockExams[selectedExamId as keyof typeof mockExams];
    if (!exam) return;
    
    // Always pass the exam with 100% score
    setScore(100);
    setExamSubmitted(true);
    setExamStarted(false);
  };

  const handleGenerateCertVoucher = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsGeneratingVoucher(true);
    try {
      toast.info('Verifying identity for certificate voucher...');
      const verifierUrl = 'http://localhost:8100';
      const verificationResult = await verifyUserIdentity(verifierUrl, account);
      const userName = verificationResult.userName;
      
      if (!userName) {
        throw new Error('Identity verification failed');
      }

      // Set the verified name
      setExamineeName(userName);
      
      toast.info('Generating certificate voucher...');
      // Simulate voucher generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCertificateMinted(true);
      setShowCertificate(true);
      toast.success('Certificate voucher generated successfully!');
    } catch (error) {
      console.error('Voucher generation error:', error);
      toast.error(`Failed to generate voucher: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingVoucher(false);
    }
  };

  const handleMintCertificate = async () => {
    if (!account) {
      toast.error('Contract not ready');
      return;
    }

    if (!examineeName.trim()) {
      toast.error('Please enter your name for the certificate');
      return;
    }

    try {
      // Re-verify identity before minting
      toast.info('Verifying identity for certificate...');
      const verifierUrl = 'http://localhost:8100';
      const verificationResult = await verifyUserIdentity(verifierUrl, account);
      const authToken = verificationResult.authToken;
      
      if (!authToken) {
        throw new Error('Identity verification failed');
      }

      toast.info('Minting completion certificate...');
      // Simulate certificate minting
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCertificateMinted(true);
      setShowCertificate(true);
      toast.success('Completion certificate NFT minted successfully!');
    } catch (error) {
      console.error('Certificate minting error:', error);
      toast.error(`Failed to mint certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleNextQuestion = () => {
    if (selectedExamId && currentQuestion < mockExams[selectedExamId as keyof typeof mockExams]?.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Wallet Required</h2>
          <p className="text-gray-500">Please connect your Concordium wallet to take exams.</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contract Not Ready</h2>
          <p className="text-gray-500">
            {contractError ? `Error: ${contractError}` : 'Please set a valid contract address to take exams.'}
          </p>
        </div>
      </div>
    );
  }

  if (showCertificate) {
    const selectedExam = selectedExamId ? mockExams[selectedExamId as keyof typeof mockExams] : null;
    const mockCertificate = {
      tokenId: Math.floor(Math.random() * 1000000),
      examineeName: examineeName || 'John Doe',
      examId: selectedExamId || 1,
      proctorAddress: '3JfE6tGtQ7KTr1VS1fZCNKsqgQii5YjFYNr4V5BcF3o6TQxUu',
      mintedAt: Date.now(),
      metadata: {
        name: `${selectedExam?.title || 'Blockchain Summit 2024'} Certificate`,
        description: `Certificate of completion for ${selectedExam?.title || 'Blockchain Summit 2024'} exam`,
        image: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Certificate'
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Congratulations!</h1>
            <p className="text-lg text-gray-600 mb-6">You have successfully completed the exam and verified your identity.</p>
          </div>
          
          <CertificateCard 
            certificate={mockCertificate}
            onViewBlockchain={() => {
              toast.info('This is a mock certificate - no blockchain transaction was made');
            }}
          />
          
          <div className="text-center mt-8 space-x-4">
            <Button onClick={() => window.location.reload()} variant="outline">
              Take Another Exam
            </Button>
            <Button onClick={() => window.location.href = '/'}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (examSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Exam Completed!</h2>
            <div className="bg-primary/10 rounded-lg p-4 mb-6">
              <p className="text-3xl font-bold text-primary">{score}%</p>
              <p className="text-sm text-gray-500">Your Score</p>
            </div>
            <p className="text-gray-500 mb-6">
              Congratulations! You've passed the exam and can mint a completion certificate NFT.
            </p>
            
            {!certificateMinted && (
              <div className="space-y-4 mb-6">
                <Button
                  onClick={handleGenerateCertVoucher}
                  disabled={isGeneratingVoucher}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Award className="w-4 h-4 mr-2" />
                  {isGeneratingVoucher ? 'Generating Voucher...' : 'Generate Cert Voucher'}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  This will verify your identity using Concordium's identity layer and generate a certificate voucher
                </p>
              </div>
            )}

            {certificateMinted && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-green-800">
                  <Award className="w-5 h-5" />
                  <span className="font-semibold">Completion Certificate Minted!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your completion certificate NFT has been minted and is now in your wallet.
                </p>
              </div>
            )}

            <Button onClick={() => window.location.reload()} className="w-full">
              Take Another Exam
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!examStarted || !selectedExamId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-neutral-900 text-white mb-4 font-custom">
              Powered by Concordium Blockchain
            </div>
            <h1 className="font-bold mb-4 text-site-foreground font-custom text-4xl md:text-5xl">
              Take Exam
            </h1>
            <p className="text-xl mb-6 text-site-foreground font-custom max-w-2xl mx-auto">
              Complete your registered exam and earn a blockchain-verified certificate.
            </p>
          </div>

          {/* Contract Diagnostics - Hidden for demo */}
          {/* <ContractDebugger connection={connection || undefined} account={account} />

          <div className="text-center">
            <button
              onClick={handleDebugCIS2}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-6"
            >
              Debug CIS-2 (Check Console)
            </button>
          </div> */}

          {loadingExams ? (
            <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your exams...</p>
              </div>
            </div>
          ) : userExams.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg p-8">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Exams Found</h2>
                <p className="text-gray-600 mb-6">You haven't registered for any exams yet.</p>
                <Button onClick={() => window.location.href = '/register'} className="w-full">
                  Register for an Exam
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Registered Exams</h2>
                <p className="text-gray-600">Select an exam to start taking it</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userExams.map((examId) => {
                  const exam = mockExams[examId as keyof typeof mockExams];
                  if (!exam) return null;
                  
                  return (
                    <div
                      key={examId}
                      className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg text-gray-900 font-custom">
                            {exam.title}
                          </h3>
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{exam.duration} minutes</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-medium">Questions:</span>
                            <span>{exam.questions.length}</span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 mb-6">
                          {exam.description}
                        </p>

                        <Button
                          onClick={() => handleStartExam(examId)}
                          className="w-full"
                          variant="default"
                        >
                          Start Exam
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const selectedExam = selectedExamId ? mockExams[selectedExamId as keyof typeof mockExams] : null;
  const currentQ = selectedExam?.questions[currentQuestion];

  if (!selectedExam || !currentQ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Exam Error</h2>
          <p className="text-gray-500">Unable to load exam data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Timer */}
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-semibold">Time Remaining:</span>
            </div>
            <div className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-primary'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">
                Question {currentQuestion + 1} of {selectedExam.questions.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / selectedExam.questions.length) * 100}%` }}
                />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQ.question}
            </h2>
          </div>

          <div className="space-y-3 mb-8">
            {currentQ.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                  answers[currentQ.id] === index
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQ.id}`}
                  checked={answers[currentQ.id] === index}
                  onChange={() => handleAnswerSelect(currentQ.id, index)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  answers[currentQ.id] === index
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                }`} />
                <span className="text-gray-900">{option}</span>
              </label>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              onClick={handlePrevQuestion}
              disabled={currentQuestion === 0}
              variant="outline"
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              {currentQuestion === selectedExam.questions.length - 1 ? (
                <Button onClick={handleSubmitExam} className="bg-green-600 hover:bg-green-700">
                  Submit Exam
                </Button>
              ) : (
                <Button onClick={handleNextQuestion}>
                  Next Question
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};