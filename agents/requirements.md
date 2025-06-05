need to implement secure API endpoints in a backend that accepts http requests that will make smart contract function calls, so that the backend can perform the transaction on behalf of the user.
the smart contract functions are:
data registry contract -addFileWithPermission
tee pool contract - requestContributionProof
dlp contract - requestReward
only the authorized frontend app (miner and webapp) can make requests to the smart contract proxy endpoints, to prevent abuse or malicious third-party access.
securely store and use a hot wallet for executing smart contract functions, to relay transactions on behalf of users.
trigger smart contract interactions from the frontend without MetaMask or paying gas, so that the backend handles the complexity and costs.
log all transactions made via the hot wallet, to audit usage and to detect abnormalities/abuse.
