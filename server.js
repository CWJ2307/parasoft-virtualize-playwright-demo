const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DEFAULT_PAYMENT_URL = process.env.PAYMENT_URL || "";
const DEFAULT_ACCOUNT_URL = process.env.ACCOUNT_URL || "";
const DEFAULT_HISTORY_URL = process.env.HISTORY_URL || "";
const DEFAULT_RECEIPT_URL = process.env.RECEIPT_URL || "";
const DEFAULT_REFUND_URL = process.env.REFUND_URL || "";

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
const transactionHistory = {};
const refundedTransactions = new Set();

let transactionCounter = 1000;

function generateTransactionId() {
  transactionCounter += 1;
  return "TXN-" + transactionCounter;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function maskCard(cardNo) {
  return cardNo.slice(0, 6) + "******" + cardNo.slice(-4);
}

function addTransaction(record) {
  if (!transactionHistory[record.cardNo]) {
    transactionHistory[record.cardNo] = [];
  }

  transactionHistory[record.cardNo].unshift({
    ...record,
    maskedCardNo: maskCard(record.cardNo),
    timestamp: new Date().toISOString()
  });
}

function findTransactionById(transactionId) {
  for (const cardNo of Object.keys(transactionHistory)) {
    const found = transactionHistory[cardNo].find(
      txn => txn.transactionId === transactionId
    );

    if (found) return found;
  }

  return null;
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
	  margin: 0;
	  padding: 32px;
	  color: #1f2937;
	}

	.page {
	  max-width: 1180px;
	  margin: 0 auto;
	}

	.header {
	  margin-bottom: 24px;
	}

	.header h1 {
	  margin: 0;
	  font-size: 34px;
	  color: #111827;
	}

	.header p {
	  margin: 8px 0 0;
	  color: #6b7280;
	}

	.grid {
	  display: grid;
	  grid-template-columns: 1fr 420px;
	  gap: 24px;
	  align-items: start;
	}

	.card {
	  background: white;
	  padding: 24px;
	  border-radius: 14px;
	  box-shadow: 0 8px 25px rgba(0,0,0,0.08);
	  border: 1px solid #e5e7eb;
	}

	.formGrid {
	  display: grid;
	  grid-template-columns: 1fr 1fr;
	  gap: 16px;
	}

	.full {
	  grid-column: 1 / -1;
	}

	h2, h3 {
	  margin-top: 0;
	  color: #1f2937;
	}

	label {
	  display: block;
	  margin-bottom: 6px;
	  font-weight: bold;
	  color: #374151;
	  font-size: 13px;
	}

	input {
	  width: 100%;
	  padding: 12px;
	  border: 1px solid #d1d5db;
	  border-radius: 8px;
	  box-sizing: border-box;
	  font-size: 14px;
	}

	.buttonRow {
	  display: grid;
	  grid-template-columns: 1fr 1fr;
	  gap: 16px;
	  margin-top: 18px;
	}

	button {
	  padding: 13px;
	  background: #2563eb;
	  color: white;
	  border: none;
	  border-radius: 8px;
	  font-size: 15px;
	  cursor: pointer;
	  font-weight: bold;
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

	.statusCard {
	  background: white;
	  padding: 24px;
	  border-radius: 14px;
	  box-shadow: 0 8px 25px rgba(0,0,0,0.08);
	  border: 1px solid #e5e7eb;
	}

	.statusTitle {
	  font-size: 14px;
	  font-weight: bold;
	  color: #374151;
	  margin-bottom: 12px;
	}

	.status {
	  padding: 18px;
	  border-radius: 10px;
	  background: #f3f4f6;
	  font-weight: bold;
	  text-align: left;
	  line-height: 1.5;
	}

	.approved {
	  background: #dcfce7;
	  color: #166534;
	}

	.declined {
	  background: #fee2e2;
	  color: #991b1b;
	}

	.timeout {
	  background: #fef3c7;
	  color: #92400e;
	}

	.section {
	  margin-top: 24px;
	}

	.historyTableWrapper {
	  overflow-x: auto;
	}

	table {
	  width: 100%;
	  border-collapse: collapse;
	  margin-top: 12px;
	  font-size: 13px;
	}

	th, td {
	  border: 1px solid #e5e7eb;
	  padding: 10px;
	  text-align: left;
	  vertical-align: middle;
	}

	th {
	  background: #f9fafb;
	  font-weight: bold;
	}

	tbody tr:hover {
	  background: #f9fafb;
	}

	a {
	  color: #2563eb;
	  font-weight: bold;
	  text-decoration: none;
	}

	.refundBtn {
	  background: #059669;
	  padding: 7px 10px;
	  border-radius: 6px;
	  color: white;
	  border: none;
	  cursor: pointer;
	  font-size: 12px;
	  width: auto;
	}

	.refundBtn:hover {
	  opacity: 0.9;
	}

	.refundBtnDisabled {
	  background: #9ca3af;
	  padding: 7px 10px;
	  border-radius: 6px;
	  color: white;
	  border: none;
	  cursor: not-allowed;
	  font-size: 12px;
	  width: auto;
	}

	.advancedGrid {
	  display: grid;
	  grid-template-columns: 1fr 1fr;
	  gap: 16px;
	}

	.hint {
	  font-size: 13px;
	  color: #4b5563;
	  line-height: 1.8;
	}

	.infoBox {
	  margin-top: 24px;
	  background: #eff6ff;
	  border: 1px solid #bfdbfe;
	  color: #1e3a8a;
	  padding: 16px;
	  border-radius: 12px;
	}

	@media (max-width: 980px) {
	  .grid {
		grid-template-columns: 1fr;
	  }

	  .formGrid,
	  .advancedGrid,
	  .buttonRow {
		grid-template-columns: 1fr;
	  }
	}
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>Payment Gateway Demo</h1>
      <p>Simulate payments, view transaction history, download receipts, and process refunds.</p>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Checkout</h2>

        <div class="formGrid">
          <div>
            <label>Order ID</label>
            <input id="orderId" value="ORD-1001" />
          </div>

          <div>
            <label>Amount</label>
            <input id="amount" value="1000" />
          </div>

          <div>
            <label>Currency</label>
            <input id="currency" value="MYR" />
          </div>

          <div>
            <label>Card Number</label>
            <input id="cardNo" value="4111111111111111" />
          </div>
        </div>

        <div class="buttonRow">
          <button id="payButton" onclick="pay()">Pay Now</button>
          <button class="secondary" onclick="viewHistory()">View Transaction History</button>
        </div>
      </div>

      <div class="statusCard">
        <div class="statusTitle">Payment Status</div>
        <div id="paymentStatus" class="status">Waiting for payment</div>
      </div>
    </div>

    <div class="card section">
      <h2>Transaction History</h2>
      <div id="historyBox" class="hint">No transaction history loaded.</div>
    </div>

    <div class="card section">
      <h2>Advanced Virtualize Settings</h2>

      <div class="advancedGrid">
        <div>
          <label>Payment Gateway URL</label>
          <input id="paymentUrl" value="${DEFAULT_PAYMENT_URL}" placeholder="Optional: http://localhost:9080/payment/charge" />
        </div>

        <div>
          <label>Account Balance URL</label>
          <input id="accountUrl" value="${DEFAULT_ACCOUNT_URL}" placeholder="Optional: http://localhost:9080/payment/account/balance" />
        </div>

        <div>
          <label>Transaction History URL</label>
          <input id="historyUrl" value="${DEFAULT_HISTORY_URL}" placeholder="Optional: http://localhost:9080/payment/history" />
        </div>

        <div>
          <label>Receipt PDF URL</label>
          <input id="receiptUrl" value="${DEFAULT_RECEIPT_URL}" placeholder="Optional: http://localhost:9080/payment/receipt" />
        </div>

        <div class="full">
          <label>Refund URL</label>
          <input id="refundUrl" value="${DEFAULT_REFUND_URL}" placeholder="Optional: http://localhost:9080/payment/refund" />
        </div>
      </div>

      <div class="buttonRow">
        <button class="secondary" onclick="saveUrls()">Save URLs</button>
        <button class="reset" onclick="reinitializeData()">Reinitialize Data</button>
      </div>
    </div>

    <div class="infoBox">
      <b>Test Cards:</b>
      Approved: 4111111111111111 |
      Declined: 4000000000000002 |
      Timeout: 5555555555554444 |
      Fraud: 4444444444444444 |
      Blocked: 6666666666666666 |
      Insufficient Funds: 7777777777777777
      <br>
      <b>Mode:</b> Leave URLs empty for Local Demo mode. Fill URLs to connect to Parasoft Virtualize.
    </div>
  </div>

  <script>
    window.addEventListener("DOMContentLoaded", () => {
      const fields = ["paymentUrl", "accountUrl", "historyUrl", "receiptUrl", "refundUrl"];

      fields.forEach(function(field) {
        const savedValue = localStorage.getItem(field);
        if (savedValue !== null) {
          document.getElementById(field).value = savedValue;
        }
      });
    });

    function saveUrls() {
      ["paymentUrl", "accountUrl", "historyUrl", "receiptUrl", "refundUrl"].forEach(function(field) {
        localStorage.setItem(field, document.getElementById(field).value);
      });

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
      document.getElementById("historyBox").innerHTML = "No transaction history loaded.";
    }

    async function refundTransaction(transactionId) {
      const statusBox = document.getElementById("paymentStatus");

      const res = await fetch("/payment/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transactionId,
          refundUrl: document.getElementById("refundUrl").value
        })
      });

      const data = await res.json();

      statusBox.innerText = data.balance !== undefined
        ? data.message + " | Balance: MYR " + data.balance + " | Mode: " + data.mode
        : data.message + (data.mode ? " | Mode: " + data.mode : "");

      if (data.status === "REFUNDED") {
        statusBox.className = "status approved";
      } else {
        statusBox.className = "status declined";
      }

      await viewHistory();
    }

    async function viewHistory() {
      const cardNo = document.getElementById("cardNo").value;
      const historyBox = document.getElementById("historyBox");
      const receiptBaseUrl = document.getElementById("receiptUrl").value.trim();

      const res = await fetch("/payment/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNo,
          historyUrl: document.getElementById("historyUrl").value
        })
      });

      const data = await res.json();

      if (!data.transactions || data.transactions.length === 0) {
        historyBox.innerHTML = data.message || "No transactions found for this card.";
        return;
      }
	
      const refundedTxnIds = new Set(
	    data.transactions
		  .filter(function(txn) {
		    return txn.status === "REFUNDED";
		  })
		  .map(function(txn) {
		    return txn.originalTransactionId ||
			  (txn.transactionId ? txn.transactionId.replace("RFND-", "") : "");
		  })
	  );	
	
      const rows = data.transactions.map(function(txn) {
        const txnId = txn.transactionId || txn.txnId || "-";
        const mode = txn.mode || data.mode || "-";

        let receiptLink = "-";
        let refundAction = "-";

        if (txnId !== "-") {
          const downloadUrl = receiptBaseUrl !== ""
            ? receiptBaseUrl + "/" + txnId
            : "/payment/receipt/" + txnId;

          receiptLink = '<a href="' + downloadUrl + '" target="_blank">Download</a>';

		  if (txn.status === "APPROVED") {
		    if (refundedTxnIds.has(txnId)) {
			  refundAction = '<button class="refundBtnDisabled" disabled>Refunded</button>';
		    } else {
			  refundAction = '<button class="refundBtn" onclick="refundTransaction(\\'' + txnId + '\\')">Refund</button>';
		    }
		  }
        }

        return "<tr>" +
          "<td>" + (txn.timestamp || "-") + "</td>" +
          "<td>" + (txn.orderId || "-") + "</td>" +
          "<td>" + txnId + "</td>" +
          "<td>" + (txn.amount || "-") + "</td>" +
          "<td>" + (txn.status || "-") + "</td>" +
          "<td>" + (txn.balance !== undefined ? txn.balance : "-") + "</td>" +
          "<td>" + mode + "</td>" +
          "<td>" + receiptLink + "</td>" +
          "<td>" + refundAction + "</td>" +
        "</tr>";
      }).join("");

      historyBox.innerHTML =
	    "<div class='historyTableWrapper'>" +
        "<table>" +
          "<thead>" +
            "<tr>" +
              "<th>Time</th>" +
              "<th>Order</th>" +
              "<th>Txn ID</th>" +
              "<th>Amount</th>" +
              "<th>Status</th>" +
              "<th>Balance</th>" +
              "<th>Mode</th>" +
              "<th>Receipt</th>" +
              "<th>Refund</th>" +
            "</tr>" +
          "</thead>" +
          "<tbody>" + rows + "</tbody>" +
        "</table>"; +
		"</div>";
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

  Object.keys(transactionHistory).forEach(cardNo => {
    delete transactionHistory[cardNo];
  });

  refundedTransactions.clear();
  transactionCounter = 1000;

  console.log("Built-in balances, refund state, and transaction history reinitialized");

  res.json({
    status: "RESET",
    message: "Built-in data, refund state, and transaction history reinitialized"
  });
});

