# Parasoft Virtualize + Playwright Payment Gateway Demo

## Overview

This project demonstrates how Playwright UI automation can be combined with Parasoft Virtualize to test payment processing workflows without relying on real third-party services.

The solution uses service virtualization to simulate Account Services, Payment Gateway Services, Transaction History Services, PDF Receipt Services, and Refund Services, allowing end-to-end testing of payment scenarios.
Key capabilities include:

* Service Virtualization
* API Virtualization
* Data Source Correlation
* Dynamic Responses
* UI Automation Testing
* Transaction History
* PDF Receipt Download
* Runtime Balance Deduction
* Built-in Mode
* Virtualize Mode
* Refund Processing

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
       +--------------------------------------------+
       |                                            |
       | Built-in Mode                              | Virtualize Mode
       |                                            |
       v                                            v
+---------------------+               +----------------------+
| In-Memory Services  |               | Parasoft Virtualize  |
|                     |               |                      |
| Account Service     |               | Account Service      |
| Payment Gateway     |               | Payment Gateway      |
| Transaction History |               | Transaction History  |
| Receipt Service     |               | PDF Receipt Service  |
| Refund Service      |               | Refund Service       |
+---------------------+               +----------------------+
```

---

## Execution Modes

### Built-in Mode

When all Virtualize URL fields are left empty:

* Uses built-in account balances
* Uses built-in payment gateway responses
* Uses in-memory transaction history
* Uses built-in HTML receipt generation
* Supports runtime balance deduction
* Does not require Parasoft Virtualize

### Virtualize Mode

When Virtualize URLs are configured:

* Calls Parasoft Virtualize Account Service
* Calls Parasoft Virtualize Payment Gateway
* Calls Parasoft Virtualize Transaction History Service
* Downloads PDF Receipts from Parasoft Virtualize
* Uses Data Source Correlation
* Uses Dynamic Responses
* Calls Parasoft Virtualize Refund Service

---

## Virtualized Services

### Account Balance Service

Endpoint:

```http
POST /payment/account/balance
```

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

### Transaction History Service

Endpoint:

```http
POST /payment/history
```

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
  "transactions": [
    {
      "txnId": "TXN-1001",
      "amount": 1000,
      "status": "APPROVED"
    },
    {
      "txnId": "TXN-1003",
      "amount": 2000,
      "status": "TIMEOUT"
    }
  ]
}
```

---

### PDF Receipt Service

Endpoint:

```http
GET /payment/receipt/{transactionId}
```

Example:

```http
GET /payment/receipt/TXN-1001
```

Returns:

```text
receipt-TXN-1001.pdf
```

---

### Refund Service

Endpoint:

```http
POST /payment/refund
```

Example Request:

```json
{
  "transactionId": "TXN-1001"
}
```

Example Response:

