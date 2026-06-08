const { test, expect } = require("@playwright/test");

test("payment success via Virtualize", async ({ page }) => {
  await page.goto("http://localhost:3000/checkout");

  await page.fill("#orderId", "ORD-1001");
  await page.fill("#amount", "99.90");
  await page.fill("#cardNo", "4111111111111111");

  await page.click("#payButton");

  await expect(page.locator("#paymentStatus")).toContainText("Payment approved");
});