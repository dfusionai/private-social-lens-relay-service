# Vana Relay Service Improvement Plan

## Introduction

This document outlines a comprehensive plan for implementing the Vana Relay Service, which will serve as a secure backend proxy for blockchain interactions. The service will allow users to interact with smart contracts without directly managing gas fees or requiring MetaMask, simplifying the user experience while maintaining security.

## 1. API Security

### Current State
The project is based on a NestJS boilerplate that includes authentication features, but requires specific implementation for securing API endpoints that will relay blockchain transactions.

### Goals
- Implement secure API endpoints that only authorized frontend applications can access
- Prevent abuse or malicious third-party access to smart contract functions

### Proposed Changes

#### 1.1 Authentication System
**Rationale:** A robust authentication system is essential to ensure that only authorized applications can access the relay service.

- Implement JWT-based authentication for frontend applications (miner and webapp)
- Create an API key system for application-level authentication
- Set up rate limiting to prevent abuse of endpoints

#### 1.2 Request Validation
**Rationale:** Each request must be validated to ensure it contains the necessary information and is properly formatted.

- Implement request validation middleware using class-validator
- Create DTOs (Data Transfer Objects) for each smart contract function
- Add signature verification to ensure requests come from authorized sources

## 2. Smart Contract Integration

### Current State
The requirements specify three smart contract functions that need to be supported, but the integration is not yet implemented.

### Goals
- Enable backend to make smart contract function calls on behalf of users
- Support specific functions: addFileWithPermission, requestContributionProof, requestReward

### Proposed Changes

#### 2.1 Contract Interface Implementation
**Rationale:** The service needs to interact with specific smart contracts, requiring proper interfaces and connection handling.

- Create TypeScript interfaces for each smart contract (data registry, tee pool, dlp)
- Implement contract ABIs (Application Binary Interfaces) for interaction
- Set up a contract service layer to abstract interaction details

#### 2.2 Function-Specific Endpoints
**Rationale:** Each smart contract function requires a dedicated endpoint with appropriate validation and processing.

- Create `/api/relay/data-registry/add-file` endpoint for addFileWithPermission
- Create `/api/relay/tee-pool/request-proof` endpoint for requestContributionProof
- Create `/api/relay/dlp/request-reward` endpoint for requestReward
- Implement proper error handling and response formatting for each endpoint

## 3. Wallet Management

### Current State
The service needs to securely store and use a hot wallet, but this functionality is not yet implemented.

### Goals
- Securely store and use a hot wallet for executing smart contract functions
- Protect private keys while maintaining operational capability

### Proposed Changes

#### 3.1 Secure Wallet Storage
**Rationale:** Private keys must be stored securely to prevent unauthorized access while remaining available for transaction signing.

- Implement encrypted storage for wallet private keys
- Use environment variables and secure vaults for key management
- Create a key rotation strategy to minimize risk

#### 3.2 Transaction Signing Service
**Rationale:** A dedicated service is needed to handle the signing of transactions using the hot wallet.

- Create a wallet service to manage transaction signing
- Implement nonce management to prevent transaction collisions
- Add gas price optimization to balance cost and confirmation speed

## 4. Transaction Handling

### Current State
The system needs to handle blockchain transactions on behalf of users, but this functionality is not yet implemented.

### Goals
- Relay transactions on behalf of users
- Handle the complexity and costs of blockchain interactions

### Proposed Changes

#### 4.1 Transaction Queue System
**Rationale:** A queue system ensures transactions are processed reliably even during high load or network issues.

- Implement a transaction queue to manage pending transactions
- Create a retry mechanism for failed transactions
- Set up a priority system for different transaction types

#### 4.2 Gas Management
**Rationale:** Effective gas management is crucial for cost control and ensuring transactions are confirmed in a timely manner.

- Implement dynamic gas price estimation
- Create a gas budget system to control costs
- Set up alerts for unusual gas price conditions

## 5. Monitoring and Logging

### Current State
The requirements specify the need for transaction logging, but a comprehensive monitoring system is not yet implemented.

### Goals
- Log all transactions made via the hot wallet
- Enable auditing of usage and detection of abnormalities/abuse

### Proposed Changes

#### 5.1 Transaction Logging
**Rationale:** Comprehensive logging is essential for auditing and troubleshooting.

- Create a structured logging system for all blockchain transactions
- Store transaction details including sender, function, parameters, and status
- Implement log rotation and archiving for historical data

#### 5.2 Monitoring and Alerting
**Rationale:** Proactive monitoring helps detect issues before they impact users and identifies potential abuse.

- Set up real-time monitoring of transaction volume and patterns
- Implement alerting for suspicious activities or system issues
- Create a dashboard for visualizing system health and transaction metrics

## 6. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- Set up project structure and core services
- Implement authentication and basic security features
- Create contract interfaces and wallet management

### Phase 2: Core Functionality (Weeks 3-4)
- Implement transaction handling and queue system
- Create endpoints for each smart contract function
- Set up basic logging and monitoring

### Phase 3: Refinement and Testing (Weeks 5-6)
- Enhance security features and implement rate limiting
- Optimize gas management and transaction processing
- Complete comprehensive logging and monitoring system
- Conduct thorough testing and security audits

## Conclusion

This plan outlines a comprehensive approach to implementing the Vana Relay Service, addressing all requirements while ensuring security, reliability, and maintainability. By following this structured approach, we can create a robust service that simplifies blockchain interactions for users while maintaining the necessary security controls.
