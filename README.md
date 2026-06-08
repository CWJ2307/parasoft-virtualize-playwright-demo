# Parasoft Virtualize + Playwright Payment Gateway Demo

## Overview

This project demonstrates how Playwright UI automation can work together with Parasoft Virtualize to test payment gateway integrations without relying on a real third-party payment provider.

## Architecture

```text
Playwright
    ↓
Checkout Application
    ↓
Parasoft Virtualize
    ↓
Mock Payment Gateway
```

## Scenarios

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
