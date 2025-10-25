import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useWalletConnection } from '../lib/wallet';
import type { WalletConnectionProps } from '@concordium/react-components';

const mockExam = {
  id: 1,
  title: 'Blockchain Fundamentals',
  duration: 120, // minutes
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
    }
  ]
};

export const TakeExam: React.FC<WalletConnectionProps> = (props) => {
  const { account } = useWalletConnection(props);
  const [timeLeft, setTimeLeft] = useState(mockExam.duration * 60); // seconds
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

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

  const handleStartExam = () => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }
    setExamStarted(true);
  };

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleSubmitExam = () => {
    let correctAnswers = 0;
    mockExam.questions.forEach(question => {
      if (answers[question.id] === question.correct) {
        correctAnswers++;
      }
    });
    
    const percentage = Math.round((correctAnswers / mockExam.questions.length) * 100);
    setScore(percentage);
    setExamSubmitted(true);
    setExamStarted(false);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < mockExam.questions.length - 1) {
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
              {score && score >= 70 
                ? "Congratulations! You've passed the exam and earned an NFT certificate."
                : "You didn't pass this time. You can retake the exam after 24 hours."
              }
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Take Another Exam
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!examStarted) {
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

          <div className="bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <BookOpen className="w-8 h-8 text-primary" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{mockExam.title}</h2>
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{mockExam.duration} minutes</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="font-semibold text-lg">Exam Instructions:</h3>
              <ul className="space-y-2 text-gray-500">
                <li>• You have {mockExam.duration} minutes to complete the exam</li>
                <li>• Answer all questions to the best of your ability</li>
                <li>• You can navigate between questions using the buttons</li>
                <li>• The exam will auto-submit when time runs out</li>
                <li>• A passing score of 70% or higher earns you an NFT certificate</li>
              </ul>
            </div>

            <Button onClick={handleStartExam} className="w-full" size="lg">
              Start Exam
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = mockExam.questions[currentQuestion];

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
                Question {currentQuestion + 1} of {mockExam.questions.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / mockExam.questions.length) * 100}%` }}
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
              {currentQuestion === mockExam.questions.length - 1 ? (
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
