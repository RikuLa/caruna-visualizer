export interface Measurement {
  year: number;
  month: number;
  day: number;
  hour: number;
  week: number;
  timestamp: string;
  values: {
    "EL_ENERGY_CONSUMPTION#0"?: {
      value: number;
    };
  };
}

export interface UserInfo {
  username: number;
}

export interface MeteringPoint {
  meteringPoint: {
    meteringPointNumber: number;
  };
}

export interface MeteringPointPayload {
  meteringPointId: number;
  measurements: Measurement[];
}
