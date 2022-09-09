import { ISchemaOptions, IPoint, InfluxDB } from "influx";

export class InfluxDBClient<T> {
  private client: InfluxDB | null = null;

  constructor(
    private schema: ISchemaOptions,
    private databaseName: string,
    private mapper: (rawPoints: T[]) => IPoint[]
  ) {}

  private async setupDatabase() {
    const client = await new InfluxDB({
      database: this.databaseName,
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 8086,
      schema: [this.schema],
    });

    const names = await client.getDatabaseNames();

    if (!names.includes(this.databaseName)) {
      await client.createDatabase(this.databaseName);
    }

    this.client = client;
  }

  public async writeMeasurements(points: T[]): Promise<void> {
    if (!this.client) {
      await this.setupDatabase();
    }

    await this.client.writePoints(this.mapper(points), {
      database: this.databaseName,
      precision: "ms",
    });
  }
}
