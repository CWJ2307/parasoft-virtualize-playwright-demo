const { test, expect } = require("@playwright/test");

const scenarios = [
  {
    name: "Approved Payment",
    orderId: "ORD-1001",
    cardNo: "4111111111111111",
    expected: "Payment approved",
    timeout: 15000
  },
  {
    name: "Declined Payment",
    orderId: "ORD-1002",
    cardNo: "4000000000000002",
    expected: "Payment declined"
  },
  {
    name: "Timeout Payment",
    orderId: "ORD-1003",
    cardNo: "5555555555554444",
    expected: "Payment timeout or error",
    timeout: 15000
  },
  {
    name: "Fraud Review Payment",
    orderId: "ORD-1004",
    cardNo: "4444444444444444",
    expected: "Transaction under review"
  }
];

for (const scenario of scenarios) {

  test(scenario.name, async ({ page }) => {

    await page.goto("http://localhost:3000/checkout");

    await page.fill("#orderId", scenario.orderId);
    await page.fill("#amount", "1000");
    await page.fill("#currency", "MYR");
    await page.fill("#cardNo", scenario.cardNo);

    await page.click("#payButton");

    await expect(
      page.locator("#paymentStatus")
    ).toHaveText(
      scenario.expected,
      {
        timeout: scenario.timeout || 5000
      }
    );

  });

}

test("Invalid Card Number", async ({ page }) => {

  await page.goto("http://localhost:3000/checkout");

  await page.fill("#orderId", "ORD-9999");
  await page.fill("#amount", "1000");
  await page.fill("#currency", "MYR");
  await page.fill("#cardNo", "123456");

  await page.click("#payButton");

  await expect(
    page.locator("#paymentStatus")
  ).toHaveText("Invalid card number");

});