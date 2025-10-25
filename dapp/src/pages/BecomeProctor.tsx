import React, { useState, useContext, createContext } from 'react';
import { UserCheck, Shield, Award, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useWalletConnection } from '../lib/wallet';
import type { WalletConnectionProps } from '@concordium/react-components';

// Simple context for proctor status
const ProctorContext = createContext<{
  isProctor: boolean;
  setIsProctor: (value: boolean) => void;
}>({
  isProctor: false,
  setIsProctor: () => {}
});

export const ProctorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProctor, setIsProctor] = useState(false);
  
  return (
    <ProctorContext.Provider value={{ isProctor, setIsProctor }}>
      {children}
    </ProctorContext.Provider>
  );
};

export const useProctorStatus = () => useContext(ProctorContext);

export const BecomeProctor: React.FC<WalletConnectionProps> = (props) => {
  const { account } = useWalletConnection(props);
  const { isProctor, setIsProctor } = useProctorStatus();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    qualifications: '',
    experience: ''
  });
  const [isApplying, setIsApplying] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [badgeIssued, setBadgeIssued] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitApplication = async () => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    setIsApplying(true);
    // Simulate application process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setApplicationSubmitted(true);
    setIsApplying(false);
  };

  const handleGetBadge = async () => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    // Simulate NFT badge issuance
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProctor(true);
    setBadgeIssued(true);
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Wallet Required</h2>
          <p className="text-gray-500">Please connect your Concordium wallet to become a proctor.</p>
        </div>
      </div>
    );
  }

  if (isProctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Proctor Badge Earned!</h2>
            <p className="text-gray-500 mb-6">
              Congratulations! You now have a Proctor NFT badge and can monitor exams.
            </p>
            <Button 
              onClick={() => window.location.href = '/proctor'}
              className="w-full"
            >
              Go to Proctor Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-neutral-900 text-white mb-4 font-custom">
            Powered by Concordium Blockchain
          </div>
          <h1 className="font-bold mb-4 text-site-foreground font-custom text-4xl md:text-5xl">
            Become a Proctor
          </h1>
          <p className="text-xl mb-6 text-site-foreground font-custom max-w-2xl mx-auto">
            Join our network of trusted proctors and help ensure exam integrity with blockchain verification.
          </p>
        </div>

        {/* Proctor Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg p-6 text-center">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Secure Monitoring</h3>
            <p className="text-sm text-gray-500">
              Monitor exams with advanced security features and blockchain verification.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg p-6 text-center">
            <Award className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">NFT Badge</h3>
            <p className="text-sm text-gray-500">
              Receive a verifiable NFT badge proving your proctor credentials.
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg p-6 text-center">
            <UserCheck className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Trusted Network</h3>
            <p className="text-sm text-gray-500">
              Join a community of verified proctors ensuring exam integrity.
            </p>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Proctor Application</h2>
          
          {!applicationSubmitted ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitApplication(); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Educational Qualifications
                </label>
                <textarea
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Please list your educational background and relevant qualifications..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Proctoring Experience
                </label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe any previous proctoring or educational experience..."
                />
              </div>

              <Button
                type="submit"
                disabled={isApplying}
                className="w-full"
                size="lg"
              >
                {isApplying ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Application Submitted!</h3>
              <p className="text-gray-500 mb-6">
                Your application has been received. For this demo, you can immediately get your Proctor NFT badge.
              </p>
              <Button
                onClick={handleGetBadge}
                disabled={badgeIssued}
                className="w-full"
                size="lg"
              >
                {badgeIssued ? 'Badge Already Issued' : 'Get Proctor NFT Badge'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
