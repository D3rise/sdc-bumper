import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Page, ElementHandle } from "puppeteer";
import dotenv from "dotenv";
import moment from "moment";
dotenv.config();

const WAIT_TIME = 4000;
const MENU_SELECTOR = "#name1337";
const MY_SERVERS_SELECTOR = "[href='/my']";

puppeteer
  .use(StealthPlugin())
  .launch({ headless: true })
  .then(async browser => {
    const sdcPage = await browser.newPage();

    console.log("[LOAD] Navigating to SDC...");
    await sdcPage.goto("https://server-discord.com/");
    await sdcPage.waitFor(WAIT_TIME);
    await login(sdcPage);

    await sdcPage.click(MENU_SELECTOR);
    const myServersButton = await sdcPage.$(MY_SERVERS_SELECTOR);
    await myServersButton.click();
    await sdcPage.waitFor(WAIT_TIME);
    if (!sdcPage.url().endsWith("/my")) {
      let cookies = await sdcPage.cookies();
      await sdcPage.deleteCookie(...cookies);
      await login(sdcPage);
    }

    await bumpServers(sdcPage);
  });

async function login(page: Page) {
  console.log("[LOAD] Logging in...");
  await page.click(MENU_SELECTOR); // click the 'Menu' button

  const loginButton = await page.$("[href='/login']");
  if (!loginButton) {
    console.log("[LOAD] Logged in!");
    return true;
  } else {
    await loginButton.click();
    await page.waitFor(WAIT_TIME);
    const authorizeButtonSelector = "[class*='lookFilled'][type='button']";
    let authorizeButton = await page.$(authorizeButtonSelector);

    // if not logged in
    if (!authorizeButton) {
      console.log("[LOAD] Not logged in to Discord, trying to log in...");
      await page.waitFor(1000); // for low-end systems

      const emailField = await page.$("[type='email']");
      const passwordField = await page.$("[type='password']");
      const submitButton = await page.$("[type='submit']");

      await emailField.type(process.env.DISCORD_EMAIL);
      await passwordField.type(process.env.DISCORD_PASSWORD);
      await submitButton.click();

      await page.waitFor(WAIT_TIME + 5000);
    } else {
      console.log(
        "[LOAD] Already logged in to Discord, trying to click the 'Authorize' button..."
      );
    }

    authorizeButton = await page.$(authorizeButtonSelector);
    await authorizeButton.click();
    await page.waitFor(WAIT_TIME);

    console.log("[LOAD] Logged in!");
    return true;
  }
}

async function bumpServers(myServersPage: Page) {
  if (!myServersPage.url().endsWith("/my")) {
    console.log("[BUMP] Some error occured...");
    return false;
  }

  const buttons = await myServersPage.$$(".up");
  buttons.forEach(async (button, i) => {
    await bumpServer(button, i);
  });

  setTimeout(setBumpTimeout.bind(this, buttons), 10000); // wait for sdc to handle bumps
}

async function bumpServer(
  serverUpButton: ElementHandle<Element>,
  index: number
) {
  serverUpButton.click();
  console.log(`[BUMP] Tried to bump server #${index + 1}`);
}

async function setBumpTimeout(serverButtons: ElementHandle<Element>[]) {
  serverButtons.forEach(async (button, i) => {
    if (await button.getProperty("disabled")) {
      // hold my beer and get me a timer string
      const timer = await button.getProperty("lastChild");
      const timerText = await (
        await timer.getProperty("textContent")
      ).jsonValue();

      const duration = moment.duration(timerText);

      setTimeout(bumpServer.bind(this, button), duration.asMilliseconds());
      console.log(`[BUMP] Bump server #${i + 1} in ${timerText}`);
    }
  });
}
