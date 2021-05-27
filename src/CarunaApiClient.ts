import axios, { AxiosResponse } from "axios";
import { DateTime } from "luxon";
import {
  Measurement,
  MeteringPoint,
  MeteringPointPayload,
  UserInfo,
} from "./types";

export class CarunaApiClient {
  private readonly API_BASE_URL = "https://energiaseuranta.caruna.fi/api";

  private readonly apiCookie: string;
  private userId: number;
  private meteringPointNumbers: ReadonlyArray<number>;

  constructor({
    ARRAffinity,
    JSESSIONID,
  }: {
    ARRAffinity: string;
    JSESSIONID: string;
  }) {
    this.apiCookie = `JSESSIONID=${JSESSIONID}; ARRAffinity=${ARRAffinity};`;
  }

  private async get(url: string) {
    return axios.get(url, {
      headers: {
        Cookie: this.apiCookie,
      },
    });
  }

  private async setUserId() {
    console.log("Fetching user id");
    const response: AxiosResponse<UserInfo> = await this.get(
      `${this.API_BASE_URL}/users?current`
    );

    this.userId = response.data.username;
    console.log("User id found");
  }

  private async getMeteringPoints() {
    console.log("Fetching metering points");

    const response: AxiosResponse<{ entities: MeteringPoint[] }> =
      await this.get(
        `${this.API_BASE_URL}/customers/${this.userId}/meteringPointInformationWrappers`
      );

    this.meteringPointNumbers = response.data.entities.map(
      (e) => e.meteringPoint.meteringPointNumber
    );
    console.log("Metering points found");
  }

  private buildApiUrl = (userId: number, meteringPointId: number) => {
    const now = DateTime.now()
      .plus({ days: 1 })
      .startOf("second")
      .toISO({ suppressMilliseconds: true });

    return (
      this.API_BASE_URL +
      `/meteringPoints/ELECTRICITY/${meteringPointId}/series?customerNumber=${userId}&endDate=${encodeURIComponent(
        now
      )}&products=EL_ENERGY_CONSUMPTION&resolution=MONTHS_AS_HOURS&startDate=2020-01-01T00:00:00%2B0300`
    );
  };

  private async getMeasurements(
    meteringPointNumber: number
  ): Promise<MeteringPointPayload> {
    console.log("Fetching measurements for: ", meteringPointNumber);

    const response: AxiosResponse<Measurement[]> = await this.get(
      this.buildApiUrl(this.userId, meteringPointNumber)
    );

    console.log("Measurements found for: ", meteringPointNumber);

    return {
      meteringPointId: meteringPointNumber,
      measurements: response.data,
    };
  }

  public async fetchMeasurements(): Promise<Array<MeteringPointPayload>> {
    await this.setUserId();
    await this.getMeteringPoints();

    return Promise.all(
      this.meteringPointNumbers.map((n) => this.getMeasurements(n))
    );
  }
}