app.post("/payment/history", async (req, res) => {
  try {
    const { cardNo, historyUrl } = req.body;

    if (historyUrl && historyUrl.trim() !== "") {
      const response = await axios.post(
        historyUrl.trim(),
        { cardNo },
        { timeout: 5000 }
      );

      return res.json({
        ...response.data,
        mode: "VIRTUALIZE"
      });
    }

    return res.json({
      cardNo,
      transactions: transactionHistory[cardNo] || [],
      mode: "BUILT_IN"
    });

  } catch (e) {
    console.error("History service error:", e.code, e.message);

    return res.status(504).json({
      cardNo: req.body.cardNo,
      transactions: [],
      mode: "VIRTUALIZE",
      message: "Transaction history service error"
    });
  }
});

app.get("/payment/receipt/:transactionId", (req, res) => {
  const { transactionId } = req.params;
  const transaction = findTransactionById(transactionId);

  if (!transaction) {
    return res.status(404).send("Receipt not found");
  }

  res.setHeader("Content-Type", "text/html");

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Receipt ${transactionId}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6f8; padding: 40px; }
    .receipt {
      background: white;
      max-width: 520px;
      margin: auto;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.12);
    }
    h1 { margin-top: 0; color: #222; }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
      gap: 20px;
    }
    .label { font-weight: bold; color: #555; }
    .footer {
      margin-top: 24px;
      font-size: 12px;
      color: #777;
      text-align: center;
    }
    button {
      margin-top: 24px;
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 8px;
      background: #2563eb;
      color: white;
      font-size: 15px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <h1>Payment Receipt</h1>

    <div class="row"><span class="label">Transaction ID</span><span>${transaction.transactionId}</span></div>
    <div class="row"><span class="label">Order ID</span><span>${transaction.orderId}</span></div>
    <div class="row"><span class="label">Card</span><span>${transaction.maskedCardNo}</span></div>
    <div class="row"><span class="label">Amount</span><span>${transaction.currency} ${transaction.amount}</span></div>
    <div class="row"><span class="label">Status</span><span>${transaction.status}</span></div>
    <div class="row"><span class="label">Remaining Balance</span><span>MYR ${transaction.balance}</span></div>
    <div class="row"><span class="label">Mode</span><span>${transaction.mode}</span></div>
    <div class="row"><span class="label">Timestamp</span><span>${transaction.timestamp}</span></div>

    <button onclick="window.print()">Print / Save as PDF</button>

    <div class="footer">
      This is a demo receipt generated by the Checkout Application.
    </div>
  </div>
</body>
</html>
  `);
});

app.post("/payment/refund", async (req, res) => {
  try {
    const { transactionId, refundUrl } = req.body;
    const useVirtualizeRefund = refundUrl && refundUrl.trim() !== "";
    const mode = useVirtualizeRefund ? "VIRTUALIZE" : "BUILT_IN";

    if (useVirtualizeRefund) {
      const refundResponse = await axios.post(
        refundUrl.trim(),
        { transactionId },
        { timeout: 5000 }
      );

      return res.json({
        ...refundResponse.data,
        mode
      });
    }

    const transaction = findTransactionById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        status: "DECLINED",
        message: "Transaction not found",
        mode
      });
    }

    if (transaction.status !== "APPROVED") {
      return res.status(200).json({
        status: "DECLINED",
        message: "Only approved transactions can be refunded",
        mode
      });
    }

    if (refundedTransactions.has(transactionId)) {
      return res.status(200).json({
        status: "DECLINED",
        message: "Transaction already refunded",
        balance: runtimeBalances[transaction.cardNo],
        mode
      });
    }

    refundedTransactions.add(transactionId);

    runtimeBalances[transaction.cardNo] =
      (runtimeBalances[transaction.cardNo] || 0) + Number(transaction.amount);

    const refundTransactionId = "RFND-" + transactionId;

    addTransaction({
      orderId: transaction.orderId,
      cardNo: transaction.cardNo,
      amount: transaction.amount,
      currency: transaction.currency,
      status: "REFUNDED",
      message: "Refund successful",
      balance: runtimeBalances[transaction.cardNo],
      transactionId: refundTransactionId,
      mode
    });

    return res.json({
      status: "REFUNDED",
      transactionId: refundTransactionId,
      originalTransactionId: transactionId,
      amount: transaction.amount,
      balance: runtimeBalances[transaction.cardNo],
      message: "Refund successful",
      mode
    });

  } catch (e) {
    console.error("Refund service error:", e.code, e.message);

    return res.status(504).json({
      status: "TIMEOUT",
      message: "Refund timeout or error",
      mode: "VIRTUALIZE"
    });
  }
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
      const result = {
        status: "DECLINED",
        message: "Insufficient funds",
        balance: currentBalance,
        mode
      };

      addTransaction({
        orderId,
        cardNo,
        amount: paymentAmount,
        currency,
        status: result.status,
        message: result.message,
        balance: result.balance,
        transactionId: null,
        mode
      });

      return res.status(200).json(result);
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

    const finalPaymentResult = { ...paymentResult };

	if (!useVirtualizePayment) {
	  finalPaymentResult.transactionId = generateTransactionId();
	}

	const result = {
	  ...finalPaymentResult,
	  balance: newBalance,
	  mode
	};

    addTransaction({
      orderId,
      cardNo,
      amount: paymentAmount,
      currency,
      status: result.status,
      message: result.message,
      balance: result.balance,
      transactionId: result.transactionId,
      mode
    });

    return res.json(result);

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