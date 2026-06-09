const { test, expect } = require("@playwright/test");

const baseScenarios = [
  {
    name: "Approved Payment",
    orderId: "ORD-1001",
    amount: "1000",
    cardNo: "4111111111111111",
    expected: "Payment approved",
    timeout: 15000
  },
  {
    name: "Declined Payment",
    orderId: "ORD-1002",
    amount: "1000",
    cardNo: "4000000000000002",
    expected: "Payment declined"
  },
  {
    name: "Fraud Review Payment",
    orderId: "ORD-1004",
    amount: "1000",
    cardNo: "4444444444444444",
    expected: "Transaction under review"
  },
  {
    name: "Blocked Card",
    orderId: "ORD-1005",
    amount: "1000",
    cardNo: "6666666666666666",
    expected: "Card blocked"
  }
];

for (const scenario of baseScenarios) {
  test(scenario.name, async ({ page }) => {
    await page.goto("http://localhost:3000/checkout");

    await page.fill("#orderId", scenario.orderId);
    await page.fill("#amount", scenario.amount);
    await page.fill("#currency", "MYR");
    await page.fill("#cardNo", scenario.cardNo);

    await page.click("#payButton");

    await expect(page.locator("#paymentStatus")).toContainText(
      scenario.expected,
      {
        timeout: scenario.timeout || 5000
      }
    );
  });
}

test("Timeout Payment", async ({ page }) => {
  await page.goto("http://localhost:3000/checkout");

  await page.fill("#orderId", "ORD-1003");
  await page.fill("#amount", "1000");
  await page.fill("#currency", "MYR");
  await page.fill("#cardNo", "5555555555554444");

  await page.click("#payButton");

  await expect(page.locator("#paymentStatus")).toContainText(
    "Payment timeout.",
    {
      timeout: 20000
    }
  );
});

test("Invalid Card Number", async ({ page }) => {
  await page.goto("http://localhost:3000/checkout");

  await page.fill("#orderId", "ORD-9999");
  await page.fill("#amount", "1000");
  await page.fill("#currency", "MYR");
  await page.fill("#cardNo", "123456");

  await page.click("#payButton");

  await expect(page.locator("#paymentStatus")).toHaveText(
    "Invalid card number"
  );
});

test("Approved payment should deduct balance", async ({ page }) => {
  await page.goto("http://localhost:3000/checkout");

  await page.fill("#orderId", "ORD-2001");
  await page.fill("#amount", "1000");
  await page.fill("#currency", "MYR");
  await page.fill("#cardNo", "4111111111111111");

  await page.click("#payButton");

  await expect(page.locator("#paymentStatus")).toContainText(
    "Payment approved",
    {
      timeout: 15000
    }
  );

  await expect(page.locator("#paymentStatus")).toContainText(
    "Balance: MYR"
  );
});

test("Payment should fail when balance is insufficient", async ({ page }) => {
  await page.goto("http://localhost:3000/checkout");

  await page.fill("#orderId", "ORD-2002");
  await page.fill("#amount", "1000");
  await page.fill("#currency", "MYR");
  await page.fill("#cardNo", "7777777777777777");

  await page.click("#payButton");

  await expect(page.locator("#paymentStatus")).toContainText(
    "Insufficient funds"
  );

  await expect(page.locator("#paymentStatus")).toContainText(
    "Balance: MYR 300"
  );
});