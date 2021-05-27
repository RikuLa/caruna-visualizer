import puppeteer, { Page, Browser } from "puppeteer";

const MOBILE_TRACKING_URL =
  "https://energiaseuranta.caruna.fi/mobile/#/tracking";

interface Cookie {
  name: string;
  path: string;
  value: string;
}

const getAllCookies = async (): Promise<Array<Cookie>> => {
  if (!process.env.username || !process.env.password) {
    throw new Error("Missing credentials, add username and/or password to env");
  }
  let browser: Browser;
  try {
    console.log("Launching puppeteer");

    browser = await puppeteer.launch({
      headless: true,
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
    });
    const page: Page = await browser.newPage();

    await page.goto(MOBILE_TRACKING_URL);

    await page.waitForNavigation();

    await page.type("#ttqusername", process.env.username);
    await page.type("#user-password", process.env.password);

    console.log("Logging in");

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      page.click(".btn--login"),
    ]);

    console.log("Waiting for cookies to be set");
    // Ugly hack alert, nav takes a little while so this ensures all the cookies needed are actually set
    await new Promise((res) => {
      setTimeout(res, 5000);
    });

    console.log("Waiting done");

    // @ts-ignore
    const { cookies } = await page._client.send("Network.getAllCookies");

    return cookies;
  } catch (e) {
    console.error("Unable to fetch measurements", e.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export const findRelevantCookies = async (): Promise<{
  ARRAffinity: string;
  JSESSIONID: string;
}> => {
  const cookies = await getAllCookies();

  const ARRAffinity = cookies.find((c) => c.name === "ARRAffinity");
  const JSESSIONID = cookies.find(
    (c) => c.name === "JSESSIONID" && c.path === "/api"
  );

  if (!ARRAffinity || !JSESSIONID) {
    throw new Error("Unable to get required cookies");
  }

  return {
    ARRAffinity: ARRAffinity.value,
    JSESSIONID: JSESSIONID.value,
  };
};
