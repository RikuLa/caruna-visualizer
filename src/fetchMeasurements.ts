import { MeteringPointPayload } from "./types";
import { CarunaApiClient } from "./CarunaApiClient";
import { findRelevantCookies } from "./cookies";

export const fetchMeasurements = async (): Promise<
  Array<MeteringPointPayload>
> => {
  const cookies = await findRelevantCookies();

  const client = new CarunaApiClient(cookies);

  return await client.fetchMeasurements();
};
