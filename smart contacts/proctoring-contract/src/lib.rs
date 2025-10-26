//! # Proctoring Smart Contract
//!
//! A smart contract for managing proctored exams with NFT certificates.
//! This contract handles exam invites, proctor verification, and certificate minting.

#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

use concordium_cis2::*;
use concordium_std::*;
use alloc::string::String;
use alloc::vec::Vec;

/// List of supported standards by this contract address.
pub const SUPPORTS_STANDARDS: [StandardIdentifier<'static>; 2] =
    [CIS0_STANDARD_IDENTIFIER, CIS2_STANDARD_IDENTIFIER];

// Types

/// The contract state.
#[derive(Serial, DeserialWithState)]
#[concordium(state_parameter = "S")]
pub struct State<S = StateApi> {
    /// All exams indexed by exam ID
    pub exams: StateMap<u64, Exam, S>,
    /// Counter for auto-incrementing exam IDs
    pub exam_counter: u64,
    /// User's exam history indexed by account address
    pub user_exams: StateMap<AccountAddress, Vec<u64>, S>,
    /// Proctor's active sessions indexed by proctor address
    pub proctor_sessions: StateMap<AccountAddress, Vec<u64>, S>,
    /// Minted certificates indexed by token ID
    pub nft_certificates: StateMap<ContractTokenId, Certificate, S>,
    /// Counter for auto-incrementing token IDs
    pub token_counter: u32,
    /// Registration NFTs indexed by token ID
    pub registration_nfts: StateMap<ContractTokenId, RegistrationNFT, S>,
    /// Counter for auto-incrementing registration token IDs
    pub registration_token_counter: u32,
    /// Contract administrator
    pub admin: AccountAddress,
    /// Verified proctors (addresses that have valid proctor credentials)
    pub verified_proctors: StateSet<AccountAddress, S>,
    /// Invite codes to exam ID mapping
    pub invite_to_exam: StateMap<String, u64, S>,
    /// CIS-2: The state for each address
    pub address_states: StateMap<Address, AddressState<S>, S>,
    /// CIS-2: All token IDs that exist
    pub all_tokens: StateSet<ContractTokenId, S>,
    /// CIS-2: Map with contract addresses providing implementations of additional standards
    pub implementors: StateMap<StandardIdentifierOwned, Vec<ContractAddress>, S>,
}

/// An exam record
#[derive(Serial, Deserial, SchemaType, Clone)]
pub struct Exam {
    pub id: u64,
    pub examinee: AccountAddress,
    pub examinee_name: String,
    pub invite_code: String,
    pub proctor: Option<AccountAddress>,
    pub proctor_name: Option<String>,
    pub status: ExamStatus,
    pub created_at: Timestamp,
    pub completed_at: Option<Timestamp>,
    pub passed: Option<bool>,
    pub identity_verified_for_cert: bool,
}

/// Exam status
#[derive(Serial, Deserial, SchemaType, Clone, PartialEq, Eq)]
pub enum ExamStatus {
    InviteGenerated,
    ProctorJoined,
    InProgress,
    Completed,
    Failed,
}

/// Certificate NFT data
#[derive(Serial, Deserial, SchemaType, Clone)]
pub struct Certificate {
    pub token_id: ContractTokenId,
    pub exam_id: u64,
    pub examinee: AccountAddress,
    pub examinee_name: String,
    pub proctor: AccountAddress,
    pub proctor_name: String,
    pub timestamp: Timestamp,
}

/// Registration NFT data
#[derive(Serial, Deserial, SchemaType, Clone)]
pub struct RegistrationNFT {
    pub token_id: ContractTokenId,
    pub exam_id: u64,
    pub examinee: AccountAddress,
    pub examinee_name: String,
    pub registration_date: Timestamp,
}

/// Contract statistics
#[derive(Serial, Deserial, SchemaType)]
pub struct ContractStats {
    pub total_exams: u64,
    pub total_certificates: u32,
    pub total_registration_nfts: u32,
}

/// Contract token ID type.
pub type ContractTokenId = TokenIdU32;

/// Contract token amount.
pub type ContractTokenAmount = TokenAmountU8;

/// The state for each address.
#[derive(Serial, DeserialWithState, Deletable)]
#[concordium(state_parameter = "S")]
pub struct AddressState<S = StateApi> {
    /// The tokens owned by this address.
    pub owned_tokens: StateSet<ContractTokenId, S>,
    /// The address which are currently enabled as operators for this address.
    pub operators: StateSet<Address, S>,
}

impl AddressState {
    fn empty(state_builder: &mut StateBuilder) -> Self {
        AddressState {
            owned_tokens: state_builder.new_set(),
            operators: state_builder.new_set(),
        }
    }
}

/// Contract errors
#[derive(Serialize, Debug, PartialEq, Eq, Reject, SchemaType)]
pub enum Error {
    /// Failed parsing the parameter.
    #[from(ParseError)]
    ParseParams,
    /// Unauthorized action.
    Unauthorized,
    /// Exam not found.
    ExamNotFound,
    /// Invalid exam state.
    InvalidExamState,
    /// Token ID already exists.
    TokenIdAlreadyExists,
    /// Failed to log event.
    LogFull,
    /// Failed to log event.
    LogMalformed,
}

/// Mapping the logging errors to Error.
impl From<LogError> for Error {
    fn from(le: LogError) -> Self {
        match le {
            LogError::Full => Self::LogFull,
            LogError::Malformed => Self::LogMalformed,
        }
    }
}

/// Initialize parameters
#[derive(Serial, Deserial, SchemaType)]
pub struct InitParams {
    pub admin: AccountAddress,
}

/// Generate invite parameters
#[derive(Serial, Deserial, SchemaType)]
pub struct GenerateInviteParams {
    pub examinee_name: String,
}

/// Join proctor parameters
#[derive(Serial, Deserial, SchemaType)]
pub struct JoinProctorParams {
    pub exam_id: u64,
    pub proctor_name: String,
}

/// Join room parameters
#[derive(Serial, Deserial, SchemaType)]
pub struct JoinRoomParams {
    pub invite_code: String,
}

/// Submit results parameters
#[derive(Serial, Deserial, SchemaType)]
pub struct SubmitResultsParams {
    pub exam_id: u64,
    pub passed: bool,
}

/// Mint certificate parameters
#[derive(Serial, Deserial, SchemaType)]
pub struct MintCertificateParams {
    pub exam_id: u64,
    pub examinee_name: String,
}

/// Mint registration NFT parameters
#[derive(Serial, Deserial, SchemaType)]
pub struct MintRegistrationNFTParams {
    pub exam_id: u64,
    pub examinee_name: String,
}

// Contract events
#[derive(Serialize, SchemaType, PartialEq, Eq, Debug)]
pub enum Event {
    ExamInviteGenerated {
        exam_id: u64,
        invite_code: String,
        examinee: AccountAddress,
        examinee_name: String,
    },
    ProctorVerified {
        proctor: AccountAddress,
        proctor_name: String,
    },
    ProctorJoined {
        exam_id: u64,
        proctor: AccountAddress,
        proctor_name: String,
    },
    ExamSubmitted {
        exam_id: u64,
        passed: bool,
    },
    CertificateMinted {
        token_id: ContractTokenId,
        exam_id: u64,
        recipient: AccountAddress,
        examinee_name: String,
    },
    RegistrationNFTMinted {
        token_id: ContractTokenId,
        exam_id: u64,
        recipient: AccountAddress,
        examinee_name: String,
    },
}

// State implementation
impl State {
    /// Create a new state with the given admin
    pub fn new(admin: AccountAddress, state_builder: &mut StateBuilder) -> Self {
        Self {
            exams: state_builder.new_map(),
            exam_counter: 0,
            user_exams: state_builder.new_map(),
            proctor_sessions: state_builder.new_map(),
            nft_certificates: state_builder.new_map(),
            token_counter: 0,
            registration_nfts: state_builder.new_map(),
            registration_token_counter: 0,
            admin,
            verified_proctors: state_builder.new_set(),
            invite_to_exam: state_builder.new_map(),
            address_states: state_builder.new_map(),
            all_tokens: state_builder.new_set(),
            implementors: state_builder.new_map(),
        }
    }

    /// Generate a new exam ID
    pub fn next_exam_id(&mut self) -> u64 {
        self.exam_counter += 1;
        self.exam_counter
    }

    /// Generate a new token ID
    pub fn next_token_id(&mut self) -> ContractTokenId {
        self.token_counter += 1;
        ContractTokenId::from(self.token_counter)
    }

    /// Generate a new registration token ID
    pub fn next_registration_token_id(&mut self) -> ContractTokenId {
        self.registration_token_counter += 1;
        ContractTokenId::from(self.registration_token_counter)
    }

    /// Add an exam to a user's history
    pub fn add_user_exam(&mut self, user: AccountAddress, exam_id: u64, _state_builder: &mut StateBuilder) {
        let mut user_exams = self.user_exams.get(&user).map(|v| v.to_vec()).unwrap_or_default();
        user_exams.push(exam_id);
        self.user_exams.insert(user, user_exams);
    }

    /// Add a session to a proctor's active sessions
    pub fn add_proctor_session(&mut self, proctor: AccountAddress, exam_id: u64, _state_builder: &mut StateBuilder) {
        let mut sessions = self.proctor_sessions.get(&proctor).map(|v| v.to_vec()).unwrap_or_default();
        sessions.push(exam_id);
        self.proctor_sessions.insert(proctor, sessions);
    }

    /// Mint a token to an address (CIS-2 compliant)
    pub fn mint_token(&mut self, token_id: ContractTokenId, owner: Address, state_builder: &mut StateBuilder) -> Result<(), Error> {
        // Check if token already exists
        if self.all_tokens.contains(&token_id) {
            return Err(Error::TokenIdAlreadyExists);
        }
        
        // Add token to all_tokens set
        self.all_tokens.insert(token_id);
        
        // Add token to owner's address state
        let mut owner_state = self.address_states.entry(owner).or_insert_with(|| AddressState::empty(state_builder));
        owner_state.owned_tokens.insert(token_id);
        
        Ok(())
    }
}

// Contract functions

/// Initialize the smart contract.
#[init(contract = "proctoring_contract", parameter = "InitParams", event = "Cis2Event<ContractTokenId, ContractTokenAmount>")]
fn init(ctx: &InitContext, state_builder: &mut StateBuilder) -> InitResult<State> {
    let params: InitParams = ctx.parameter_cursor().get()?;
    
    Ok(State::new(params.admin, state_builder))
}

/// Generate an exam invite after identity verification.
#[receive(
    contract = "proctoring_contract",
    name = "generate_exam_invite",
    parameter = "GenerateInviteParams",
    error = "Error",
    payable,
    enable_logger,
    mutable
)]
fn generate_exam_invite(
    ctx: &ReceiveContext,
    host: &mut Host<State>,
    _amount: Amount,
    logger: &mut impl HasLogger,
) -> Result<(), Error> {
    let params: GenerateInviteParams = ctx.parameter_cursor().get()?;
    let sender = ctx.sender();
    
    // Convert Address to AccountAddress
    let examinee = match sender {
        Address::Account(acc) => acc,
        Address::Contract(_) => return Err(Error::Unauthorized),
    };
    
    let (state, builder) = host.state_and_builder();
    let exam_id = state.next_exam_id();
    let invite_code = format!("exam-{}-{:?}", exam_id, examinee);
    
    let exam = Exam {
        id: exam_id,
        examinee,
        examinee_name: params.examinee_name.clone(),
        invite_code: invite_code.clone(),
        proctor: None,
        proctor_name: None,
        status: ExamStatus::InviteGenerated,
        created_at: ctx.metadata().slot_time(),
        completed_at: None,
        passed: None,
        identity_verified_for_cert: false,
    };
    
    state.exams.insert(exam_id, exam);
    state.add_user_exam(examinee, exam_id, builder);
    state.invite_to_exam.insert(invite_code.clone(), exam_id);
    
    logger.log(&Event::ExamInviteGenerated {
        exam_id,
        invite_code,
        examinee,
        examinee_name: params.examinee_name,
    })?;
    
    Ok(())
}

