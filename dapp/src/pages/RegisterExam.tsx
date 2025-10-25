import React, { useState } from 'react';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useWalletConnection } from '../lib/wallet';
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
  const { account } = useWalletConnection(props);
  const [exams, setExams] = useState(mockExams);
  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<number | null>(null);

  const handleRegister = async (examId: number) => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    setIsRegistering(true);
    setSelectedExam(examId);

    // Simulate registration process
    await new Promise(resolve => setTimeout(resolve, 2000));

    setExams(prev => prev.map(exam => 
      exam.id === examId ? { ...exam, registered: true } : exam
    ));
    setRegistrationSuccess(examId);
    setIsRegistering(false);
    setSelectedExam(null);
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

        {/* Success Message */}
        {registrationSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Registration Successful!</h3>
                <p className="text-green-700">Your NFT voucher has been issued and is now in your wallet.</p>
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
                  disabled={!account || exam.registered || isRegistering}
                  className="w-full"
                  variant={exam.registered ? "secondary" : "default"}
                >
                  {exam.registered ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Registered
                    </>
                  ) : isRegistering && selectedExam === exam.id ? (
                    'Registering...'
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
