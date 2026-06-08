const { test, expect } = require("@playwright/test");

test("approved payment should show success message", async ({ page }) => {
  await page.goto("http://localhost:3000/checkout");

  await page.fill("#orderId", "ORD-1001");
  await page.fill("#amount", "1000");
  await page.fill("#currency", "MYR");
  await page.fill("#cardNo", "4111111111111111");

  await page.click("#payButton");
  
  await expect(page.locator("#paymentStatus")).toHaveText("Payment approved", {timeout: 15000 });
});

test("declined payment should show declined message", async ({ page }) => {
  await page.goto("http://localhost:3000/checkout");

  await page.fill("#orderId", "ORD-1002");
  await page.fill("#amount", "1000");
  await page.fill("#currency", "MYR");
  await page.fill("#cardNo", "4000000000000002");

  await page.click("#payButton");
  
  await expect(page.locator("#paymentStatus")).toHaveText("Payment declined");
});

test("timeout payment should show timeout error message", async ({ page }) => {
  await page.goto("http://localhost:3000/checkout");

  await page.fill("#orderId", "ORD-1003");
  await page.fill("#amount", "1000");
  await page.fill("#currency", "MYR");
  await page.fill("#cardNo", "5555555555554444");

  await page.click("#payButton");
  
  await expect(page.locator("#paymentStatus")).toHaveText("Payment timeout or error");
});

test("invalid card number should show validation message", async ({ page }) => {

  await page.goto("http://localhost:3000/checkout");

  await page.fill("#orderId", "ORD-1004");
  await page.fill("#amount", "1000");
  await page.fill("#currency", "MYR");
  await page.fill("#cardNo", "123456");

  await page.click("#payButton");

  await expect(
      page.locator("#paymentStatus")
  ).toHaveText("Invalid card number");

});

test("fraud review payment", async ({ page }) => {

  await page.goto("http://localhost:3000/checkout");

  await page.fill("#cardNo", "4444444444444444");

  await page.click("#payButton");

  await expect(
    page.locator("#paymentStatus")
  ).toContainText("Transaction under review");
});