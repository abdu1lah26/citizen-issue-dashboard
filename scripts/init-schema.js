import pool from "../config/db.js";

const statements = [
    `
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_status') THEN
            CREATE TYPE issue_status AS ENUM ('submitted', 'in_progress', 'resolved');
        END IF;
    END
    $$;
    `,
    `
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_priority') THEN
            CREATE TYPE issue_priority AS ENUM ('low', 'medium', 'high', 'critical');
        END IF;
    END
    $$;
    `,
    `
    CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(180) NOT NULL UNIQUE,
        phone VARCHAR(32),
        password_hash TEXT NOT NULL,
        role_id INTEGER NOT NULL CHECK (role_id IN (1, 2, 3)),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS user_departments (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, department_id)
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        citizen_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        address TEXT,
        priority issue_priority NOT NULL DEFAULT 'medium',
        status issue_status NOT NULL DEFAULT 'submitted',
        visibility BOOLEAN NOT NULL DEFAULT TRUE,
        ai_priority issue_priority,
        ai_department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
        ai_confidence NUMERIC(4, 3),
        ai_reasoning TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMPTZ
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS issue_status_history (
        id SERIAL PRIMARY KEY,
        issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
        old_status issue_status,
        new_status issue_status NOT NULL,
        changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        remarks TEXT,
        changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS attachments (
        id SERIAL PRIMARY KEY,
        issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
        uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        file_url TEXT NOT NULL,
        file_type VARCHAR(120),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    `,
    `
    CREATE INDEX IF NOT EXISTS idx_issues_citizen_id ON issues(citizen_id);
    CREATE INDEX IF NOT EXISTS idx_issues_department_id ON issues(department_id);
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_visibility ON issues(visibility);
    CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_issue_history_issue_id ON issue_status_history(issue_id);
    CREATE INDEX IF NOT EXISTS idx_attachments_issue_id ON attachments(issue_id);
    `,
];

async function initSchema() {
    const client = await pool.connect();

    try {
        for (const statement of statements) {
            await client.query(statement);
        }

        console.log("Schema initialization complete");
    } catch (error) {
        console.error("Schema initialization failed:", error.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

initSchema();
