const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PAYMENT_URL = process.env.PAYMENT_URL || "http://localhost:9080/payment/charge";

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
      padding-top: 60px;
    }
    .card {
      background: white;
      width: 420px;
      padding: 30px;
      border-radius: 14px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.12);
    }
    h1 {
      margin-top: 0;
      color: #222;
    }
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
      margin-top: 22px;
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
    .status {
      margin-top: 20px;
      padding: 14px;
      border-radius: 8px;
      background: #f3f4f6;
      font-weight: bold;
      text-align: center;
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
    .hint {
      font-size: 13px;
      color: #666;
      margin-top: 18px;
      line-height: 1.5;
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

    <div class="hint">
      Approved: 4111111111111111<br>
      Declined: 4000000000000002<br>
      Timeout: 5555555555554444
    </div>
  </div>

  <script>
    async function pay() {
      const button = document.getElementById("payButton");
      const statusBox = document.getElementById("paymentStatus");

      button.disabled = true;
      statusBox.className = "status";
      statusBox.innerText = "Processing payment...";

      try {
        const res = await fetch("/pay", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            orderId: document.getElementById("orderId").value,
            amount: document.getElementById("amount").value,
            currency: document.getElementById("currency").value,
            cardNo: document.getElementById("cardNo").value
          })
        });

        const data = await res.json();
        statusBox.innerText = data.message;

        if (data.status === "APPROVED") {
          statusBox.className = "status approved";
        } else if (data.status === "DECLINED") {
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

app.post("/pay", async (req, res) => {
  try {
    console.log("Calling payment gateway:", req.body);

    const response = await axios.post(PAYMENT_URL, req.body, {
      timeout: 15000
    });

    console.log("Payment gateway response:", response.data);
    res.json(response.data);
  } catch (e) {
    console.error("Payment gateway error:", e.code, e.message);
    res.status(504).json({
      status: "TIMEOUT",
      message: "Payment timeout or error"
    });
  }
});

app.listen(3000, () => {
  console.log("Checkout app running: http://localhost:3000/checkout");
});