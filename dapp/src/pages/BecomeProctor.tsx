import React, { useState, useContext, createContext } from 'react';
import { UserCheck, Shield, Award, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useWalletConnection } from '../lib/wallet';
import { useContract } from '../lib/useContract';
import { toast } from 'sonner';
import type { WalletConnectionProps } from '@concordium/react-components';

// Simple context for proctor status
const ProctorContext = createContext<{
  isProctor: boolean;
  setIsProctor: (value: boolean) => void;
  proctorName: string;
  setProctorName: (value: string) => void;
}>({
  isProctor: false,
  setIsProctor: () => {},
  proctorName: '',
  setProctorName: () => {}
});

export const ProctorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProctor, setIsProctor] = useState(() => {
    // Check localStorage for proctor status on initialization
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isProctor') === 'true';
    }
    return false;
  });
  
  const [proctorName, setProctorName] = useState(() => {
    // Check localStorage for proctor name on initialization
    if (typeof window !== 'undefined') {
      return localStorage.getItem('proctorName') || '';
    }
    return '';
  });
  
  return (
    <ProctorContext.Provider value={{ isProctor, setIsProctor, proctorName, setProctorName }}>
      {children}
    </ProctorContext.Provider>
  );
};

export const useProctorStatus = () => useContext(ProctorContext);

export const BecomeProctor: React.FC<WalletConnectionProps> = (props) => {
  const { account } = useWalletConnection(props);
  const { contract, isReady, error: contractError } = useContract();
  const { isProctor, setIsProctor, proctorName: contextProctorName, setProctorName: setContextProctorName } = useProctorStatus();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    qualifications: '',
    experience: ''
  });
  const [isApplying, setIsApplying] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [badgeIssued, setBadgeIssued] = useState(false);
  const [isQuickProctor, setIsQuickProctor] = useState(false);
  const [proctorName, setProctorName] = useState(contextProctorName || '');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuickProctor = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!proctorName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsApplying(true);
    try {
      toast.info('Registering as proctor...');
      
      // Simulate a brief delay for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, just mark as proctor without contract interaction
      setIsProctor(true);
      setBadgeIssued(true);
      setContextProctorName(proctorName);
      
      // Store proctor status and name in localStorage for demo
      localStorage.setItem('isProctor', 'true');
      localStorage.setItem('proctorName', proctorName);
      localStorage.setItem('proctorAccount', account);
      
      toast.success(`Welcome ${proctorName}! Proctor status granted! You can now monitor exams.`);
    } catch (error) {
      console.error('Proctor registration error:', error);
      toast.error(`Failed to register as proctor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isReady || !contract) {
      toast.error('Contract not ready. Please check contract address.');
      return;
    }

    setIsApplying(true);
    try {
      toast.info('Submitting application...');
      await contract.verifyProctorCredential(formData.name);
      setApplicationSubmitted(true);
      // Store proctor status in localStorage for demo
      localStorage.setItem('isProctor', 'true');
      toast.success('Application submitted successfully!');
    } catch (error) {
      console.error('Application error:', error);
      toast.error(`Application failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsApplying(false);
    }
  };

  const handleGetBadge = async () => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    // For demo purposes, just mark as proctor
    setIsProctor(true);
    setBadgeIssued(true);
    // Store proctor status in localStorage for demo
    localStorage.setItem('isProctor', 'true');
    toast.success('Proctor badge issued!');
  };

  // Reset function for testing
  const resetProctorStatus = () => {
    setIsProctor(false);
    setBadgeIssued(false);
    setApplicationSubmitted(false);
    setProctorName('');
    setContextProctorName('');
    localStorage.removeItem('isProctor');
    localStorage.removeItem('proctorName');
    localStorage.removeItem('proctorAccount');
    toast.info('Proctor status reset');
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

  // Note: Contract check removed for demo purposes - quick proctor works without contract

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
              Congratulations {contextProctorName}! You now have a Proctor NFT badge and can monitor exams.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/proctor'}
                className="w-full"
              >
                Go to Proctor Dashboard
              </Button>
              <Button 
                onClick={resetProctorStatus}
                variant="outline"
                className="w-full"
              >
                Reset Proctor Status (Demo)
              </Button>
            </div>
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

        {/* Quick Demo Proctor */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Quick Demo Proctor</h2>
          </div>
          <p className="text-gray-600 mb-4">
            For demo purposes, you can instantly become a proctor by providing your name. This will grant you immediate access to the proctor dashboard.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={proctorName}
                onChange={(e) => setProctorName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button
              onClick={handleQuickProctor}
              disabled={isApplying || !proctorName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isApplying ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Registering as Proctor...
                </div>
              ) : (
                'Become Proctor Instantly'
              )}
            </Button>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Full Proctor Application</h2>
          
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
