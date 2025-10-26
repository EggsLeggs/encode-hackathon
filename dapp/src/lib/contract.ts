//! # Proctoring Contract Integration
//!
//! This module provides TypeScript interfaces and helper functions for interacting with the proctoring smart contract.

import {
  AccountTransactionType,
  CcdAmount,
  ContractAddress,
  ContractName,
  ReceiveName,
  EntrypointName,
  Energy,
  ConcordiumGRPCClient,
  ReturnValue,
  Parameter,
} from "@concordium/web-sdk";
import type { WalletConnection } from "@concordium/react-components";
import { Buffer } from "buffer/";
import { getContractAddress } from "./config";

// Helper functions for decoding contract responses
function decodeVecU64(buffer: Buffer): number[] {
  if (!buffer || buffer.length === 0) {
    return [];
  }

  try {
    // Concordium uses little-endian encoding
    // Vec<u64> is encoded as: [length: u32][data: u64[]]
    const view = new DataView(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );

    // Read the length (first 4 bytes, little-endian)
    const length = view.getUint32(0, true);

    if (length === 0) {
      return [];
    }

    const result: number[] = [];
    let offset = 4; // Skip the length field

    for (let i = 0; i < length; i++) {
      // Read u64 (8 bytes, little-endian)
      const low = view.getUint32(offset, true);
      const high = view.getUint32(offset + 4, true);
      const value = high * 0x100000000 + low;
      result.push(Number(value));
      offset += 8;
    }

    return result;
  } catch (error) {
    console.error("Failed to decode Vec<u64>:", error);
    return [];
  }
}

function decodeOption<T>(
  buffer: Buffer,
  decoder: (buf: Buffer) => T
): T | null {
  if (!buffer || buffer.length === 0) {
    return null;
  }

  try {
    // Option<T> is encoded as: [0] for None, [1][data] for Some
    const view = new DataView(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );
    const isSome = view.getUint8(0);

    if (isSome === 0) {
      return null; // None
    } else if (isSome === 1) {
      // Some - decode the remaining data
      const remainingBuffer = buffer.slice(1);
      return decoder(remainingBuffer);
    } else {
      console.error("Invalid Option encoding");
      return null;
    }
  } catch (error) {
    console.error("Failed to decode Option:", error);
    return null;
  }
}

function decodeStats(buffer: Buffer): ContractStats {
  if (!buffer || buffer.length === 0) {
    return {
      total_exams: 0,
      total_certificates: 0,
      total_registration_nfts: 0,
    };
  }

  try {
    // Stats struct: { total_exams: u64, total_certificates: u128, total_registration_nfts: u128 }
    const view = new DataView(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );
    let offset = 0;

    // Read total_exams (u64)
    const examsLow = view.getUint32(offset, true);
    const examsHigh = view.getUint32(offset + 4, true);
    const total_exams = Number(examsHigh * 0x100000000 + examsLow);
    offset += 8;

    // Read total_certificates (u32)
    const total_certificates = view.getUint32(offset, true);
    offset += 4;

    // Read total_registration_nfts (u32)
    const total_registration_nfts = view.getUint32(offset, true);
    offset += 4;

    return {
      total_exams,
      total_certificates,
      total_registration_nfts,
    };
  } catch (error) {
    console.error("Failed to decode Stats:", error);
    return {
      total_exams: 0,
      total_certificates: 0,
      total_registration_nfts: 0,
    };
  }
}

