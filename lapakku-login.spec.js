/**
 * Lapakku — Login flow automation
 *
 * UI automation script for the Lapakku web app login. Covers:
 *  - Valid credentials → redirect to /home
 *  - Invalid password → inline error visible, no redirect
 *  - Empty email → field-level validation
 *
 * Stack: Selenium WebDriver (Node.js) + Mocha + Chai
 * Pattern: Page Object Model, async/await
 *
 * Author: Muhamad Fazza Muharam
 */

const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');

const BASE_URL = process.env.LAPAKKU_BASE_URL || 'https://app.lapakku.dev';
const TIMEOUT = 10_000;

// ---------- Page Object ----------
class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.url = `${BASE_URL}/login`;
    this.locators = {
      emailInput: By.css('[data-testid="login-email"]'),
      passwordInput: By.css('[data-testid="login-password"]'),
      submitBtn: By.css('[data-testid="login-submit"]'),
      errorBanner: By.css('[data-testid="login-error"]'),
      emailError: By.css('[data-testid="login-email-error"]'),
    };
  }

  async open() {
    await this.driver.get(this.url);
    await this.driver.wait(until.elementLocated(this.locators.emailInput), TIMEOUT);
  }

  async login(email, password) {
    const { emailInput, passwordInput, submitBtn } = this.locators;
    await this.driver.findElement(emailInput).clear();
    await this.driver.findElement(emailInput).sendKeys(email);
    await this.driver.findElement(passwordInput).clear();
    await this.driver.findElement(passwordInput).sendKeys(password);
    await this.driver.findElement(submitBtn).click();
  }

  async getErrorText() {
    const el = await this.driver.wait(
      until.elementLocated(this.locators.errorBanner),
      TIMEOUT
    );
    return el.getText();
  }

  async getEmailFieldError() {
    const el = await this.driver.wait(
      until.elementLocated(this.locators.emailError),
      TIMEOUT
    );
    return el.getText();
  }
}

// ---------- Test Suite ----------
describe('Lapakku — Login', function () {
  this.timeout(30_000);
  let driver;
  let loginPage;

  before(async () => {
    const options = new chrome.Options().addArguments('--headless=new', '--window-size=1280,800');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    loginPage = new LoginPage(driver);
  });

  after(async () => {
    await driver.quit();
  });

  beforeEach(async () => {
    await loginPage.open();
  });

  it('TC-01 redirects to /home when credentials are valid', async () => {
    await loginPage.login('qa-tester@lapakku.dev', 'Qa!Test1234');
    await driver.wait(until.urlContains('/home'), TIMEOUT);
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/home');
  });

  it('TC-01b shows inline error and stays on /login when password is wrong', async () => {
    await loginPage.login('qa-tester@lapakku.dev', 'wrong-password');
    const errorText = await loginPage.getErrorText();
    expect(errorText.toLowerCase()).to.include('email or password');
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/login');
  });

  it('TC-01c shows field-level error when email is empty', async () => {
    await loginPage.login('', 'Qa!Test1234');
    const fieldError = await loginPage.getEmailFieldError();
    expect(fieldError).to.match(/email.*required/i);
  });
});
