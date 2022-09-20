import knexFactory, { Knex } from "knex";
import { once } from "./utils";

interface KnexConfig {
  database?: string;
}

const knexConfig = ({ database }: KnexConfig) => ({
  client: "pg", // or 'better-sqlite3'
  connection: {
    host: "postgres",
    port: 5432,
    user: "postgres",
    password: "password",
    charset: "utf8",
    database,
  },
});

const getKnexWriter = (config: KnexConfig) => knexFactory(knexConfig(config));

const ensureDatabaseExists = async (database: string) => {
  try {
    const knex = getKnexWriter({ database });
    await knex.raw("select 1 as alive");
  } catch (e) {
    if (!(e instanceof Error)) throw e;
    if (e.message !== `database "${database}" does not exist`) throw e;

    const knex = getKnexWriter({ database: undefined });
    await knex.raw(`CREATE DATABASE "${database}"`);
    // await knexClient.raw(
    //   `GRANT ALL PRIVILEGES ON DATABASE "${database}" TO "${user}"`
    // )
  }
};

interface GetKnex {
  (database: string): Promise<Knex<any, unknown>>;
}
export const getKnex: GetKnex = once(async (database: string) => {
  await ensureDatabaseExists(database);
  const knex = getKnexWriter({ database });
  await knex.migrate.latest();
  return knex;
});
