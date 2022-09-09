import { FieldType, IPoint } from "influx";
import { Measurement } from "./types";
import { InfluxDBClient } from "../common/InfluxDB";

const DB_NAME = "database";
const MEASUREMENT = "electricity";

const writeMeasurements = (measurements: Measurement[]): IPoint[] => {
  return measurements
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
        },
        fields: { value: values["EL_ENERGY_CONSUMPTION#0"].value },
        timestamp: new Date(timestamp).getTime(),
      };
    });
};

const schema = {
  measurement: MEASUREMENT,
  fields: {
    value: FieldType.FLOAT,
  },
  tags: ["hour", "month", "day", "year", "week", "metering_point_id"],
};

export const getInfluxDBClient = (): InfluxDBClient<Measurement> => {
  return new InfluxDBClient(schema, DB_NAME, writeMeasurements);
};
