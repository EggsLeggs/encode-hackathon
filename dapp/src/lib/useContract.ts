import { useState, useEffect, useCallback } from "react";
import { ProctoringContract } from "./contract";
import { getContractAddress, isValidContractAddress } from "./config";
import type { WalletConnection } from "@concordium/react-components";
import type { ConcordiumGRPCClient } from "@concordium/web-sdk";

export interface UseContractReturn {
  contract: ProctoringContract | null;
  isLoading: boolean;
  error: string | null;
  isReady: boolean;
  contractAddress: string;
}

export function useContract(
  connection?: WalletConnection,
  rpc?: ConcordiumGRPCClient
): UseContractReturn {
  const [contract, setContract] = useState<ProctoringContract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState(getContractAddress());

  const initializeContract = useCallback(async () => {
    if (!contractAddress || !isValidContractAddress(contractAddress)) {
      setContract(null);
      setError("Invalid contract address");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const contractInstance = new ProctoringContract();
      if (connection) {
        contractInstance.setConnection(connection);
      }
      if (rpc) {
        contractInstance.setRpcClient(rpc);
      }
      setContract(contractInstance);
      setError(null);
    } catch (err) {
      console.error("Failed to initialize contract:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initialize contract"
      );
      setContract(null);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, connection, rpc]);

  // Initialize contract when address changes
  useEffect(() => {
    initializeContract();
  }, [initializeContract]);

  // Listen for contract address changes
  useEffect(() => {
    const handleAddressChange = (event: CustomEvent) => {
      setContractAddress(event.detail.address);
    };

    window.addEventListener(
      "contractAddressChanged",
      handleAddressChange as EventListener
    );

    return () => {
      window.removeEventListener(
        "contractAddressChanged",
        handleAddressChange as EventListener
      );
    };
  }, []);

  const isReady = !isLoading && !error && contract !== null;

  return {
    contract,
    isLoading,
    error,
    isReady,
    contractAddress,
  };
}
