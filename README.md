# Parasoft Virtualize + Playwright Payment Gateway Demo

## Overview

This project demonstrates how Playwright UI automation can be combined with Parasoft Virtualize to test payment processing workflows without relying on real third-party services.

The solution uses service virtualization to simulate both Account Services and Payment Gateway Services, allowing end-to-end testing of payment scenarios including balance validation, approvals, declines, fraud reviews, blocked cards, timeout handling, and frontend validation.

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
       +--------------------------------+
       |                                |
       v                                v
+----------------------+    +----------------------+
| Account Service      |    | Payment Gateway      |
| (Virtualize)         |    | (Virtualize)         |
+----------------------+    +----------------------+
       |                                |
       |                                |
       +-------- Balance Check ---------+
                        |
                        v
                Payment Decision
```

---

## Virtualized Services

### Account Balance Service

Endpoint:

```http
POST /payment/account/balance
```

Purpose:

* Retrieve card balance
* Validate available funds before payment processing

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

* Simulate payment gateway processing
* Return approval, decline, fraud, blocked, or timeout responses

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

The solution is fully data-driven using Parasoft Virtualize Data Sources.

### Example Data Source

| cardNo           | status   | message                   | delay | balance |
| ---------------- | -------- | ------------------------- | ----- | ------- |
| 4111111111111111 | APPROVED | Payment approved.         | 0     | 5000    |
| 4000000000000002 | DECLINED | Payment declined.         | 0     | 5000    |
| 5555555555554444 | TIMEOUT  | Payment timeout.          | 10000 | 5000    |
| 4444444444444444 | FRAUD    | Transaction under review. | 0     | 5000    |
| 6666666666666666 | BLOCKED  | Card blocked.             | 0     | 5000    |
| 7777777777777777 | APPROVED | Payment approved.         | 0     | 300     |

New payment scenarios can be added simply by updating the data source without creating additional responders.

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

Run with single worker:

```bash
npx playwright test --workers=1
```

---

## Demo Purpose

This project demonstrates:

* Service Virtualization
* UI Automation Testing
* API Virtualization
* Data Source Correlation
* Balance Validation
* Payment Gateway Simulation
* Fraud Testing
* Timeout Testing
* Negative Testing
* End-to-End Integration Testing

---

## Notes for Parasoft Virtualize Data Source

After adding or modifying rows in the data source:

1. Save the `.pva` file.
2. Save the Data Source.
3. Stop and restart the Virtual Asset.
4. Re-test the payment scenario.

If a newly added card number is not matched, Virtualize may still be using a previous runtime state. Restarting the Virtual Asset typically resolves the issue.

---

## Future Enhancements

Potential next phases:

* Transaction History Service
* Loyalty Points Service
* Refund Service
* Multi-currency Support
* Account Statement Service
* Mock Fraud Detection Service
* Performance Testing with Parasoft Load Test
