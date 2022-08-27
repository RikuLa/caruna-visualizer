import { FieldType, InfluxDB } from "influx";
import { DataPoint } from "./types";

const DB_NAME = "database";
const MEASUREMENT = "nordpool";

const mapDataToInflux = (data: DataPoint[]) =>
  data.map((d) => {
    return {
      measurement: MEASUREMENT,
      tags: {
        area: d.area,
      },
      fields: {
        price: d.price,
      },
      timestamp: new Date(d.startTime).getTime(),
    };
  });

export const writeMeasurement = async (
  client: InfluxDB,
  data: DataPoint[]
): Promise<void> => {
  await client.writePoints(mapDataToInflux(data), {
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
          price: FieldType.FLOAT,
        },
        tags: ["area"],
      },
    ],
  });

  const names = await client.getDatabaseNames();

  if (!names.includes(DB_NAME)) {
    await client.createDatabase(DB_NAME);
  }

  return client;
};
