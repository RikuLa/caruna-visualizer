import axios from "axios";
import { scheduleJob } from "node-schedule";
import { DateTime } from "luxon";
import { DataPoint, NordpoolResponse } from "./types";
import { getInfluxDBClient } from "./influxDB";

const HOURLY_CHART_ID = 10;

const buildApiUrl = () => {
  const tomorrow = DateTime.now().plus({ days: 1 }).toFormat("dd-LL-yyyy");
  return `https://www.nordpoolgroup.com/api/marketdata/chart/${HOURLY_CHART_ID}?currency=EUR&endDate=${tomorrow}`;
};

const getData = async (): Promise<DataPoint[]> => {
  const response = await axios.get<NordpoolResponse>(buildApiUrl());

  return response.data.data.Rows.map((r) => {
    const column = r.Columns.find((c) => c.Name === "FI");
    return {
      area: column.Name,
      startTime: r.StartTime,
      price: Number(column.Value.replace(",", ".")),
    };
  }).filter((dataPoint) => !isNaN(dataPoint.price));
};

const run = async () => {
  const client = await getInfluxDBClient();
  const dataPoints = await getData();
  await client.writeMeasurements(dataPoints);
  console.log("Successfully wrote ", dataPoints.length);
};

const everyDayAtFourInTheAfternoon = "0 16 * * *";

run();

scheduleJob(everyDayAtFourInTheAfternoon, run);
