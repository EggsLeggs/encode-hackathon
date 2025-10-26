import React from 'react';
import { Award, Calendar, User, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

interface CertificateCardProps {
  certificate: {
    tokenId: number;
    examineeName: string;
    examId: number;
    proctorAddress: string;
    mintedAt: number;
    metadata?: {
      name?: string;
      description?: string;
      image?: string;
    };
  };
  onViewBlockchain?: () => void;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  onViewBlockchain
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl shadow-lg p-6 max-w-md">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
          <Award className="w-8 h-8 text-yellow-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {certificate.metadata?.name || 'Exam Certificate'}
        </h3>
        <p className="text-sm text-gray-600">
          {certificate.metadata?.description || 'Blockchain-verified exam completion certificate'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
          <User className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">Examinee</p>
            <p className="text-sm text-gray-600">{certificate.examineeName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
          <Award className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">Exam ID</p>
            <p className="text-sm text-gray-600">#{certificate.examId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
          <Calendar className="w-5 h-5 text-purple-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">Issued</p>
            <p className="text-sm text-gray-600">{formatDate(certificate.mintedAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
          <User className="w-5 h-5 text-orange-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">Proctor</p>
            <p className="text-sm text-gray-600 font-mono">{truncateAddress(certificate.proctorAddress)}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-yellow-200">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Token ID: {certificate.tokenId}</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
              Verified
            </span>
          </div>
          
          {onViewBlockchain && (
            <Button
              onClick={onViewBlockchain}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Blockchain
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
