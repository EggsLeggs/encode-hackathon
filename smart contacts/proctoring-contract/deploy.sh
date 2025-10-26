#!/bin/bash
# Deployment script for proctoring contract with CIS-2 support

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===================================${NC}"
echo -e "${BLUE}  Proctoring Contract Deployment${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Check if module exists
if [ ! -f "module.wasm.v1" ]; then
    echo -e "${RED}Error: module.wasm.v1 not found!${NC}"
    echo "Please run: cargo concordium build --out module.wasm.v1"
    exit 1
fi

# Get file size
FILE_SIZE=$(ls -lh module.wasm.v1 | awk '{print $5}')
echo -e "${GREEN}✓ Found contract module (${FILE_SIZE})${NC}"
echo ""

# Prompt for account name
echo -e "${YELLOW}Enter your Concordium account name:${NC}"
read -p "> " ACCOUNT_NAME

if [ -z "$ACCOUNT_NAME" ]; then
    echo -e "${RED}Error: Account name is required${NC}"
    exit 1
fi

# Prompt for admin address
echo ""
echo -e "${YELLOW}Enter your account address (for contract admin):${NC}"
echo -e "${BLUE}Tip: Get this from your wallet or run: concordium-client account show \"$ACCOUNT_NAME\"${NC}"
read -p "> " ADMIN_ADDRESS

if [ -z "$ADMIN_ADDRESS" ]; then
    echo -e "${RED}Error: Admin address is required${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Deploying to testnet...${NC}"
echo ""

# Step 1: Deploy module
echo -e "${YELLOW}Step 1: Deploying module...${NC}"
MODULE_OUTPUT=$(concordium-client module deploy module.wasm.v1 \
  --sender "$ACCOUNT_NAME" \
  --grpc-port 16413 \
  --grpc-ip grpc.testnet.concordium.com 2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}Error deploying module:${NC}"
    echo "$MODULE_OUTPUT"
    exit 1
fi

# Extract module reference
MODULE_REF=$(echo "$MODULE_OUTPUT" | grep -oE '[a-f0-9]{64}' | head -1)

if [ -z "$MODULE_REF" ]; then
    echo -e "${RED}Error: Could not extract module reference${NC}"
    echo "$MODULE_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✓ Module deployed successfully${NC}"
echo -e "${GREEN}  Module Reference: ${MODULE_REF}${NC}"
echo ""

# Step 2: Initialize contract
echo -e "${YELLOW}Step 2: Initializing contract instance...${NC}"
INIT_OUTPUT=$(concordium-client contract init "$MODULE_REF" \
  --contract proctoring_contract \
  --sender "$ACCOUNT_NAME" \
  --energy 30000 \
  --parameter-json "{\"admin\": \"$ADMIN_ADDRESS\"}" \
  --grpc-port 16413 \
  --grpc-ip grpc.testnet.concordium.com 2>&1)

if [ $? -ne 0 ]; then
    echo -e "${RED}Error initializing contract:${NC}"
    echo "$INIT_OUTPUT"
    exit 1
fi

# Extract contract index
CONTRACT_INDEX=$(echo "$INIT_OUTPUT" | grep -oE '"index":[0-9]+' | grep -oE '[0-9]+' | head -1)

if [ -z "$CONTRACT_INDEX" ]; then
    echo -e "${RED}Error: Could not extract contract index${NC}"
    echo "$INIT_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✓ Contract initialized successfully${NC}"
echo -e "${GREEN}  Contract Index: ${CONTRACT_INDEX}${NC}"
echo ""

# Save to file
echo "$CONTRACT_INDEX" > contract-address.txt

echo -e "${BLUE}===================================${NC}"
echo -e "${GREEN}   Deployment Successful! 🎉${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo -e "1. Update your dApp with the new contract address:"
echo -e "   ${BLUE}localStorage.setItem('proctoring_contract_address', '$CONTRACT_INDEX');${NC}"
echo ""
echo -e "2. Or update it in your browser console and reload:"
echo -e "   ${BLUE}localStorage.setItem('proctoring_contract_address', '$CONTRACT_INDEX');${NC}"
echo -e "   ${BLUE}location.reload();${NC}"
echo ""
echo -e "3. Test NFT minting by registering for an exam!"
echo ""
echo -e "${GREEN}Contract address saved to: contract-address.txt${NC}"
echo ""
