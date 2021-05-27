import { FieldType, InfluxDB } from "influx";
import { Measurement } from "./types";

const DB_NAME = "usage";
const MEASUREMENT = "consumption";

export const writeMeasurements =
  (client: InfluxDB) =>
  async (
    measurements: Measurement[],
    meteringPointId: number
  ): Promise<void> => {
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

export const getInfluxDBClient = async (): Promise<InfluxDB> => {
  const client = await new InfluxDB({
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

  const names = await client.getDatabaseNames();

  if (!names.includes(DB_NAME)) {
    await client.createDatabase(DB_NAME);
  }

  return client;
};