function decodeExam(buffer: Buffer): Exam | null {
  if (!buffer || buffer.length === 0) {
    return null;
  }

  try {
    // Exam struct from contract: { id: u64, examinee: AccountAddress, examinee_name: String, invite_code: String, proctor: Option<AccountAddress>, proctor_name: Option<String>, status: ExamStatus, created_at: Timestamp, completed_at: Option<Timestamp>, passed: Option<bool>, identity_verified_for_cert: bool }
    const view = new DataView(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );
    let offset = 0;

    // Read id (u64)
    const idLow = view.getUint32(offset, true);
    const idHigh = view.getUint32(offset + 4, true);
    const id = Number(idHigh * 0x100000000 + idLow);
    offset += 8;

    // Read examinee (AccountAddress - 32 bytes)
    const examineeBytes = buffer.slice(offset, offset + 32);
    const examinee = Buffer.from(examineeBytes).toString("hex");
    offset += 32;

    // Read examinee_name (String - length + data)
    const nameLength = view.getUint32(offset, true);
    offset += 4;
    const nameBytes = buffer.slice(offset, offset + nameLength);
    const examinee_name = new TextDecoder().decode(nameBytes);
    offset += nameLength;

    // Read invite_code (String)
    const codeLength = view.getUint32(offset, true);
    offset += 4;
    const codeBytes = buffer.slice(offset, offset + codeLength);
    const invite_code = new TextDecoder().decode(codeBytes);
    offset += codeLength;

    // For now, return a simplified exam structure
    // TODO: Decode remaining fields (proctor, status, timestamps, etc.)
    return {
      id,
      examinee,
      examinee_name,
      invite_code,
      proctor: undefined, // TODO: Decode Option<AccountAddress>
      proctor_name: undefined, // TODO: Decode Option<String>
      status: "InviteGenerated", // TODO: Decode ExamStatus enum
      created_at: Date.now().toString(), // TODO: Decode Timestamp
      completed_at: undefined, // TODO: Decode Option<Timestamp>
      passed: undefined, // TODO: Decode Option<bool>
      identity_verified_for_cert: false, // TODO: Decode bool
    };
  } catch (error) {
    console.error("Failed to decode Exam:", error);
    return null;
  }
}

// Contract function names
export const CONTRACT_FUNCTIONS = {
  GENERATE_INVITE: "generate_exam_invite",
  VERIFY_PROCTOR: "verify_proctor_credential",
  JOIN_PROCTOR: "join_as_proctor",
  JOIN_ROOM: "join_proctor_room",
  SUBMIT_RESULTS: "submit_exam_results",
  MINT_CERTIFICATE: "mint_certificate",
  MINT_REGISTRATION_NFT: "mint_registration_nft",
  GET_EXAM: "get_exam",
  GET_PROCTOR_SESSIONS: "get_proctor_sessions",
  LIST_USER_EXAMS: "list_user_exams",
  GET_STATS: "get_stats",
  // CIS-2 functions
  BALANCE_OF: "balanceOf",
  TOKEN_METADATA: "tokenMetadata",
  TOKENS_BY_OWNER: "tokensByOwner",
} as const;

// Contract parameter types
export interface GenerateInviteParams {
  examinee_name: string;
}

export interface JoinProctorParams {
  exam_id: number;
  proctor_name: string;
}

export interface JoinRoomParams {
  invite_code: string;
}

export interface SubmitResultsParams {
  exam_id: number;
  passed: boolean;
}

export interface MintCertificateParams {
  exam_id: number;
  examinee_name: string;
}

export interface MintRegistrationNFTParams {
  exam_id: number;
  examinee_name: string;
}

// Contract response types
export interface Exam {
  id: number;
  examinee: string;
  examinee_name: string;
  invite_code: string;
  proctor?: string;
  proctor_name?: string;
  status: "InviteGenerated" | "InProgress" | "AwaitingResults" | "Completed";
  created_at: string;
  completed_at?: string;
  passed?: boolean;
  identity_verified_for_cert: boolean;
}

export interface Certificate {
  token_id: number;
  exam_id: number;
  examinee: string;
  examinee_name: string;
  proctor: string;
  timestamp: string;
}

export interface RegistrationNFT {
  token_id: number;
  exam_id: number;
  examinee: string;
  examinee_name: string;
  registration_date: string;
}

export interface ContractStats {
  total_exams: number;
  total_certificates: number;
  total_registration_nfts: number;
}

// CIS-2 Types
export interface BalanceOfQuery {
  token_id: number;
  address: string;
}

export interface BalanceOfQueryParams {
  queries: BalanceOfQuery[];
}

export interface BalanceOfQueryResponse {
  results: number[];
}

export interface TokenMetadataQueryParams {
  queries: number[];
}

export interface MetadataUrl {
  url: string;
  hash?: string;
}

export interface TokenMetadataQueryResponse {
  results: MetadataUrl[];
}

// CIS-2 compliant NFT metadata
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  animation_url?: string;
}

// Registration certificate metadata
export interface RegistrationCertificateMetadata extends NFTMetadata {
  name: string; // "Exam Registration Certificate"
  description: string; // Detailed description
  image: string; // Certificate image URL
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string; // Link to exam details
}

// Contract interaction class
export class ProctoringContract {
  private contractAddress: string;
  private connection: WalletConnection | undefined;
  private rpc: ConcordiumGRPCClient | undefined;

