interface Column {
  Name: "FI" | "SE" | "NO"; // And others...
  Value: string;
}

interface Row {
  StartTime: string;
  Columns: Column[];
}

export interface DataPoint {
  area: Column["Name"];
  startTime: string;
  price: number;
}

export interface NordpoolResponse {
  data: {
    Rows: Row[];
  };
}
