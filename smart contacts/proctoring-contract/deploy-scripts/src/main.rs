//! # Proctoring Contract Deployment Script
//! 
//! This script provides instructions for deploying the proctoring smart contract.

use proctoring_contract::*;

fn main() {
    println!("Proctoring Contract Deployment Instructions");
    println!("==========================================");
    println!();
    println!("1. Build the contract:");
    println!("   cargo concordium build --out ./deploy-scripts/proctoring.wasm.v1");
    println!();
    println!("2. Deploy to testnet using Concordium Client CLI:");
    println!("   concordium-client module deploy proctoring.wasm.v1 --sender <your-account> --out-module <module-ref>");
    println!();
    println!("3. Initialize the contract:");
    println!("   concordium-client contract init <module-ref> --sender <your-account> --parameter <init-params> --out-contract <contract-address>");
    println!();
    println!("4. Example init parameters (JSON):");
    println!("   {{\"admin\": \"<admin-account-address>\"}}");
    println!();
    println!("Contract functions available:");
    println!("- generate_exam_invite");
    println!("- verify_proctor_credential");
    println!("- join_as_proctor");
    println!("- join_proctor_room");
    println!("- submit_exam_results");
    println!("- mint_certificate");
    println!("- get_stats");
}