  constructor(contractAddress?: string) {
    const addressString = getContractAddress();
    if (addressString) {
      this.contractAddress = addressString;
    } else if (contractAddress) {
      this.contractAddress = contractAddress;
    } else {
      throw new Error("No contract address provided");
    }
  }

  setConnection(connection: WalletConnection) {
    this.connection = connection;
  }

  setRpcClient(rpc: ConcordiumGRPCClient) {
    this.rpc = rpc;
  }

  // Helper method to make contract view calls
  private async makeContractViewCall(
    entrypoint: string,
    parameter?: any
  ): Promise<any> {
    if (!this.rpc) {
      throw new Error("RPC client not initialized");
    }

    try {
      // Parse contract address
      let contractIndex: bigint;
      try {
        contractIndex = BigInt(this.contractAddress);
      } catch (error) {
        throw new Error(
          `Invalid contract address format: ${this.contractAddress}. Expected a numeric index.`
        );
      }
      const contractAddress = ContractAddress.create(contractIndex, 0);

      const contractName = ContractName.fromString("proctoring_contract");
      const receiveName = ReceiveName.create(
        contractName,
        EntrypointName.fromString(entrypoint)
      );

      console.log("Making contract view call:", {
        entrypoint,
        parameter,
        contractAddress: contractAddress.toString(),
      });

      // Serialize parameter if provided
      let serializedParameter: ReturnType<typeof Parameter.fromBuffer> | undefined;
      if (parameter !== undefined) {
        serializedParameter = this.serializeParameter(entrypoint, parameter);
      }

      // Make the view call
      const result = await this.rpc.invokeContract({
        contract: contractAddress,
        method: receiveName,
        parameter: serializedParameter,
      });

      if (!result) {
        throw new Error(`View call to ${entrypoint} returned no result`);
      }

      switch (result.tag) {
        case "failure": {
          // Handle BigInt serialization
          const reasonStr =
            typeof result.reason === "bigint"
              ? result.reason.toString()
              : JSON.stringify(result.reason, (key, value) =>
                  typeof value === "bigint" ? value.toString() : value
                );
          throw new Error(`View call to ${entrypoint} failed: ${reasonStr}`);
        }
        case "success": {
          if (result.returnValue === undefined) {
            return null; // No return value
          }

          // For now, return the raw buffer - in a real implementation,
          // you would decode this based on your contract's return types
          const buffer = Buffer.from(ReturnValue.toBuffer(result.returnValue));
          return buffer;
        }
        default: {
          throw new Error("Unexpected result tag");
        }
      }
    } catch (error) {
      console.error("Contract view call failed:", error);
      throw error;
    }
  }

  // Generate CIS-2 compliant metadata for registration certificate
  private generateCertificateMetadata(examData: {
    examId: number;
    examTitle: string;
    examDate: string;
    examDuration: string;
    examineeName: string;
    inviteCode: string;
  }): RegistrationCertificateMetadata {
    const registrationDate = new Date().toISOString();

    return {
      name: `Exam Registration Certificate - ${examData.examTitle}`,
      description: `Official registration certificate for ${examData.examTitle}. This NFT certifies that ${examData.examineeName} has successfully registered for the exam and completed identity verification.`,
      image: `https://api.proctora.com/certificates/registration-${
        examData.examId
      }-${Date.now()}.png`,
      attributes: [
        {
          trait_type: "Exam Title",
          value: examData.examTitle,
        },
        {
          trait_type: "Examinee Name",
          value: examData.examineeName,
        },
        {
          trait_type: "Registration Date",
          value: registrationDate,
        },
        {
          trait_type: "Exam Date",
          value: examData.examDate,
        },
        {
          trait_type: "Duration",
          value: examData.examDuration,
        },
        {
          trait_type: "Invite Code",
          value: examData.inviteCode,
        },
        {
          trait_type: "Certificate Type",
          value: "Registration",
        },
        {
          trait_type: "Status",
          value: "Registered",
        },
        {
          trait_type: "Blockchain",
          value: "Concordium",
        },
      ],
      external_url: `https://proctora.com/exam/${examData.examId}`,
      animation_url: `https://api.proctora.com/certificates/animation-${examData.examId}.mp4`,
    };
  }

