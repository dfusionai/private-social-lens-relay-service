# Wallet and Transaction Monitoring

This module provides monitoring for wallet balances and transaction anomalies in the Vana Relay Service.

## Features

### Wallet Balance Monitoring
- Periodic checks of wallet balances
- Configurable balance thresholds
- Email alerts when balances fall below thresholds

### Transaction Anomaly Detection
- Detection of failed transactions
- High gas usage monitoring
- Repeated failures of the same method
- Email alerts for transaction anomalies

## Configuration

Configure the monitoring module via environment variables:

```
# Monitoring Configuration
MONITORING_WALLET_DEFAULT_THRESHOLD=0.1
MONITORING_OPERATIONS_EMAIL=operations@example.com
MONITORING_HIGH_GAS_THRESHOLD=500000000000
MONITORING_FAILURE_COUNT_THRESHOLD=3
MONITORING_CHECK_PERIOD_HOURS=24
```

### Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `MONITORING_WALLET_DEFAULT_THRESHOLD` | Default balance threshold in ETH | 0.1 |
| `MONITORING_OPERATIONS_EMAIL` | Email address for alerts | operations@example.com |
| `MONITORING_HIGH_GAS_THRESHOLD` | High gas usage threshold in wei | 500000000000 |
| `MONITORING_FAILURE_COUNT_THRESHOLD` | Number of failures to trigger alert | 3 |
| `MONITORING_CHECK_PERIOD_HOURS` | Hours to look back for anomalies | 24 |

## Email Templates

The monitoring system uses the following email templates:
- `low-balance-alert.hbs` - Wallet balance alerts
- `transaction-anomaly-alert.hbs` - Transaction anomaly alerts
- `monitoring-error-alert.hbs` - Monitoring system errors

## Manual Checks

You can manually trigger monitoring checks via the `MonitoringService`:

```typescript
// Inject the monitoring service
constructor(private readonly monitoringService: MonitoringService) {}

// Trigger system health check
await this.monitoringService.checkSystemHealth();
```

## Setting Custom Thresholds

You can set custom thresholds for specific wallets:

```typescript
// Inject the wallet monitoring service
constructor(private readonly walletMonitoringService: WalletMonitoringService) {}

// Set a custom threshold for a wallet
this.walletMonitoringService.setBalanceThreshold(
  'walletId', 
  '0.5', // 0.5 ETH
  'custom@example.com' // Optional: custom email for alerts
);
``` 