import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRESQL_URL ||
    process.env.PG_URL;

if (!databaseUrl) {
    throw new Error(
        "Missing database URL. Set one of: DATABASE_URL, POSTGRES_URL, POSTGRESQL_URL, PG_URL"
    );
}

const shouldUseSsl =
    process.env.NODE_ENV === "production" ||
    /render\.com/i.test(databaseUrl);

const poolConfig = {
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    query_timeout: 15000,
    statement_timeout: 15000,
    ...(shouldUseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
};

const pool = new Pool(poolConfig);

pool.on("connect", () => {
    console.log("Connected to PostgreSQL");
});

pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
    if (process.env.NODE_ENV !== "production") {
        process.exit(-1);
    }
});



export default pool;