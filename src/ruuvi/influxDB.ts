import { FieldType, InfluxDB } from "influx";
import { DataFormat5 } from "./types";

const DB_NAME = "ruuvi";
const MEASUREMENT = "measurement";

export const writeMeasurement =
  (client: InfluxDB) =>
  async (data: DataFormat5, ruuviMacAddress: string): Promise<void> => {
    const m = {
      measurement: MEASUREMENT,
      tags: {
        mac: ruuviMacAddress,
      },
      fields: {
        humidity: data.humidity,
        pressure: data.pressure,
        temperature: data.temperature,
      },
      timestamp: new Date().getTime(),
    };

    await client.writePoints([m], {
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
          temperature: FieldType.FLOAT,
          humidity: FieldType.FLOAT,
          pressure: FieldType.FLOAT,
        },
        tags: ["mac"],
      },
    ],
  });

  const names = await client.getDatabaseNames();

  if (!names.includes(DB_NAME)) {
    await client.createDatabase(DB_NAME);
  }

  return client;
};