/// Verify a proctor's credentials and register them.
#[receive(
    contract = "proctoring_contract",
    name = "verify_proctor_credential",
    parameter = "String",
    error = "Error",
    payable,
    enable_logger,
    mutable
)]
fn verify_proctor_credential(
    ctx: &ReceiveContext,
    host: &mut Host<State>,
    _amount: Amount,
    logger: &mut impl HasLogger,
) -> Result<(), Error> {
    let proctor_name: String = ctx.parameter_cursor().get()?;
    let sender = ctx.sender();
    
    // Convert Address to AccountAddress
    let proctor = match sender {
        Address::Account(acc) => acc,
        Address::Contract(_) => return Err(Error::Unauthorized),
    };
    
    let (state, builder) = host.state_and_builder();
    state.verified_proctors.insert(proctor);
    
    logger.log(&Event::ProctorVerified {
        proctor,
        proctor_name,
    })?;
    
    Ok(())
}

/// Join an exam session as a proctor.
#[receive(
    contract = "proctoring_contract",
    name = "join_as_proctor",
    parameter = "JoinProctorParams",
    error = "Error",
    payable,
    enable_logger,
    mutable
)]
fn join_as_proctor(
    ctx: &ReceiveContext,
    host: &mut Host<State>,
    _amount: Amount,
    logger: &mut impl HasLogger,
) -> Result<(), Error> {
    let params: JoinProctorParams = ctx.parameter_cursor().get()?;
    let sender = ctx.sender();
    
    // Convert Address to AccountAddress
    let proctor = match sender {
        Address::Account(acc) => acc,
        Address::Contract(_) => return Err(Error::Unauthorized),
    };
    
    let (state, builder) = host.state_and_builder();
    
    // Check if sender is a verified proctor
    if !state.verified_proctors.contains(&proctor) {
        return Err(Error::Unauthorized);
    }
    
    // Get exam from state
    let mut exam = state.exams.get(&params.exam_id).ok_or(Error::ExamNotFound)?.clone();
    exam.proctor = Some(proctor);
    exam.proctor_name = Some(params.proctor_name.clone());
    exam.status = ExamStatus::ProctorJoined;
    state.exams.insert(params.exam_id, exam);
    
    state.add_proctor_session(proctor, params.exam_id, builder);
    
    logger.log(&Event::ProctorJoined {
        exam_id: params.exam_id,
        proctor,
        proctor_name: params.proctor_name,
    })?;
    
    Ok(())
}

