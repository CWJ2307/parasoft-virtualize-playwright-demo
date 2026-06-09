# Parasoft Virtualize + Playwright Payment Gateway Demo

## Overview

This project demonstrates how Playwright UI automation can be combined with Parasoft Virtualize to test payment processing workflows without relying on real third-party services.

The solution uses service virtualization to simulate both Account Services and Payment Gateway Services, allowing end-to-end testing of payment scenarios including:

* Balance Validation
* Approved Payments
* Declined Payments
* Fraud Review
* Blocked Cards
* Timeout Handling
* Frontend Validation
* Runtime Balance Deduction

---

## Architecture

```text
+------------+
| Playwright |
+------------+
       |
       v
+----------------------+
| Checkout Application |
+----------------------+
       |
       +------------------------------+
       |                              |
       | Built-in Mode                | Virtualize Mode
       |                              |
       v                              v
+------------------+      +----------------------+
| In-Memory Data   |      | Parasoft Virtualize  |
| Card Balances    |      | Account Service      |
| Payment Gateway  |      | Payment Gateway      |
+------------------+      +----------------------+
```

---

## Execution Modes

### Built-in Mode

When both URL fields are left empty:

* Uses in-memory account balances
* Uses built-in payment gateway responses
* Supports balance deduction
* Supports balance reset
* Does not require Parasoft Virtualize

### Virtualize Mode

When Virtualize URLs are provided:

* Calls Parasoft Virtualize Account Service
* Calls Parasoft Virtualize Payment Gateway Service
* Uses virtualized responses
* Suitable for service virtualization demonstrations

---

## Virtualized Services

### Account Balance Service

Endpoint:

```http
POST /payment/account/balance
```

Purpose:

* Retrieve available card balance
* Validate funds before payment processing

Example Request:

```json
{
  "cardNo": "4111111111111111"
}
```

Example Response:

```json
{
  "cardNo": "4111111111111111",
  "balance": 5000
}
```

---

### Payment Gateway Service

Endpoint:

```http
POST /payment/charge
```

Purpose:

* Simulate payment processing
* Return approved, declined, fraud, blocked, or timeout responses

Example Request:

```json
{
  "orderId": "ORD-1001",
  "amount": "1000",
  "currency": "MYR",
  "cardNo": "4111111111111111"
}
```

---

## Test Scenarios

| Scenario            | Card Number      | Balance | Expected Result          |
| ------------------- | ---------------- | ------- | ------------------------ |
| Approved Payment    | 4111111111111111 | 5000    | Payment approved         |
| Declined Payment    | 4000000000000002 | 5000    | Payment declined         |
| Timeout Payment     | 5555555555554444 | 5000    | Payment timeout          |
| Fraud Review        | 4444444444444444 | 5000    | Transaction under review |
| Blocked Card        | 6666666666666666 | 5000    | Card blocked             |
| Insufficient Funds  | 7777777777777777 | 300     | Insufficient funds       |
| Invalid Card Number | 123456           | N/A     | Invalid card number      |

---

## Data Source Driven Virtualization

The virtual payment gateway is fully data-driven using Parasoft Virtualize Data Sources.

Example:

| Card Number      | Status   | Message                   | Delay |
| ---------------- | -------- | ------------------------- | ----- |
| 4111111111111111 | APPROVED | Payment approved.         | 0     |
| 4000000000000002 | DECLINED | Payment declined.         | 0     |
| 5555555555554444 | TIMEOUT  | Payment timeout.          | 10000 |
| 4444444444444444 | FRAUD    | Transaction under review. | 0     |
| 6666666666666666 | BLOCKED  | Card blocked.             | 0     |

New payment scenarios can be added by updating the data source without creating additional responders.

---

## Runtime Balance Deduction

In Built-in Mode, successful approved payments deduct the available balance.

Example:

Initial Balance:

```text
4111111111111111 = MYR 5000
```

Payment:

```text
Amount = MYR 1000
```

Remaining Balance:

```text
MYR 4000
```

Balances remain in memory until:

* Reinitialize Data button is clicked
* Node.js application is restarted

---

## Advanced Features

### Save URLs

The application can persist Virtualize endpoint URLs using browser local storage.

Configured URLs remain available after refreshing the page.

### Reinitialize Data

The Reinitialize Data button restores all built-in balances to their original values without restarting Node.js.

Default balances:

| Card Number      | Balance |
| ---------------- | ------- |
| 4111111111111111 | 5000    |
| 4000000000000002 | 5000    |
| 5555555555554444 | 5000    |
| 4444444444444444 | 5000    |
| 6666666666666666 | 5000    |
| 7777777777777777 | 300     |

---

## Automated Tests

The Playwright test suite validates:

### Payment Gateway Scenarios

* Approved Payment
* Declined Payment
* Timeout Payment
* Fraud Review
* Blocked Card

### Validation Scenarios

* Invalid Card Number
* Insufficient Funds

### Balance Validation

* Approved payment deducts balance
* Balance validation before payment processing

---

## Technologies

* Node.js
* Express
* Playwright
* Parasoft Virtualize

---

## Run Application

Install dependencies:

```bash
npm install
```

Start application:

```bash
node server.js
```

Open browser:

```text
http://localhost:3000/checkout
```

---

## Run Playwright Tests

Run all tests:

```bash
npx playwright test
```

Run with browser visible:

```bash
npx playwright test --headed --slow-mo=1000
```

Run using a single worker:

```bash
npx playwright test --workers=1
```

---

## Demo Purpose

This project demonstrates:

* Service Virtualization
* API Virtualization
* Data Source Correlation
* UI Automation Testing
* Balance Validation
* Runtime State Management
* Payment Gateway Simulation
* Fraud Testing
* Timeout Testing
* Negative Testing
* End-to-End Integration Testing

---

## Notes for Parasoft Virtualize Data Source

After adding or modifying rows in a Data Source:

1. Save the Data Source.
2. Save the `.pva` file.
3. Stop and restart the Virtual Asset.
4. Re-test the payment scenario.

If a newly added card number does not match, Virtualize may still be using a previous runtime state. Restarting the Virtual Asset typically resolves the issue.

---

## Future Enhancements

Potential future phases:

* Transaction History Service
* Loyalty Points Service
* Refund Service
* Multi-currency Support
* Account Statement Service
* Mock Fraud Detection Service
* Performance Testing with Parasoft Load Test
