import * as dotenv from "dotenv";
dotenv.config();

import axios, { AxiosResponse } from "axios";
import puppeteer, { Page, Browser } from "puppeteer";
import { DateTime } from "luxon";
import { Measurement, MeteringPoint, UserInfo } from "./types";

const BASE_URL = "https://energiaseuranta.caruna.fi";
const MOBILE_TRACKING_URL = BASE_URL + "/mobile/#/tracking";

const buildApiUrl = (userId: number, meteringPointId: number) => {
  const now = DateTime.now()
    .plus({ days: 1 })
    .startOf("second")
    .toISO({ suppressMilliseconds: true });

  console.log("Fetching until", now);

  return (
    BASE_URL +
    `/api/meteringPoints/ELECTRICITY/${meteringPointId}/series?customerNumber=${userId}&endDate=${encodeURIComponent(
      now
    )}&products=EL_ENERGY_CONSUMPTION&resolution=MONTHS_AS_HOURS&startDate=2020-01-01T00:00:00%2B0300`
  );
};

const getCookies = async () => {
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

export const fetchMeasurements = async (): Promise<Array<Measurement>> => {
  const cookies: { name: string; value: string; path: string }[] =
    await getCookies();

  const ARRAffinity = cookies.find((c) => c.name === "ARRAffinity");
  const JSESSIONID = cookies.find(
    (c) => c.name === "JSESSIONID" && c.path === "/api"
  );

  if (!ARRAffinity || !JSESSIONID) {
    throw new Error("Unable to get required cookies");
  }

  const cookie = `JSESSIONID=${JSESSIONID.value}; ARRAffinity=${ARRAffinity.value};`;

  const userInfo: AxiosResponse<UserInfo> = await axios.get(
    "https://energiaseuranta.caruna.fi/api/users?current",
    {
      headers: {
        Cookie: cookie,
      },
    }
  );

  const userId = userInfo.data.username;

  const meteringPointInfo: AxiosResponse<{ entities: MeteringPoint[] }> =
    await axios.get(
      `https://energiaseuranta.caruna.fi/api/customers/${userId}/meteringPointInformationWrappers`,
      {
        headers: {
          Cookie: cookie,
        },
      }
    );

  const meteringPointId =
    meteringPointInfo.data.entities[0].meteringPoint.meteringPointNumber;

  const response = await axios.get(buildApiUrl(userId, meteringPointId), {
    headers: {
      Cookie: cookie,
    },
  });

  return response.data as Measurement[];
};