/// Join a proctor room using an invite code.
#[receive(
    contract = "proctoring_contract",
    name = "join_proctor_room",
    parameter = "JoinRoomParams",
    error = "Error",
    payable,
    mutable
)]
fn join_proctor_room(
    ctx: &ReceiveContext,
    host: &mut Host<State>,
    _amount: Amount,
) -> Result<(), Error> {
    let params: JoinRoomParams = ctx.parameter_cursor().get()?;
    let _sender = ctx.sender();
    
    let (state, builder) = host.state_and_builder();
    
    // Get exam ID from invite code
    let exam_id = *state.invite_to_exam.get(&params.invite_code).ok_or(Error::ExamNotFound)?;
    
    // Get exam and update status
    let mut exam = state.exams.get(&exam_id).ok_or(Error::ExamNotFound)?.clone();
    exam.status = ExamStatus::InProgress;
    state.exams.insert(exam_id, exam);
    
    Ok(())
}

/// Submit exam results (called by proctor).
#[receive(
    contract = "proctoring_contract",
    name = "submit_exam_results",
    parameter = "SubmitResultsParams",
    error = "Error",
    payable,
    enable_logger,
    mutable
)]
fn submit_exam_results(
    ctx: &ReceiveContext,
    host: &mut Host<State>,
    _amount: Amount,
    logger: &mut impl HasLogger,
) -> Result<(), Error> {
    let params: SubmitResultsParams = ctx.parameter_cursor().get()?;
    let _sender = ctx.sender();
    
    let (state, builder) = host.state_and_builder();
    
    // Get exam from state
    let mut exam = state.exams.get(&params.exam_id).ok_or(Error::ExamNotFound)?.clone();
    
    // Update exam with results
    exam.status = if params.passed { ExamStatus::Completed } else { ExamStatus::Failed };
    exam.completed_at = Some(ctx.metadata().slot_time());
    exam.passed = Some(params.passed);
    state.exams.insert(params.exam_id, exam);
    
    logger.log(&Event::ExamSubmitted {
        exam_id: params.exam_id,
        passed: params.passed,
    })?;
    
    Ok(())
}

