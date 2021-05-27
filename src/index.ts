import * as dotenv from "dotenv";
dotenv.config();

import { fetchMeasurements } from "./fetchMeasurements";
import { chunk } from "lodash";
import { getInfluxDBClient, writeMeasurements } from "./influxDB";

const main = async () => {
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
};

main()
  .catch((e) => {
    console.error("Error: ", e.message);
    process.exit(1);
  })
  .then(() => {
    console.log("Successfully wrote measurements to Influx");
    process.exit(0);
  });
