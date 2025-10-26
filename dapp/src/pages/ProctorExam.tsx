import React, { useState, useEffect } from 'react';
import { Monitor, Users, Clock, AlertTriangle, CheckCircle, Eye, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useWalletConnection } from '../lib/wallet';
import { useProctorStatus } from './BecomeProctor';
import { useContract } from '../lib/useContract';
import { toast } from 'sonner';
import type { WalletConnectionProps } from '@concordium/react-components';

const mockActiveExams = [
  {
    id: 1,
    title: 'Blockchain Fundamentals',
    studentCount: 12,
    duration: 120,
    timeRemaining: 45,
    status: 'active',
    alerts: 2
  },
  {
    id: 2,
    title: 'Web3 Development',
    studentCount: 8,
    duration: 90,
    timeRemaining: 30,
    status: 'active',
    alerts: 0
  },
  {
    id: 3,
    title: 'Smart Contracts',
    studentCount: 15,
    duration: 150,
    timeRemaining: 0,
    status: 'completed',
    alerts: 1
  }
];

const mockStudents = [
  { id: 1, name: 'Alice Johnson', status: 'active', lastActivity: '2 min ago', alerts: 0 },
  { id: 2, name: 'Bob Smith', status: 'active', lastActivity: '1 min ago', alerts: 1 },
  { id: 3, name: 'Carol Davis', status: 'inactive', lastActivity: '5 min ago', alerts: 0 },
  { id: 4, name: 'David Wilson', status: 'active', lastActivity: '30 sec ago', alerts: 0 },
];