/// Mint a certificate NFT after identity verification.
#[receive(
    contract = "proctoring_contract",
    name = "mint_certificate",
    parameter = "MintCertificateParams",
    error = "Error",
    payable,
    enable_logger,
    mutable
)]
fn mint_certificate(
    ctx: &ReceiveContext,
    host: &mut Host<State>,
    _amount: Amount,
    logger: &mut impl HasLogger,
) -> Result<(), Error> {
    let params: MintCertificateParams = ctx.parameter_cursor().get()?;
    let sender = ctx.sender();
    
    // Convert Address to AccountAddress
    let examinee = match sender {
        Address::Account(acc) => acc,
        Address::Contract(_) => return Err(Error::Unauthorized),
    };
    
    let (state, builder) = host.state_and_builder();
    
    // Get exam and verify it was passed
    let exam = state.exams.get(&params.exam_id).ok_or(Error::ExamNotFound)?.clone();
    if exam.status != ExamStatus::Completed || exam.passed != Some(true) {
        return Err(Error::InvalidExamState);
    }
    
    // Generate new token ID
    let token_id = state.next_token_id();
    
    // Create certificate
    let certificate = Certificate {
        token_id,
        exam_id: params.exam_id,
        examinee,
        examinee_name: params.examinee_name.clone(),
        proctor: exam.proctor.unwrap_or(state.admin),
        proctor_name: exam.proctor_name.clone().unwrap_or("Unknown".to_string()),
        timestamp: ctx.metadata().slot_time(),
    };
    
    state.nft_certificates.insert(token_id, certificate);
    
    // Convert AccountAddress to Address for CIS-2
    let owner_address = Address::Account(examinee);
    
    // Mint token using CIS-2 compliant method
    state.mint_token(token_id, owner_address, builder)?;
    
    // Log CIS-2 events
    logger.log(&Cis2Event::Mint(MintEvent {
        token_id,
        amount: ContractTokenAmount::from(1),
        owner: owner_address,
    }))?;
    
    logger.log(&Cis2Event::TokenMetadata::<_, ContractTokenAmount>(TokenMetadataEvent {
        token_id,
        metadata_url: MetadataUrl {
            url: format!("https://proctora.com/nft/certificate/{}", token_id.0),
            hash: None,
        },
    }))?;
    
    logger.log(&Event::CertificateMinted {
        token_id,
        exam_id: params.exam_id,
        recipient: examinee,
        examinee_name: params.examinee_name,
    })?;
    
    Ok(())
}

