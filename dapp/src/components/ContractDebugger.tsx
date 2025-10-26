import React, { useState } from 'react';
import { Button } from './ui/button';
import { useContract } from '../lib/useContract';
import { toast } from 'sonner';
import type { WalletConnection } from '@concordium/react-components';

interface ContractDebuggerProps {
  connection?: WalletConnection;
  account?: string;
}

export const ContractDebugger: React.FC<ContractDebuggerProps> = ({ connection, account }) => {
  const { contract, isReady } = useContract(connection);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const runDiagnostics = async () => {
    if (!contract || !account) {
      toast.error('Contract or account not ready');
      return;
    }

    setLoading(true);
    const info: any = {};

    try {
      // 1. Get contract stats
      console.log('Fetching contract stats...');
      const stats = await contract.getStats();
      info.stats = stats;
      console.log('Stats:', stats);

      // 2. List user exams
      console.log('Fetching user exams...');
      const userExams = await contract.listUserExams(account);
      info.userExams = userExams;
      console.log('User Exams:', userExams);

      // 3. Try to query tokens by owner using CIS-2 function
      console.log('Querying tokens by owner...');
      try {
        const tokens = await contract.tokensByOwner(account);
        info.ownedTokens = tokens;
        console.log('Owned Tokens:', tokens);
      } catch (e) {
        console.error('Error fetching tokens:', e);
        info.ownedTokensError = String(e);
      }

      // 4. Check balance for token ID 1 (if it exists)
      console.log('Checking balance for token ID 1...');
      try {
        const balance = await contract.balanceOf([{
          token_id: 1,
          address: account
        }]);
        info.balance = balance;
        console.log('Balance:', balance);
      } catch (e) {
        console.error('Error checking balance:', e);
        info.balanceError = String(e);
      }

      setDebugInfo(info);
      toast.success('Diagnostics complete - check console and results below');
    } catch (error) {
      console.error('Diagnostics error:', error);
      toast.error(`Diagnostics failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Contract Diagnostics</h3>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Run diagnostics to check if NFTs are being minted correctly
        </p>
        <Button
          onClick={runDiagnostics}
          disabled={!isReady || !account || loading}
        >
          {loading ? 'Running...' : 'Run Diagnostics'}
        </Button>
      </div>

      {debugInfo && (
        <div className="bg-gray-50 rounded p-4 space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">Contract Stats:</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
              {JSON.stringify(debugInfo.stats, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1">Your Exams:</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
              {JSON.stringify(debugInfo.userExams, null, 2)}
            </pre>
          </div>

          {debugInfo.ownedTokens !== undefined && (
            <div>
              <h4 className="font-semibold text-sm mb-1">Your NFT Tokens:</h4>
              <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                {JSON.stringify(debugInfo.ownedTokens, null, 2)}
              </pre>
            </div>
          )}

          {debugInfo.ownedTokensError && (
            <div>
              <h4 className="font-semibold text-sm mb-1 text-red-600">Token Query Error:</h4>
              <pre className="text-xs bg-red-50 p-2 rounded overflow-x-auto text-red-800">
                {debugInfo.ownedTokensError}
              </pre>
            </div>
          )}

          {debugInfo.balance !== undefined && (
            <div>
              <h4 className="font-semibold text-sm mb-1">Balance Check (Token ID 1):</h4>
              <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                {JSON.stringify(debugInfo.balance, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
