const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DEFAULT_PAYMENT_URL = process.env.PAYMENT_URL || "";
const DEFAULT_ACCOUNT_URL = process.env.ACCOUNT_URL || "";

const builtInPaymentData = {
  "4111111111111111": { status: "APPROVED", transactionId: "TXN-1001", message: "Payment approved.", delay: 0 },
  "4000000000000002": { status: "DECLINED", transactionId: "TXN-1002", message: "Payment declined.", delay: 0 },
  "5555555555554444": { status: "TIMEOUT", transactionId: "TXN-1003", message: "Payment timeout.", delay: 10000 },
  "4444444444444444": { status: "FRAUD", transactionId: "TXN-1004", message: "Transaction under review.", delay: 0 },
  "6666666666666666": { status: "BLOCKED", transactionId: "TXN-1005", message: "Card blocked.", delay: 0 },
  "7777777777777777": { status: "APPROVED", transactionId: "TXN-1006", message: "Payment approved.", delay: 0 }
};

const builtInBalances = {
  "4111111111111111": 5000,
  "4000000000000002": 5000,
  "5555555555554444": 5000,
  "4444444444444444": 5000,
  "6666666666666666": 5000,
  "7777777777777777": 300
};

const runtimeBalances = { ...builtInBalances };

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get("/checkout", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Payment Gateway Demo</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f4f6f8;
      display: flex;
      justify-content: center;
      padding: 40px 0;
    }
    .card {
      background: white;
      width: 460px;
      padding: 30px;
      border-radius: 14px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.12);
    }
    h1 { margin-top: 0; color: #222; }
    label {
      display: block;
      margin-top: 14px;
      font-weight: bold;
      color: #444;
    }
    input {
      width: 100%;
      padding: 12px;
      margin-top: 6px;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-sizing: border-box;
      font-size: 14px;
    }
    button {
      width: 100%;
      margin-top: 18px;
      padding: 13px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
    }
    button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    .secondary {
      background: #374151;
    }
    .reset {
      background: #dc2626;
    }
    .status {
      margin-top: 20px;
      padding: 14px;
      border-radius: 8px;
      background: #f3f4f6;
      font-weight: bold;
      text-align: center;
    }
    .approved { background: #dcfce7; color: #166534; }
    .declined { background: #fee2e2; color: #991b1b; }
    .timeout { background: #fef3c7; color: #92400e; }
    .advanced {
      margin-top: 22px;
      padding-top: 18px;
      border-top: 1px solid #e5e7eb;
    }
    .advanced h3 {
      margin: 0 0 10px 0;
      font-size: 15px;
      color: #374151;
    }
    .hint {
      font-size: 13px;
      color: #666;
      margin-top: 18px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Payment Gateway Demo</h1>

    <label>Order ID</label>
    <input id="orderId" value="ORD-1001" />

    <label>Amount</label>
    <input id="amount" value="1000" />

    <label>Currency</label>
    <input id="currency" value="MYR" />

    <label>Card Number</label>
    <input id="cardNo" value="4111111111111111" />

    <button id="payButton" onclick="pay()">Pay Now</button>

    <div id="paymentStatus" class="status">Waiting for payment</div>

    <div class="advanced">
      <h3>Advanced Virtualize Settings</h3>

      <label>Payment Gateway URL</label>
      <input id="paymentUrl" value="${DEFAULT_PAYMENT_URL}" placeholder="Optional: http://localhost:9080/payment/charge" />

      <label>Account Balance URL</label>
      <input id="accountUrl" value="${DEFAULT_ACCOUNT_URL}" placeholder="Optional: http://localhost:9080/payment/account/balance" />

      <button class="secondary" onclick="saveUrls()">Save URLs</button>
      <button class="reset" onclick="reinitializeData()">Reinitialize Data</button>
    </div>

    <div class="hint">
      <b>Test Cards</b><br>
      Approved: 4111111111111111<br>
      Declined: 4000000000000002<br>
      Timeout: 5555555555554444<br>
      Fraud: 4444444444444444<br>
      Blocked: 6666666666666666<br>
      Insufficient Funds: 7777777777777777<br><br>

      <b>Mode</b><br>
      Built-in mode: leave both URL fields empty<br>
      Virtualize mode: fill in the Payment Gateway URL and Account Balance URL
    </div>
  </div>

  <script>
    window.addEventListener("DOMContentLoaded", () => {
      const savedPaymentUrl = localStorage.getItem("paymentUrl");
      const savedAccountUrl = localStorage.getItem("accountUrl");

      if (savedPaymentUrl !== null) {
        document.getElementById("paymentUrl").value = savedPaymentUrl;
      }

      if (savedAccountUrl !== null) {
        document.getElementById("accountUrl").value = savedAccountUrl;
      }
    });

    function saveUrls() {
      localStorage.setItem("paymentUrl", document.getElementById("paymentUrl").value);
      localStorage.setItem("accountUrl", document.getElementById("accountUrl").value);

      const statusBox = document.getElementById("paymentStatus");
      statusBox.innerText = "URLs saved";
      statusBox.className = "status approved";
    }

    async function reinitializeData() {
      const statusBox = document.getElementById("paymentStatus");

      const res = await fetch("/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();

      statusBox.innerText = data.message;
      statusBox.className = "status approved";
    }

    async function pay() {
      const cardNo = document.getElementById("cardNo").value;
      const statusBox = document.getElementById("paymentStatus");
      const button = document.getElementById("payButton");

      if (!/^\\d{16}$/.test(cardNo)) {
        statusBox.innerText = "Invalid card number";
        statusBox.className = "status declined";
        return;
      }

      button.disabled = true;
      statusBox.className = "status";
      statusBox.innerText = "Processing payment...";

      try {
        const res = await fetch("/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: document.getElementById("orderId").value,
            amount: document.getElementById("amount").value,
            currency: document.getElementById("currency").value,
            cardNo,
            paymentUrl: document.getElementById("paymentUrl").value,
            accountUrl: document.getElementById("accountUrl").value
          })
        });

        const data = await res.json();

        statusBox.innerText = data.balance !== undefined
          ? data.message + " | Balance: MYR " + data.balance + " | Mode: " + data.mode
          : data.message + (data.mode ? " | Mode: " + data.mode : "");

        if (data.status === "APPROVED" || data.status === "RESET") {
          statusBox.className = "status approved";
        } else if (
          data.status === "DECLINED" ||
          data.status === "FRAUD" ||
          data.status === "BLOCKED"
        ) {
          statusBox.className = "status declined";
        } else {
          statusBox.className = "status timeout";
        }

      } catch (e) {
        statusBox.innerText = "Payment timeout or error";
        statusBox.className = "status timeout";
      } finally {
        button.disabled = false;
      }
    }
  </script>
</body>
</html>
  `);
});

app.post("/reset", (req, res) => {
  Object.keys(builtInBalances).forEach(cardNo => {
    runtimeBalances[cardNo] = builtInBalances[cardNo];
  });

  console.log("Built-in balances reinitialized:", runtimeBalances);

  res.json({
    status: "RESET",
    message: "Built-in data reinitialized"
  });
});

app.post("/pay", async (req, res) => {
  try {
    console.log("Payment request:", req.body);

    const { orderId, amount, currency, cardNo, paymentUrl, accountUrl } = req.body;
    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        status: "DECLINED",
        message: "Invalid amount"
      });
    }

    const useVirtualizeAccount = accountUrl && accountUrl.trim() !== "";
    const useVirtualizePayment = paymentUrl && paymentUrl.trim() !== "";
    const mode = useVirtualizeAccount || useVirtualizePayment ? "VIRTUALIZE" : "BUILT_IN";

    let currentBalance;

    if (useVirtualizeAccount) {
      const balanceResponse = await axios.post(
        accountUrl.trim(),
        { cardNo },
        { timeout: 5000 }
      );

      currentBalance = Number(balanceResponse.data.balance);
    } else {
      currentBalance = runtimeBalances[cardNo];
    }

    if (currentBalance === undefined || Number.isNaN(currentBalance)) {
      return res.status(404).json({
        status: "DECLINED",
        message: "Card not found",
        mode
      });
    }

    if (currentBalance < paymentAmount) {
      return res.status(200).json({
        status: "DECLINED",
        message: "Insufficient funds",
        balance: currentBalance,
        mode
      });
    }

    let paymentResult;

    if (useVirtualizePayment) {
      const paymentResponse = await axios.post(
        paymentUrl.trim(),
        { orderId, amount, currency, cardNo },
        { timeout: 15000 }
      );

      paymentResult = paymentResponse.data;
    } else {
      paymentResult = builtInPaymentData[cardNo];

      if (!paymentResult) {
        return res.status(404).json({
          status: "DECLINED",
          message: "Card not found",
          mode
        });
      }

      if (paymentResult.status === "TIMEOUT") {
        await sleep(paymentResult.delay || 10000);
        return res.status(504).json({
          status: "TIMEOUT",
          message: "Payment timeout or error",
          mode
        });
      }

      if (paymentResult.delay && paymentResult.delay > 0) {
        await sleep(paymentResult.delay);
      }
    }

    let newBalance = currentBalance;

    if (paymentResult.status === "APPROVED") {
      newBalance = currentBalance - paymentAmount;

      if (!useVirtualizeAccount) {
        runtimeBalances[cardNo] = newBalance;
      }
    }

    return res.json({
      ...paymentResult,
      balance: newBalance,
      mode
    });

  } catch (e) {
    console.error("Payment flow error:", e.code, e.message);

    return res.status(504).json({
      status: "TIMEOUT",
      message: "Payment timeout or error"
    });
  }
});

app.listen(3000, () => {
  console.log("Checkout app running: http://localhost:3000/checkout");
});