/// Mint a registration NFT after exam registration.
#[receive(
    contract = "proctoring_contract",
    name = "mint_registration_nft",
    parameter = "MintRegistrationNFTParams",
    error = "Error",
    payable,
    enable_logger,
    mutable
)]
fn mint_registration_nft(
    ctx: &ReceiveContext,
    host: &mut Host<State>,
    _amount: Amount,
    logger: &mut impl HasLogger,
) -> Result<(), Error> {
    let params: MintRegistrationNFTParams = ctx.parameter_cursor().get()?;
    let sender = ctx.sender();
    
    // Convert Address to AccountAddress
    let examinee = match sender {
        Address::Account(acc) => acc,
        Address::Contract(_) => return Err(Error::Unauthorized),
    };
    
    let (state, builder) = host.state_and_builder();
    
    // Find the most recent exam for this user (the one just created)
    let user_exams = state.user_exams.get(&examinee).map(|v| v.to_vec()).unwrap_or_default();
    let exam_id = user_exams.last().ok_or(Error::ExamNotFound)?;
    
    // Get exam and verify it exists and belongs to the caller
    let exam = state.exams.get(exam_id).ok_or(Error::ExamNotFound)?.clone();
    if exam.examinee != examinee {
        return Err(Error::Unauthorized);
    }
    
    // Generate new registration token ID
    let token_id = state.next_registration_token_id();
    
    // Create registration NFT
    let registration_nft = RegistrationNFT {
        token_id,
        exam_id: *exam_id,
        examinee,
        examinee_name: params.examinee_name.clone(),
        registration_date: ctx.metadata().slot_time(),
    };
    
    state.registration_nfts.insert(token_id, registration_nft);
    
    // Convert AccountAddress to Address for CIS-2
    let owner_address = Address::Account(examinee);
    
    // Mint token using CIS-2 compliant method
    state.mint_token(token_id, owner_address, builder)?;
    
    // Log CIS-2 events
    logger.log(&Cis2Event::Mint(MintEvent {
        token_id,
        amount: ContractTokenAmount::from(1),
        owner: owner_address,
    }))?;
    
    logger.log(&Cis2Event::TokenMetadata::<_, ContractTokenAmount>(TokenMetadataEvent {
        token_id,
        metadata_url: MetadataUrl {
            url: format!("https://proctora.com/nft/registration/{}", token_id.0),
            hash: None,
        },
    }))?;
    
    logger.log(&Event::RegistrationNFTMinted {
        token_id,
        exam_id: *exam_id,
        recipient: examinee,
        examinee_name: params.examinee_name,
    })?;
    
    Ok(())
}

