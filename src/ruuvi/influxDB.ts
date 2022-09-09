import { FieldType, IPoint } from "influx";
import { InfluxDBClient } from "../common/InfluxDB";
import { DataFormat5 } from "./types";

const DB_NAME = "database";
const MEASUREMENT = "ruuvi";

export const writeMeasurement = (data: DataFormat5[]): IPoint[] => {
  return data.map((d) => ({
    measurement: MEASUREMENT,
    tags: {
      mac: d.mac,
    },
    fields: {
      humidity: d.humidity,
      pressure: d.pressure,
      temperature: d.temperature,
    },
    timestamp: new Date().getTime(),
  }));
};

const schema = {
  measurement: MEASUREMENT,
  fields: {
    temperature: FieldType.FLOAT,
    humidity: FieldType.FLOAT,
    pressure: FieldType.FLOAT,
  },
  tags: ["mac"],
};

export const getInfluxDBClient = (): InfluxDBClient<DataFormat5> => {
  return new InfluxDBClient(schema, DB_NAME, writeMeasurement);
};
