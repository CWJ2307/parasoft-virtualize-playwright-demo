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
```

## Test Scenarios

| Scenario | Card Number | Expected Result |
|-----------|-----------|-----------|
| Approved Payment | 4111111111111111 | Payment approved |
| Declined Payment | 4000000000000002 | Payment declined |
| Timeout | 5555555555554444 | Payment timeout or error |
| Invalid Card Number | 123456 | Invalid card number |

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