/// View function to get contract statistics.
#[receive(
    contract = "proctoring_contract",
    name = "get_stats",
    parameter = "()",
    return_value = "ContractStats",
    error = "Error"
)]
fn get_stats(_ctx: &ReceiveContext, host: &Host<State>) -> Result<ContractStats, Error> {
    let state = host.state();
    Ok(ContractStats {
        total_exams: state.exam_counter,
        total_certificates: state.token_counter,
        total_registration_nfts: state.registration_token_counter,
    })
}

/// View function to get exam details.
#[receive(
    contract = "proctoring_contract",
    name = "get_exam",
    parameter = "u64",
    return_value = "Option<Exam>",
    error = "Error"
)]
fn get_exam(_ctx: &ReceiveContext, host: &Host<State>) -> Result<Option<Exam>, Error> {
    let params: u64 = _ctx.parameter_cursor().get()?;
    let state = host.state();
    Ok(state.exams.get(&params).map(|exam| exam.clone()))
}

/// View function to get proctor sessions.
#[receive(
    contract = "proctoring_contract",
    name = "get_proctor_sessions",
    parameter = "AccountAddress",
    return_value = "Vec<u64>",
    error = "Error"
)]
fn get_proctor_sessions(_ctx: &ReceiveContext, host: &Host<State>) -> Result<Vec<u64>, Error> {
    let params: AccountAddress = _ctx.parameter_cursor().get()?;
    let state = host.state();
    Ok(state.proctor_sessions.get(&params).map(|v| v.to_vec()).unwrap_or_default())
}

/// View function to get user's exam history.
#[receive(
    contract = "proctoring_contract",
    name = "list_user_exams",
    parameter = "AccountAddress",
    return_value = "Vec<u64>",
    error = "Error"
)]
fn list_user_exams(_ctx: &ReceiveContext, host: &Host<State>) -> Result<Vec<u64>, Error> {
    let params: AccountAddress = _ctx.parameter_cursor().get()?;
    let state = host.state();
    Ok(state.user_exams.get(&params).map(|v| v.to_vec()).unwrap_or_default())
}

