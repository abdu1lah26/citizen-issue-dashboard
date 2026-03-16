import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT) || 5433,
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