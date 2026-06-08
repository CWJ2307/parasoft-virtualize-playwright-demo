# Parasoft Virtualize + Playwright Payment Gateway Demo

## Overview

This project demonstrates how Playwright UI automation can be combined with Parasoft Virtualize to test payment gateway integrations without relying on a real third-party provider.

The demo covers positive, negative, timeout, and frontend validation scenarios commonly found in enterprise payment systems.

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
       v
+----------------------+
| Parasoft Virtualize  |
+----------------------+
       |
       +--> APPROVED
       +--> DECLINED
       +--> TIMEOUT
	   +--> Fraud
```

## Test Scenarios

| Scenario | Card Number | Expected Result |
|-----------|-----------|-----------|
| Approved Payment | 4111111111111111 | Payment approved |
| Declined Payment | 4000000000000002 | Payment declined |
| Timeout | 5555555555554444 | Payment timeout or error |
| Fraud Review | 4444444444444444 | Transaction under review |
| Invalid Card Number | 123456 | Invalid card number |

## Data Source Driven Virtualization

The virtual payment gateway is driven by a Parasoft Virtualize data source.

Example data source:

| Card Number | Status | Message | Delay |
|---|---|---|---|
| 4111111111111111 | APPROVED | Payment approved | 0 |
| 4000000000000002 | DECLINED | Payment declined | 0 |
| 5555555555554444 | TIMEOUT | Payment timeout or error | 10000 |
| 4444444444444444 | FRAUD | Transaction under review | 0 |

This allows new payment scenarios to be added by updating the data source without creating additional responders.

### Approved Payment

Card Number:

```text
4111111111111111
```

Response:

```json
{
  "status": "APPROVED",
  "transactionId": "TXN-1001",
  "message": "Payment approved"
}
```

### Declined Payment

Card Number:

```text
4000000000000002
```

Response:

```json
{
  "status": "DECLINED",
  "message": "Payment declined"
}
```

### Timeout

Card Number:

```text
5555555555554444
```

Response:

```text
HTTP 504 Gateway Timeout
```

### Fraud Review

Card Number:

```text
4444444444444444
```

Response:

```text
{
  "status": "FRAUD",
  "message": "Transaction under review"
}
```

### Invalid Card Number

Card Number:

```text
123456
```

Response:

```text
Invalid card number
```

## Technologies

* Node.js
* Express
* Playwright
* Parasoft Virtualize

## Run Application

Install dependencies:

```bash
npm install
```

Start the application:

```bash
node server.js
```

Open:

```text
http://localhost:3000/checkout
```

## Run Playwright Tests

```bash
npx playwright test
```

Run with browser visible:

```bash
npx playwright test --headed --slow-mo=1000
```

## Demo Purpose

This project demonstrates:

* Service Virtualization
* UI Automation Testing
* Positive Testing
* Negative Testing
* Timeout Testing
* Payment Gateway Simulation