/// CIS-2: Get token balances
#[receive(
    contract = "proctoring_contract",
    name = "balanceOf",
    parameter = "BalanceOfQueryParams<ContractTokenId>",
    return_value = "BalanceOfQueryResponse<ContractTokenAmount>",
    error = "Error"
)]
fn balance_of(_ctx: &ReceiveContext, host: &Host<State>) -> Result<BalanceOfQueryResponse<ContractTokenAmount>, Error> {
    let params: BalanceOfQueryParams<ContractTokenId> = _ctx.parameter_cursor().get()?;
    let state = host.state();
    
    let mut response = Vec::with_capacity(params.queries.len());
    for query in params.queries {
        // Check if token exists
        if !state.all_tokens.contains(&query.token_id) {
            return Err(Error::ExamNotFound); // Using ExamNotFound as InvalidTokenId
        }
        
        // Get balance (1 if owned, 0 if not)
        let balance = state.address_states
            .get(&query.address)
            .map(|address_state| u8::from(address_state.owned_tokens.contains(&query.token_id)))
            .unwrap_or(0);
        
        response.push(ContractTokenAmount::from(balance));
    }
    
    Ok(BalanceOfQueryResponse::from(response))
}

/// CIS-2: Get token metadata
#[receive(
    contract = "proctoring_contract",
    name = "tokenMetadata",
    parameter = "TokenMetadataQueryParams<ContractTokenId>",
    return_value = "TokenMetadataQueryResponse",
    error = "Error"
)]
fn token_metadata(_ctx: &ReceiveContext, host: &Host<State>) -> Result<TokenMetadataQueryResponse, Error> {
    let params: TokenMetadataQueryParams<ContractTokenId> = _ctx.parameter_cursor().get()?;
    let state = host.state();
    
    let mut response = Vec::with_capacity(params.queries.len());
    for token_id in params.queries {
        // Check if token exists
        if !state.all_tokens.contains(&token_id) {
            return Err(Error::ExamNotFound); // Using ExamNotFound as InvalidTokenId
        }
        
        // Create metadata URL based on token type
        let metadata_url = if state.registration_nfts.get(&token_id).is_some() {
            MetadataUrl {
                url: format!("https://proctora.com/nft/registration/{}", token_id.0),
                hash: None,
            }
        } else if state.nft_certificates.get(&token_id).is_some() {
            MetadataUrl {
                url: format!("https://proctora.com/nft/certificate/{}", token_id.0),
                hash: None,
            }
        } else {
            return Err(Error::ExamNotFound); // Token not found
        };
        
        response.push(metadata_url);
    }
    
    Ok(TokenMetadataQueryResponse::from(response))
}

/// CIS-2: Get all tokens owned by an address
#[receive(
    contract = "proctoring_contract",
    name = "tokensByOwner",
    parameter = "Address",
    return_value = "Vec<ContractTokenId>",
    error = "Error"
)]
fn tokens_by_owner(_ctx: &ReceiveContext, host: &Host<State>) -> Result<Vec<ContractTokenId>, Error> {
    let params: Address = _ctx.parameter_cursor().get()?;
    let state = host.state();

    if let Some(address_state) = state.address_states.get(&params) {
        Ok(address_state.owned_tokens.iter().map(|t| *t).collect())
    } else {
        Ok(Vec::new())
    }
}

/// CIS-2: Check which standards this contract supports
#[receive(
    contract = "proctoring_contract",
    name = "supports",
    parameter = "SupportsQueryParams",
    return_value = "SupportsQueryResponse",
    error = "Error"
)]
fn supports(_ctx: &ReceiveContext, host: &Host<State>) -> Result<SupportsQueryResponse, Error> {
    let params: SupportsQueryParams = _ctx.parameter_cursor().get()?;

    let mut response = Vec::with_capacity(params.queries.len());
    for std_id in params.queries {
        // Check if this contract supports the queried standard
        if SUPPORTS_STANDARDS.contains(&std_id.as_standard_identifier()) {
            response.push(SupportResult::Support);
        } else {
            // Check if there are implementors for this standard
            response.push(SupportResult::NoSupport);
        }
    }

    Ok(SupportsQueryResponse::from(response))
}

