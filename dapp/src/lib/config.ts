//! Contract Configuration Management
//! Handles contract address configuration and persistence

const CONTRACT_ADDRESS_KEY = "proctoring_contract_address";
const DEFAULT_CONTRACT_ADDRESS = "";

export interface ContractConfig {
  address: string;
}

/**
 * Get the current contract address from localStorage
 */
export function getContractAddress(): string {
  if (typeof window === "undefined") {
    return DEFAULT_CONTRACT_ADDRESS;
  }

  try {
    const stored = localStorage.getItem(CONTRACT_ADDRESS_KEY);
    return stored || DEFAULT_CONTRACT_ADDRESS;
  } catch (error) {
    console.error("Failed to get contract address from localStorage:", error);
    return DEFAULT_CONTRACT_ADDRESS;
  }
}

/**
 * Set the contract address in localStorage
 */
export function setContractAddress(address: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(CONTRACT_ADDRESS_KEY, address);
  } catch (error) {
    console.error("Failed to save contract address to localStorage:", error);
  }
}

/**
 * Validate contract address format
 */
export function isValidContractAddress(address: string): boolean {
  if (!address || address.trim() === "") {
    return false;
  }

  // Basic validation for Concordium contract address format
  // Contract addresses are typically just numeric indices
  const contractAddressRegex = /^[0-9]+$/;
  const trimmedAddress = address.trim();

  if (!contractAddressRegex.test(trimmedAddress)) {
    return false;
  }

  // Ensure it's a valid BigInt (not too large)
  try {
    const index = BigInt(trimmedAddress);
    return index >= 0n;
  } catch {
    return false;
  }
}

/**
 * Get contract configuration
 */
export function getContractConfig(): ContractConfig {
  return {
    address: getContractAddress(),
  };
}

/**
 * Update contract configuration
 */
export function updateContractConfig(config: Partial<ContractConfig>): void {
  if (config.address !== undefined) {
    setContractAddress(config.address);
  }
}
