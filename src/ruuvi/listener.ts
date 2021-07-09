// @ts-ignore
import ruuvi from "node-ruuvitag";
import { DataFormat5 } from "./types";
import { getInfluxDBClient, writeMeasurement } from "./influxDB";

const run = async () => {
  const client = await getInfluxDBClient();
  const writer = writeMeasurement(client);

  ruuvi.on(
    "found",
    (tag: {
      id: string;
      on: (eventName: string, handler: (data: DataFormat5) => void) => void;
    }) => {
      console.log("Found RuuviTag, id: " + tag.id);

      tag.on("updated", async (data: DataFormat5) => {
        console.log("Got data from RuuviTag " + data.mac);
        await writer(data, data.mac);
      });
    }
  );

  ruuvi.on("warning", (message: string) => {
    console.error(new Error(message));
  });
};

run();