/// CIS-2: Transfer tokens between addresses
#[receive(
    contract = "proctoring_contract",
    name = "transfer",
    parameter = "TransferParams<ContractTokenId, ContractTokenAmount>",
    error = "Error",
    enable_logger,
    mutable
)]
fn transfer(
    ctx: &ReceiveContext,
    host: &mut Host<State>,
    logger: &mut impl HasLogger,
) -> Result<(), Error> {
    let params: TransferParams<ContractTokenId, ContractTokenAmount> = ctx.parameter_cursor().get()?;
    let sender = ctx.sender();

    let (state, builder) = host.state_and_builder();

    // Process each transfer
    for transfer in params.0 {
        // Verify sender owns the token or is an operator
        let token_id = transfer.token_id;
        let from_address = transfer.from;
        let to_receiver = transfer.to;

        // Convert Receiver to Address
        let to_address = to_receiver.address();

        // Check if sender is authorized (owner or operator)
        let is_authorized = if sender == from_address {
            true
        } else {
            state.address_states
                .get(&from_address)
                .map(|addr_state| addr_state.operators.contains(&sender))
                .unwrap_or(false)
        };

        if !is_authorized {
            return Err(Error::Unauthorized);
        }

        // Check if token exists and is owned by from_address
        let is_owner = state.address_states
            .get(&from_address)
            .map(|addr_state| addr_state.owned_tokens.contains(&token_id))
            .unwrap_or(false);

        if !is_owner {
            return Err(Error::ExamNotFound); // Using as TokenNotFound
        }

        // Remove token from sender
        if let Some(mut from_state) = state.address_states.get_mut(&from_address) {
            from_state.owned_tokens.remove(&token_id);
        }

        // Add token to receiver
        let mut to_state = state.address_states
            .entry(to_address)
            .or_insert_with(|| AddressState::empty(builder));
        to_state.owned_tokens.insert(token_id);

        // Log transfer event
        logger.log(&Cis2Event::<ContractTokenId, ContractTokenAmount>::Transfer(TransferEvent {
            token_id,
            amount: transfer.amount,
            from: from_address,
            to: to_address,
        }))?;
    }

    Ok(())
}

/// CIS-2: Update operator permissions
#[receive(
    contract = "proctoring_contract",
    name = "updateOperator",
    parameter = "UpdateOperatorParams",
    error = "Error",
    enable_logger,
    mutable
)]
fn update_operator(
    ctx: &ReceiveContext,
    host: &mut Host<State>,
    logger: &mut impl HasLogger,
) -> Result<(), Error> {
    let params: UpdateOperatorParams = ctx.parameter_cursor().get()?;
    let sender = ctx.sender();

    let (state, builder) = host.state_and_builder();

    // Process each update
    // The sender is implicitly the owner in CIS-2 updateOperator
    for update in params.0 {
        // Get or create the sender's address state
        let mut owner_state = state.address_states
            .entry(sender)
            .or_insert_with(|| AddressState::empty(builder));

        // Update operator status
        match update.update {
            OperatorUpdate::Add => {
                owner_state.operators.insert(update.operator);
            }
            OperatorUpdate::Remove => {
                owner_state.operators.remove(&update.operator);
            }
        }

        // Log operator event
        logger.log(&Cis2Event::<ContractTokenId, ContractTokenAmount>::UpdateOperator(UpdateOperatorEvent {
            owner: sender,
            operator: update.operator,
            update: update.update,
        }))?;
    }

    Ok(())
}

/// CIS-2: Query operator permissions
#[receive(
    contract = "proctoring_contract",
    name = "operatorOf",
    parameter = "OperatorOfQueryParams",
    return_value = "OperatorOfQueryResponse",
    error = "Error"
)]
fn operator_of(_ctx: &ReceiveContext, host: &Host<State>) -> Result<OperatorOfQueryResponse, Error> {
    let params: OperatorOfQueryParams = _ctx.parameter_cursor().get()?;
    let state = host.state();

    let mut response = Vec::with_capacity(params.queries.len());
    for query in params.queries {
        let is_operator = state.address_states
            .get(&query.owner)
            .map(|addr_state| addr_state.operators.contains(&query.address))
            .unwrap_or(false);

        response.push(is_operator);
    }

    Ok(OperatorOfQueryResponse::from(response))
}