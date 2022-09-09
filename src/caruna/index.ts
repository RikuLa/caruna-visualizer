import * as dotenv from "dotenv";
dotenv.config();

import { fetchMeasurements } from "./fetchMeasurements";
import { chunk } from "lodash";
import { getInfluxDBClient } from "./influxDB";

const main = async () => {
  try {
    const client = await getInfluxDBClient();
    const measurements = await fetchMeasurements();

    for (const m of measurements) {
      const batchedMeasurements = chunk(m.measurements, 1000);

      console.log("Batch count: ", batchedMeasurements.length);

      for (const b of batchedMeasurements) {
        try {
          await client.writeMeasurements(b);
        } catch (e) {
          console.error("unable to write", e.message);
        }
      }
    }
  } catch (e) {
    console.error("Caught error in Caruna importer", e);
  }
};

const start = async () => {
  await main();
  setInterval(main, 1000 * 60 * 30);
};

start();
