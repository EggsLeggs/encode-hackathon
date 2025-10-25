import React, { useState } from 'react';
import { Monitor, Users, Clock, AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useWalletConnection } from '../lib/wallet';
import { useProctorStatus } from './BecomeProctor';
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
  const { isProctor } = useProctorStatus();
  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [monitoringView, setMonitoringView] = useState<'overview' | 'students'>('overview');

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

  const selectedExamData = selectedExam ? mockActiveExams.find(exam => exam.id === selectedExam) : null;

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
                {mockActiveExams.map((exam) => (
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
                      <h3 className="font-medium text-gray-900">{exam.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        exam.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {exam.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{exam.studentCount} students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{exam.timeRemaining} min left</span>
                      </div>
                    </div>
                    
                    {exam.alerts > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm">{exam.alerts} alert(s)</span>
                      </div>
                    )}
                  </div>
                ))}
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
                        <p className="text-2xl font-bold text-primary">{selectedExamData.studentCount}</p>
                        <p className="text-sm text-gray-500">Students</p>
                      </div>
                      <div className="bg-blue-100 rounded-lg p-4 text-center">
                        <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-600">{selectedExamData.timeRemaining}</p>
                        <p className="text-sm text-gray-500">Minutes Left</p>
                      </div>
                      <div className="bg-green-100 rounded-lg p-4 text-center">
                        <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-600">
                          {selectedExamData.studentCount - selectedExamData.alerts}
                        </p>
                        <p className="text-sm text-gray-500">No Issues</p>
                      </div>
                      <div className="bg-red-100 rounded-lg p-4 text-center">
                        <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-red-600">{selectedExamData.alerts}</p>
                        <p className="text-sm text-gray-500">Alerts</p>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          <div>
                            <p className="text-sm font-medium">Suspicious activity detected</p>
                            <p className="text-xs text-gray-500">Bob Smith - 2 minutes ago</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">Student completed exam</p>
                            <p className="text-xs text-gray-500">Alice Johnson - 5 minutes ago</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Eye className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">Exam session started</p>
                            <p className="text-xs text-gray-500">10 minutes ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
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
