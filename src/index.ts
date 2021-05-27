import { FieldType, InfluxDB } from "influx";
import { fetchMeasurements } from "./fetchMeasurements";
import { chunk } from "lodash";
import { Measurement } from "./types";

const DB_NAME = "usage";
const MEASUREMENT = "consumption";

const writeMeasurements =
  (client: InfluxDB) =>
  async (measurements: Measurement[], meteringPointId: number) => {
    const points = measurements
      .filter(({ values }) => !!values["EL_ENERGY_CONSUMPTION#0"])
      .map(({ values, timestamp, year, month, week, day, hour }) => {
        return {
          measurement: MEASUREMENT,
          tags: {
            year: String(year),
            month: String(month),
            week: String(week),
            day: String(day),
            hour: String(hour),
            metering_point_id: String(meteringPointId),
          },
          fields: { value: values["EL_ENERGY_CONSUMPTION#0"].value },
          timestamp: new Date(timestamp).getTime(),
        };
      });

    await client.writePoints(points, {
      database: DB_NAME,
      precision: "ms",
    });
  };

const initDb = async () => {
  return new InfluxDB({
    database: DB_NAME,
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 8086,
    schema: [
      {
        measurement: MEASUREMENT,
        fields: {
          value: FieldType.FLOAT,
        },
        tags: ["hour", "month", "day", "year", "week", "metering_point_id"],
      },
    ],
  });
};

const runDataToDb = async () => {
  const client = await initDb();

  const names = await client.getDatabaseNames();

  if (!names.includes(DB_NAME)) {
    await client.createDatabase(DB_NAME);
  }

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

runDataToDb()
  .catch((e) => {
    console.error("Error: ", e.message);
    process.exit(1);
  })
  .then(() => {
    console.log("Successfully wrote points to Influx");
    process.exit(0);
  });
