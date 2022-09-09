import { FieldType } from "influx";
import { DataPoint } from "./types";
import { InfluxDBClient } from "../common/InfluxDB";

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

const schema = {
  measurement: MEASUREMENT,
  fields: {
    price: FieldType.FLOAT,
  },
  tags: ["area"],
};

export const getInfluxDBClient = (): InfluxDBClient<DataPoint> => {
  return new InfluxDBClient(schema, DB_NAME, mapDataToInflux);
};