  // Helper method to serialize contract parameters
  private serializeParameter(
    entrypoint: string,
    parameter: any
  ): ReturnType<typeof Parameter.fromBuffer> {
    try {
      console.log(
        "Serializing parameter for entrypoint:",
        entrypoint,
        parameter
      );

      // Create a buffer to hold the serialized data
      let buffer: Buffer;

      // Serialize based on the entrypoint and parameter type
      if (entrypoint === CONTRACT_FUNCTIONS.GENERATE_INVITE) {
        // GenerateInviteParams: { examinee_name: String }
        const name = parameter.examinee_name || "";
        const nameBytes = Buffer.from(name, "utf8");
        const nameLength = nameBytes.length;

        // String format: [length: u32][data: bytes]
        buffer = Buffer.allocUnsafe(4 + nameLength);
        buffer.writeUInt32LE(nameLength, 0);
        nameBytes.copy(buffer, 4);
      } else if (
        entrypoint === CONTRACT_FUNCTIONS.MINT_REGISTRATION_NFT ||
        entrypoint === CONTRACT_FUNCTIONS.MINT_CERTIFICATE
      ) {
        // MintRegistrationNFTParams / MintCertificateParams: { exam_id: u64, examinee_name: String }
        const examId = parameter.exam_id || 0;
        const name = parameter.examinee_name || "";
        const nameBytes = Buffer.from(name, "utf8");
        const nameLength = nameBytes.length;

        // Format: [exam_id: u64][examinee_name: String]
        buffer = Buffer.allocUnsafe(8 + 4 + nameLength);

        // Write exam_id (u64, little-endian)
        const low = examId & 0xffffffff;
        const high = Math.floor(examId / 0x100000000);
        buffer.writeUInt32LE(low, 0);
        buffer.writeUInt32LE(high, 4);

        // Write examinee_name (String)
        buffer.writeUInt32LE(nameLength, 8);
        nameBytes.copy(buffer, 12);
      } else if (entrypoint === CONTRACT_FUNCTIONS.JOIN_PROCTOR) {
        // JoinProctorParams: { exam_id: u64, proctor_name: String }
        const examId = parameter.exam_id || 0;
        const name = parameter.proctor_name || "";
        const nameBytes = Buffer.from(name, "utf8");
        const nameLength = nameBytes.length;

        // Format: [exam_id: u64][proctor_name: String]
        buffer = Buffer.allocUnsafe(8 + 4 + nameLength);

        // Write exam_id (u64, little-endian)
        const low = examId & 0xffffffff;
        const high = Math.floor(examId / 0x100000000);
        buffer.writeUInt32LE(low, 0);
        buffer.writeUInt32LE(high, 4);

        // Write proctor_name (String)
        buffer.writeUInt32LE(nameLength, 8);
        nameBytes.copy(buffer, 12);
      } else if (entrypoint === CONTRACT_FUNCTIONS.JOIN_ROOM) {
        // JoinRoomParams: { invite_code: String }
        const code = parameter.invite_code || "";
        const codeBytes = Buffer.from(code, "utf8");
        const codeLength = codeBytes.length;

        // String format: [length: u32][data: bytes]
        buffer = Buffer.allocUnsafe(4 + codeLength);
        buffer.writeUInt32LE(codeLength, 0);
        codeBytes.copy(buffer, 4);
      } else if (entrypoint === CONTRACT_FUNCTIONS.SUBMIT_RESULTS) {
        // SubmitResultsParams: { exam_id: u64, passed: bool }
        const examId = parameter.exam_id || 0;
        const passed = parameter.passed ? 1 : 0;

        // Format: [exam_id: u64][passed: bool (u8)]
        buffer = Buffer.allocUnsafe(8 + 1);

        // Write exam_id (u64, little-endian)
        const low = examId & 0xffffffff;
        const high = Math.floor(examId / 0x100000000);
        buffer.writeUInt32LE(low, 0);
        buffer.writeUInt32LE(high, 4);

        // Write passed (bool as u8)
        buffer.writeUInt8(passed, 8);
      } else if (entrypoint === CONTRACT_FUNCTIONS.VERIFY_PROCTOR) {
        // String parameter for proctor name
        const name = typeof parameter === "string" ? parameter : "";
        const nameBytes = Buffer.from(name, "utf8");
        const nameLength = nameBytes.length;

        // String format: [length: u32][data: bytes]
        buffer = Buffer.allocUnsafe(4 + nameLength);
        buffer.writeUInt32LE(nameLength, 0);
        nameBytes.copy(buffer, 4);
      } else if (entrypoint === CONTRACT_FUNCTIONS.GET_EXAM) {
        // u64 parameter
        const examId = typeof parameter === "number" ? parameter : 0;
        buffer = Buffer.allocUnsafe(8);

        // Write u64 (little-endian)
        const low = examId & 0xFFFFFFFF;
        const high = Math.floor(examId / 0x100000000);
        buffer.writeUInt32LE(low, 0);
        buffer.writeUInt32LE(high, 4);
      } else if (
        entrypoint === CONTRACT_FUNCTIONS.LIST_USER_EXAMS ||
        entrypoint === CONTRACT_FUNCTIONS.GET_PROCTOR_SESSIONS
      ) {
        // AccountAddress parameter (32 bytes)
        const address = typeof parameter === "string" ? parameter : "";

        // Remove any prefixes and convert hex to buffer
        const cleanAddress = address.replace(/^0x/, "");
        buffer = Buffer.from(cleanAddress, "hex");

        // Ensure it's 32 bytes
        if (buffer.length !== 32) {
          throw new Error(
            `Invalid AccountAddress length: expected 32 bytes, got ${buffer.length}`
          );
        }
      } else {
        // For unknown entrypoints, try to serialize as empty parameter
        buffer = Buffer.allocUnsafe(0);
      }

      console.log("Serialized parameter buffer:", buffer.toString("hex"));
      // Convert Node.js Buffer to ArrayBuffer for Parameter.fromBuffer
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      );
      return Parameter.fromBuffer(arrayBuffer);
    } catch (error) {
      console.error("Failed to serialize parameter:", error);
      throw new Error(
        `Parameter serialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Helper method to make real contract calls
  private async makeContractCall(
    entrypoint: string,
    parameter: any,
    account: string
  ): Promise<string> {
    if (!this.connection) {
      throw new Error("Wallet connection not initialized");
    }

    try {
      // Parse contract address - Concordium contract addresses are typically just the index
      // For now, we'll assume the contract address is just the index and subindex is 0
      let contractIndex: bigint;
      try {
        contractIndex = BigInt(this.contractAddress);
      } catch (error) {
        throw new Error(
          `Invalid contract address format: ${this.contractAddress}. Expected a numeric index.`
        );
      }
      const contractAddress = ContractAddress.create(contractIndex, 0);

      const contractName = ContractName.fromString("proctoring_contract");
      const receiveName = ReceiveName.create(
        contractName,
        EntrypointName.fromString(entrypoint)
      );

      console.log("Making real contract call:", {
        entrypoint,
        parameter,
        account,
        contractAddress: contractAddress.toString(),
      });

      // Serialize the parameter
      const serializedParameter = this.serializeParameter(
        entrypoint,
        parameter
      );

      // Create the contract update payload with serialized parameter
      const updatePayload = {
        amount: CcdAmount.zero(),
        address: contractAddress,
        receiveName: receiveName,
        maxContractExecutionEnergy: Energy.create(100000),
        message: serializedParameter,
      };

      // Send the transaction using the wallet connection
      const txHash = await this.connection.signAndSendTransaction(
        account,
        AccountTransactionType.Update,
        updatePayload
      );

      console.log("Transaction submitted:", txHash);
      return txHash;
    } catch (error) {
      console.error("Contract call failed:", error);
      throw error; // Re-throw the error instead of falling back to mock
    }
  }

  // Generate exam invite after identity verification
  async generateExamInvite(
    examineeName: string,
    account: string
  ): Promise<string> {
    console.log("Generating exam invite for:", examineeName);

    const parameter = {
      examinee_name: examineeName,
    };

    return await this.makeContractCall(
      CONTRACT_FUNCTIONS.GENERATE_INVITE,
      parameter,
      account
    );
  }

  // Verify proctor credentials
  async verifyProctorCredential(
    proctorName: string,
    account: string
  ): Promise<string> {
    console.log("Verifying proctor credentials for:", proctorName);

    const parameter = proctorName;

    return await this.makeContractCall(
      CONTRACT_FUNCTIONS.VERIFY_PROCTOR,
      parameter,
      account
    );
  }

  // Join exam as proctor
  async joinAsProctor(
    examId: number,
    proctorName: string,
    account: string
  ): Promise<string> {
    console.log(
      "Joining as proctor for exam:",
      examId,
      "proctor:",
      proctorName
    );

    const parameter = {
      exam_id: examId,
      proctor_name: proctorName,
    };

    return await this.makeContractCall(
      CONTRACT_FUNCTIONS.JOIN_PROCTOR,
      parameter,
      account
    );
  }

  // Join proctor room with invite code
  async joinProctorRoom(inviteCode: string, account: string): Promise<string> {
    console.log("Joining proctor room with invite:", inviteCode);

    const parameter = {
      invite_code: inviteCode,
    };

    return await this.makeContractCall(
      CONTRACT_FUNCTIONS.JOIN_ROOM,
      parameter,
      account
    );
  }

  // Submit exam results (proctor only)
  async submitExamResults(
    examId: number,
    passed: boolean,
    account: string
  ): Promise<string> {
    console.log("Submitting exam results for exam:", examId, "passed:", passed);

    const parameter = {
      exam_id: examId,
      passed: passed,
    };

    return await this.makeContractCall(
      CONTRACT_FUNCTIONS.SUBMIT_RESULTS,
      parameter,
      account
    );
  }

  // Mint certificate after identity re-verification
  async mintCertificate(
    examId: number,
    examineeName: string,
    account: string
  ): Promise<string> {
    console.log(
      "Minting certificate for exam:",
      examId,
      "examinee:",
      examineeName
    );

    const parameter = {
      exam_id: examId,
      examinee_name: examineeName,
    };

    return await this.makeContractCall(
      CONTRACT_FUNCTIONS.MINT_CERTIFICATE,
      parameter,
      account
    );
  }

  // Mint registration NFT after exam registration
  async mintRegistrationNft(
    examId: number,
    examineeName: string,
    account: string
  ): Promise<string> {
    console.log(
      "Minting registration NFT for exam:",
      examId,
      "examinee:",
      examineeName
    );

    const parameter = {
      exam_id: examId,
      examinee_name: examineeName,
    };

    return await this.makeContractCall(
      CONTRACT_FUNCTIONS.MINT_REGISTRATION_NFT,
      parameter,
      account
    );
  }

  // Mint registration certificate NFT
  async mintRegistrationCertificate(
    examData: {
      examId: number;
      examTitle: string;
      examDate: string;
      examDuration: string;
      examineeName: string;
      inviteCode: string;
    },
    account: string
  ): Promise<{ txHash: string; metadata: RegistrationCertificateMetadata }> {
    console.log("Minting registration certificate NFT:", examData);

    // Generate CIS-2 compliant metadata
    const metadata = this.generateCertificateMetadata(examData);

    // Store metadata (in a real implementation, this would be stored on IPFS or similar)
    await this.storeMetadata(metadata);

    // Prepare contract parameters - proctoring contract expects MintCertificateParams: { exam_id: u64, examinee_name: String }
    const parameter = {
      exam_id: examData.examId,
      examinee_name: examData.examineeName,
    };

    // Make the contract call
    const txHash = await this.makeContractCall(
      CONTRACT_FUNCTIONS.MINT_CERTIFICATE,
      parameter,
      account
    );

    return { txHash, metadata };
  }

  // Store metadata (mock implementation - in real app, use IPFS or similar)
  private async storeMetadata(
    metadata: RegistrationCertificateMetadata
  ): Promise<string> {
    // In a real implementation, you would:
    // 1. Upload metadata to IPFS
    // 2. Return the IPFS hash
    // 3. Or store on a centralized service

    console.log("Storing metadata:", metadata);

    // For demo purposes, return a mock URL
    return `https://api.proctora.com/metadata/${Date.now()}.json`;
  }

  // View functions - These use real contract view calls
  async getExam(examId: number): Promise<Exam | null> {
    try {
      console.log("Getting exam:", examId);

      // Make real contract view call
      const result = await this.makeContractViewCall(
        CONTRACT_FUNCTIONS.GET_EXAM,
        examId
      );

      if (!result) {
        console.log("Exam not found");
        return null;
      }

      // Decode the buffer to extract exam data
      const exam = decodeOption(result, decodeExam);
      console.log("Decoded exam data:", exam);

      return exam;
    } catch (error) {
      console.error("Failed to fetch exam:", error);
      return null;
    }
  }

  async getProctorSessions(proctorAddress: string): Promise<number[]> {
    try {
      console.log("Getting proctor sessions for:", proctorAddress);

      // Make real contract view call
      const result = await this.makeContractViewCall(
        CONTRACT_FUNCTIONS.GET_PROCTOR_SESSIONS,
        proctorAddress
      );

      if (!result) {
        console.log("No proctor sessions found");
        return [];
      }

      // Decode the buffer to extract session IDs
      const sessionIds = decodeVecU64(result);
      console.log("Decoded proctor session IDs:", sessionIds);

      return sessionIds;
    } catch (error) {
      console.error("Failed to fetch proctor sessions:", error);
      return [];
    }
  }

  async listUserExams(userAddress: string): Promise<number[]> {
    try {
      console.log("Listing user exams for:", userAddress);

      // First, let's check what methods are available by testing get_stats
      try {
        const statsResult = await this.makeContractViewCall(
          CONTRACT_FUNCTIONS.GET_STATS
        );
        console.log("Contract stats call successful:", statsResult);
      } catch (statsError) {
        console.log("Contract stats call failed:", statsError);
      }

      // Try the list_user_exams method
      try {
        const result = await this.makeContractViewCall(
          CONTRACT_FUNCTIONS.LIST_USER_EXAMS,
          userAddress
        );

        if (!result) {
          console.log("No exams found for user");
          return [];
        }

        // Decode the buffer to extract exam IDs
        const examIds = decodeVecU64(result);
        console.log("Decoded user exam IDs:", examIds);

        return examIds;
      } catch (listError) {
        console.log("list_user_exams method failed:", listError);

        // Fallback: Use get_stats to get exam counter, then iterate through possible exam IDs
        console.log("Falling back to iterative approach using get_stats");

        try {
          const statsResult = await this.makeContractViewCall(
            CONTRACT_FUNCTIONS.GET_STATS
          );
          console.log("Stats result for fallback:", statsResult);

          // Decode stats to get total exam count
          const stats = decodeStats(statsResult);
          console.log("Decoded stats:", stats);

          if (stats.total_exams === 0) {
            console.log("No exams exist yet");
            return [];
          }

          // Iterate through possible exam IDs to find user's exams
          const userExamIds: number[] = [];
          console.log(
            `Checking ${stats.total_exams} possible exams for user ${userAddress}`
          );

          for (let examId = 1; examId <= stats.total_exams; examId++) {
            try {
              const examResult = await this.makeContractViewCall(
                CONTRACT_FUNCTIONS.GET_EXAM,
                examId
              );
              if (examResult) {
                const exam = decodeOption(examResult, decodeExam);
                if (exam && exam.examinee === userAddress) {
                  userExamIds.push(examId);
                  console.log(`Found user exam: ${examId}`);
                }
              }
            } catch (examError) {
              // Exam doesn't exist or other error, continue
              console.log(`Exam ${examId} not found or error:`, examError);
            }
          }

          console.log(
            `Found ${userExamIds.length} exams for user:`,
            userExamIds
          );
          return userExamIds;
        } catch (fallbackError) {
          console.log("Fallback approach also failed:", fallbackError);
          return [];
        }
      }
    } catch (error) {
      console.error("Failed to fetch user exams:", error);
      return [];
    }
  }

  async viewCertificate(tokenId: number): Promise<Certificate | null> {
    // TODO: Implement real contract view call for certificate viewing
    console.log("Viewing certificate:", tokenId);
    // For now, return null since we don't have a contract method for this yet
    return null;
  }

  async isVerifiedProctor(proctorAddress: string): Promise<boolean> {
    // TODO: Implement real contract view call
    console.log("Checking proctor verification for:", proctorAddress);
    return localStorage.getItem("isProctor") === "true";
  }

  async getStats(): Promise<ContractStats> {
    try {
      console.log("Getting contract stats");

      // Make real contract view call
      const result = await this.makeContractViewCall(
        CONTRACT_FUNCTIONS.GET_STATS
      );

      if (!result) {
        console.log("Could not get contract stats");
        return {
          total_exams: 0,
          total_certificates: 0,
          total_registration_nfts: 0,
        };
      }

      // Decode the stats buffer properly
      const stats = decodeStats(result);
      console.log("Decoded contract stats:", stats);

      return stats;
    } catch (error) {
      console.error("Failed to fetch contract stats:", error);
      return {
        total_exams: 0,
        total_certificates: 0,
        total_registration_nfts: 0,
      };
    }
  }

  // CIS-2 Methods
  async balanceOf(queries: BalanceOfQuery[]): Promise<BalanceOfQueryResponse> {
    // For now, return mock data since the contract might not be properly deployed
    // or the CIS-2 functions might not be working correctly
    console.log("balanceOf called with queries:", queries);
    return { results: [1] }; // Mock balance of 1 for NFTs
  }

  async tokenMetadata(tokenIds: number[]): Promise<TokenMetadataQueryResponse> {
    // For now, return mock data since the contract might not be properly deployed
    // or the CIS-2 functions might not be working correctly
    console.log("tokenMetadata called with tokenIds:", tokenIds);
    return {
      results: [
        {
          url: "https://proctora.com/nft/metadata",
          hash: undefined,
        },
      ],
    };
  }

  async tokensByOwner(address: string): Promise<number[]> {
    // For now, return mock data since the contract might not be properly deployed
    // or the CIS-2 functions might not be working correctly
    console.log("tokensByOwner called with address:", address);
    return [1, 2, 3]; // Mock token IDs for testing
  }

  // CIS-2 Decoding functions
  private decodeBalanceOfResponse(buffer: Buffer): BalanceOfQueryResponse {
    try {
      // For now, return a simple response - in a real implementation,
      // you would decode the buffer based on your contract's return types
      return { results: [1] }; // Assuming balance of 1 for NFTs
    } catch (error) {
      console.error("Failed to decode BalanceOfResponse:", error);
      return { results: [] };
    }
  }

  private decodeTokenMetadataResponse(
    buffer: Buffer
  ): TokenMetadataQueryResponse {
    try {
      // For now, return a simple response - in a real implementation,
      // you would decode the buffer based on your contract's return types
      return {
        results: [
          {
            url: "https://proctora.com/nft/metadata",
            hash: undefined,
          },
        ],
      };
    } catch (error) {
      console.error("Failed to decode TokenMetadataResponse:", error);
      return { results: [] };
    }
  }

  private decodeTokensByOwnerResponse(buffer: Buffer): number[] {
    try {
      // For now, return a simple response - in a real implementation,
      // you would decode the buffer based on your contract's return types
      // This should decode the Vec<ContractTokenId> from the contract
      return [1, 2, 3]; // Mock token IDs for testing
    } catch (error) {
      console.error("Failed to decode TokensByOwnerResponse:", error);
      return [];
    }
  }

  // Debug function to test CIS-2 functionality
  async debugCIS2(account: string): Promise<void> {
    console.log("=== CIS-2 Debug Info ===");
    console.log("Account:", account);
    console.log("Contract Address:", this.contractAddress);

    try {
      // Test 1: Get all tokens owned by account
      console.log("1. Getting tokens by owner...");
      const tokens = await this.tokensByOwner(account);
      console.log("Tokens owned:", tokens);

      // Test 2: Get balance for first token (if any)
      if (tokens.length > 0) {
        console.log("2. Getting balance for token", tokens[0]);
        const balanceQuery = [
          {
            token_id: tokens[0],
            address: account,
          },
        ];
        const balance = await this.balanceOf(balanceQuery);
        console.log("Balance result:", balance);

        // Test 3: Get metadata for first token
        console.log("3. Getting metadata for token", tokens[0]);
        const metadata = await this.tokenMetadata([tokens[0]]);
        console.log("Metadata result:", metadata);
      } else {
        console.log("2. No tokens found, skipping balance and metadata tests");
      }

      // Test 4: Get contract stats
      console.log("4. Getting contract stats...");
      const stats = await this.getStats();
      console.log("Contract stats:", stats);

      // Test 4.5: Check if there are any exams for this user
      console.log("4.5. Checking user exams...");
      try {
        const userExams = await this.listUserExams(account);
        console.log("User exams:", userExams);
      } catch (userExamError) {
        console.log("User exams check failed:", userExamError);
      }

      // Test 5: Try to get balance for a specific token ID (1)
      console.log("5. Testing balance for token ID 1...");
      try {
        const testBalanceQuery = [
          {
            token_id: 1,
            address: account,
          },
        ];
        const testBalance = await this.balanceOf(testBalanceQuery);
        console.log("Test balance result:", testBalance);
      } catch (balanceError) {
        console.log("Test balance failed:", balanceError);
      }
    } catch (error) {
      console.error("CIS-2 debug failed:", error);
    }
  }
}

// Helper function to create contract instance
export function createProctoringContract(
  contractAddress: string
): ProctoringContract {
  return new ProctoringContract(contractAddress);
}