export const ProctorExam: React.FC<WalletConnectionProps> = (props) => {
  const { account } = useWalletConnection(props);
  const { contract, isReady, error: contractError } = useContract();
  const { isProctor } = useProctorStatus();
  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [monitoringView, setMonitoringView] = useState<'overview' | 'students'>('overview');
  const [proctorSessions, setProctorSessions] = useState<number[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [examResults, setExamResults] = useState<{ [examId: number]: { passed: boolean; submitted: boolean } }>({});

  // Load proctor sessions from contract
  useEffect(() => {
    const loadProctorSessions = async () => {
      if (!contract || !account || !isReady) return;

      try {
        setIsLoading(true);
        const sessions = await contract.getProctorSessions(account);
        setProctorSessions(sessions);

        // Load exam details for each session
        const examDetails = await Promise.all(
          sessions.map(async (examId) => {
            const exam = await contract.getExam(examId);
            return exam;
          })
        );

        setExams(examDetails.filter(exam => exam !== null));
      } catch (error) {
        console.error('Error loading proctor sessions:', error);
        toast.error('Failed to load proctor sessions');
      } finally {
        setIsLoading(false);
      }
    };

    loadProctorSessions();
  }, [contract, account, isReady]);

  const handleSubmitResults = async (examId: number, passed: boolean) => {
    if (!contract || !isReady) {
      toast.error('Contract not ready');
      return;
    }

    try {
      toast.info('Submitting exam results...');
      await contract.submitExamResults(examId, passed);
      setExamResults(prev => ({
        ...prev,
        [examId]: { passed, submitted: true }
      }));
      toast.success('Exam results submitted successfully!');
    } catch (error) {
      console.error('Error submitting results:', error);
      toast.error(`Failed to submit results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const refreshSessions = async () => {
    if (!contract || !account || !isReady) return;

    try {
      setIsLoading(true);
      const sessions = await contract.getProctorSessions(account);
      setProctorSessions(sessions);

      const examDetails = await Promise.all(
        sessions.map(async (examId) => {
          const exam = await contract.getExam(examId);
          return exam;
        })
      );

      setExams(examDetails.filter(exam => exam !== null));
      toast.success('Sessions refreshed');
    } catch (error) {
      console.error('Error refreshing sessions:', error);
      toast.error('Failed to refresh sessions');
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Wallet Required</h2>
          <p className="text-gray-500">Please connect your Concordium wallet to access proctor features.</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contract Not Ready</h2>
          <p className="text-gray-500">
            {contractError ? `Error: ${contractError}` : 'Please set a valid contract address to access proctor features.'}
          </p>
        </div>
      </div>
    );
  }

  if (!isProctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Proctor Badge Required</h2>
          <p className="text-gray-500 mb-6">You need a Proctor NFT badge to access this page.</p>
          <Button onClick={() => window.location.href = '/become-proctor'}>
            Get Proctor Badge
          </Button>
        </div>
      </div>
    );
  }

  const selectedExamData = selectedExam ? exams.find(exam => exam.id === selectedExam) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-neutral-900 text-white mb-4 font-custom">
            Powered by Concordium Blockchain
          </div>
          <h1 className="font-bold mb-4 text-site-foreground font-custom text-4xl md:text-5xl">
            Proctor Dashboard
          </h1>
          <p className="text-xl mb-6 text-site-foreground font-custom max-w-2xl mx-auto">
            Monitor active exams and ensure academic integrity with blockchain verification.
          </p>
          <Button
            onClick={refreshSessions}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="mb-4"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Sessions
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Exams List */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Active Exams
              </h2>
              
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading sessions...</p>
                  </div>
                ) : exams.length === 0 ? (
                  <div className="text-center py-8">
                    <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No active proctor sessions</p>
                    <p className="text-sm text-gray-400 mt-1">Join an exam as a proctor to see it here</p>
                  </div>
                ) : (
                  exams.map((exam) => (
                    <div
                      key={exam.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedExam === exam.id
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedExam(exam.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">Exam #{exam.id}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          exam.status === 'InProgress' 
                            ? 'bg-green-100 text-green-800'
                            : exam.status === 'Completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {exam.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>Examinee: {exam.examinee_name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Created: {new Date(exam.created_at).toLocaleDateString()}</span>
                        </div>
                        {exam.proctor_name && (
                          <div className="flex items-center gap-1">
                            <Monitor className="w-4 h-4" />
                            <span>Proctor: {exam.proctor_name}</span>
                          </div>
                        )}
                      </div>
                      
                      {examResults[exam.id]?.submitted && (
                        <div className="flex items-center gap-1 mt-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">
                            Results submitted: {examResults[exam.id].passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Exam Monitoring */}
          <div className="lg:col-span-2">
            {selectedExamData ? (
              <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedExamData.title}
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant={monitoringView === 'overview' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMonitoringView('overview')}
                    >
                      Overview
                    </Button>
                    <Button
                      variant={monitoringView === 'students' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMonitoringView('students')}
                    >
                      Students
                    </Button>
                  </div>
                </div>

                {monitoringView === 'overview' ? (
                  <div className="space-y-6">
                    {/* Exam Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-primary/10 rounded-lg p-4 text-center">
                        <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold text-primary">1</p>
                        <p className="text-sm text-gray-500">Examinee</p>
                      </div>
                      <div className="bg-blue-100 rounded-lg p-4 text-center">
                        <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedExamData ? new Date(selectedExamData.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">Created</p>
                      </div>
                      <div className="bg-green-100 rounded-lg p-4 text-center">
                        <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-600">
                          {selectedExamData?.status === 'Completed' ? 'Yes' : 'No'}
                        </p>
                        <p className="text-sm text-gray-500">Completed</p>
                      </div>
                      <div className="bg-purple-100 rounded-lg p-4 text-center">
                        <Monitor className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-purple-600">
                          {selectedExamData?.proctor_name ? 'Yes' : 'No'}
                        </p>
                        <p className="text-sm text-gray-500">Proctored</p>
                      </div>
                    </div>

                    {/* Exam Details */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Exam Details</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">Examinee</p>
                            <p className="text-xs text-gray-500">{selectedExamData?.examinee_name || 'Unknown'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <Clock className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">Status</p>
                            <p className="text-xs text-gray-500">{selectedExamData?.status || 'Unknown'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                          <Monitor className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium">Proctor</p>
                            <p className="text-xs text-gray-500">{selectedExamData?.proctor_name || 'Not assigned'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Results */}
                    {selectedExamData && selectedExamData.status === 'Completed' && !examResults[selectedExamData.id]?.submitted && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-yellow-800 mb-3">Submit Exam Results</h4>
                        <p className="text-sm text-yellow-700 mb-4">
                          The exam has been completed. Please review and submit the results.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSubmitResults(selectedExamData.id, true)}
                            className="bg-green-600 hover:bg-green-700"
                            size="sm"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Pass
                          </Button>
                          <Button
                            onClick={() => handleSubmitResults(selectedExamData.id, false)}
                            variant="destructive"
                            size="sm"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Fail
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Student Monitoring</h3>
                    <div className="space-y-3">
                      {mockStudents.map((student) => (
                        <div
                          key={student.id}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            student.alerts > 0 
                              ? 'border-red-200 bg-red-50' 
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              student.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-500">Last activity: {student.lastActivity}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {student.alerts > 0 && (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg p-12 text-center">
                <Monitor className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select an Exam</h3>
                <p className="text-gray-500">
                  Choose an exam from the list to start monitoring students and ensuring exam integrity.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
