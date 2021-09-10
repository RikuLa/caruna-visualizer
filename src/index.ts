import * as dotenv from "dotenv";
dotenv.config();

import { fetchMeasurements } from "./fetchMeasurements";
import { chunk } from "lodash";
import { getInfluxDBClient, writeMeasurements } from "./influxDB";

const main = async () => {
  try {
    const client = await getInfluxDBClient();

    const writer = writeMeasurements(client);

    const measurements = await fetchMeasurements();

    for (const m of measurements) {
      const batchedMeasurements = chunk(m.measurements, 1000);

      console.log("Batch count: ", batchedMeasurements.length);

      for (const b of batchedMeasurements) {
        try {
          await writer(b, m.meteringPointId);
        } catch (e) {
          console.error("unable to write", e.message);
        }
      }
    }
  } catch (e) {
    console.error("Caught error in Caruna importer", e);
  }
};

setInterval(main, 1000 * 60 * 30);