```json
{
  "status": "REFUNDED",
  "transactionId": "TXN-1001",
  "amount": 1000,
  "message": "Refund successful"
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

Payment Gateway and Transaction History services are fully data-driven using Parasoft Virtualize Data Sources.

Example Payment Data Source:

| Card Number      | Status   | Message                   | Delay |
| ---------------- | -------- | ------------------------- | ----- |
| 4111111111111111 | APPROVED | Payment approved.         | 0     |
| 4000000000000002 | DECLINED | Payment declined.         | 0     |
| 5555555555554444 | TIMEOUT  | Payment timeout.          | 10000 |
| 4444444444444444 | FRAUD    | Transaction under review. | 0     |
| 6666666666666666 | BLOCKED  | Card blocked.             | 0     |

New scenarios can be added without creating additional responders.

---

## Runtime Balance Deduction

Successful approved payments deduct available balance.

Example:

```text
Initial Balance = MYR 5000
Payment Amount  = MYR 1000
Remaining       = MYR 4000
```

Balances remain in memory until:

* Reinitialize Data button is clicked
* Node.js application is restarted

---

## Transaction History

Transaction history is isolated by execution mode.

* Built-in Mode stores transactions in memory.
* Virtualize Mode retrieves transaction history directly from Parasoft Virtualize services.

This prevents transaction records from different execution modes from being mixed together.

The checkout application records transaction history during runtime.

Users can view:

* Timestamp
* Order ID
* Transaction ID
* Amount
* Status
* Remaining Balance
* Execution Mode
* Receipt Download Link

Transaction history can be served by:

* Built-in Runtime Storage
* Parasoft Virtualize History Service

---

## PDF Receipt Download

The application supports two receipt modes:

### Built-in Receipt

Generated dynamically by Node.js:

```text
/payment/receipt/TXN-1001
```

Features:

* Browser Print
* Save as PDF
* Transaction Summary

### Virtualized Receipt

Downloaded directly from Parasoft Virtualize:

```text
http://localhost:9080/payment/receipt/TXN-1001
```

Features:

* Binary File Virtualization
* PDF Simulation
* File Download Testing

---

## Refund Processing

Features:

* Refund approved transactions
* Prevent duplicate refunds
* Built-in refund processing
* Virtualized refund service support
* Refund transaction history tracking

```text
Original Balance = MYR 5000
Payment Amount = MYR 1000
Balance After Payment = MYR 4000
Refund Amount = MYR 1000
Balance After Refund = MYR 5000
```

### Virtualized Refund URLs

```text
http://localhost:9080/payment/refund
```

## Runtime State Management

The application manages:

| Feature             | Storage               |
| ------------------- | --------------------- |
| Card Balances          | Memory |
| Transaction History    | Memory |
| Refunded Transactions  | Memory |
| Saved URLs             | Browser Local Storage |

---

## Advanced Features

### Save URLs

Virtualize URLs can be saved locally using browser local storage.

Saved configuration survives page refreshes.

### Reinitialize Data

Restores:

* Built-in balances
* Transaction history
* Refund state
* Transaction counter

without restarting Node.js.

---

## Supported Virtualize URLs

| Setting                 | Example                                       |
| ----------------------- | --------------------------------------------- |
| Payment Gateway URL     | http://localhost:9080/payment/charge          |
| Account Balance URL     | http://localhost:9080/payment/account/balance |
| Transaction History URL | http://localhost:9080/payment/history         |
| Receipt PDF URL         | http://localhost:9080/payment/receipt         |
| Refund URL			  | http://localhost:9080/payment/refund 		  |


---

## Automated Tests

Playwright validates:

### Payment Gateway

* Approved Payment
* Declined Payment
* Timeout Payment
* Fraud Review
* Blocked Card

### Validation

* Invalid Card Number
* Insufficient Funds

### Balance Management

* Balance Deduction
* Balance Validation

### Refund Testing

* Successful Refund
* Duplicate Refund Protection
* Refund State Validation

### End-to-End Testing

* Checkout Application
* Virtualized Services
* UI Validation

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

## API Documentation

Swagger UI is available after starting the application:

```text
http://localhost:3000/api-docs
```

The API documentation includes:

* Account Balance Service
* Payment Gateway Service
* Transaction History Service
* Receipt Service
* Refund Service
* Request and Response Examples

## Run Playwright Tests

Run all tests:

```bash
npx playwright test
```

Run headed:

```bash
npx playwright test --headed --slow-mo=1000
```

Run sequentially:

```bash
npx playwright test --workers=1
```

---

## Demo Purpose

This project demonstrates:

* Service Virtualization
* API Virtualization
* File Virtualization
* Data Source Correlation
* Dynamic Responses
* UI Automation Testing
* Runtime State Management
* Transaction History
* PDF Receipt Download
* Payment Gateway Simulation
* Fraud Simulation
* Timeout Simulation
* End-to-End Testing
* Refund Processing

---

## Notes for Parasoft Virtualize

After modifying a Data Source:

1. Save the Data Source.
2. Save the `.pva` file.
3. Stop the Virtual Asset.
4. Start the Virtual Asset.
5. Re-test the scenario.

This ensures Virtualize reloads the latest Data Source values.

---

## Future Enhancements

Potential future phases:

* Loyalty Points Service
* Account Statement Service
* Multi-currency Support
* Random Failure Injection
* JWT Authentication Simulation
* Performance Testing with Parasoft Load Test
* AI-Assisted Test Generation

```
```
