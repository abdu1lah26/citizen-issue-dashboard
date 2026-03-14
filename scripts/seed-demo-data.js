import bcrypt from "bcrypt";
import pool from "../config/db.js";

const DEFAULTS = {
    citizens: 40,
    officers: 8,
    issues: 450,
    daysBack: 90,
};

const DEPARTMENT_NAMES = [
    "Sanitation",
    "Roads and Transport",
    "Water Supply",
    "Electricity",
    "Public Health",
    "Parks and Environment",
    "Housing",
    "Public Safety",
    "Drainage",
    "Street Lighting",
    "Animal Control",
];

const ISSUE_TITLES = [
    "Garbage not collected",
    "Pothole on main road",
    "Streetlight not working",
    "Water leakage from pipeline",
    "Open drain overflow",
    "Broken public bench",
    "Illegal dumping hotspot",
    "Sewage backup in lane",
    "Damaged footpath",
    "Traffic signal malfunction",
    "Mosquito breeding area",
    "Stray dog concern",
    "Park maintenance request",
    "Blocked storm drain",
    "Noise complaint",
];

const ISSUE_DESCRIPTIONS = [
    "The issue has persisted for several days and is affecting residents in the area.",
    "This is a recurring civic issue and needs urgent attention from the assigned department.",
    "Multiple neighbors have reported the same problem and requested immediate resolution.",
    "The location is busy and the issue creates risk for pedestrians and motorists.",
    "Please inspect and resolve at the earliest possible time to avoid further escalation.",
];

const PRIORITIES = ["low", "medium", "high", "critical"];

function parseArgs() {
    const args = process.argv.slice(2);
    const values = { ...DEFAULTS };

    for (const arg of args) {
        if (arg.startsWith("--issues=")) values.issues = Number(arg.split("=")[1]);
        if (arg.startsWith("--citizens=")) values.citizens = Number(arg.split("=")[1]);
        if (arg.startsWith("--officers=")) values.officers = Number(arg.split("=")[1]);
        if (arg.startsWith("--daysBack=")) values.daysBack = Number(arg.split("=")[1]);
    }

    return values;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom(arr) {
    return arr[randomInt(0, arr.length - 1)];
}

function randomDateWithinDays(daysBack) {
    const now = Date.now();
    const offsetMs = randomInt(0, daysBack * 24 * 60 * 60 * 1000);
    return new Date(now - offsetMs);
}

function randomGeo() {
    const lat = 19.07 + (Math.random() - 0.5) * 0.45;
    const lng = 72.88 + (Math.random() - 0.5) * 0.45;
    return {
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
    };
}

async function ensureDepartments(client) {
    const existing = await client.query("SELECT id, name FROM departments ORDER BY id ASC");

    if (existing.rows.length > 0) return existing.rows;

    const rows = [];
    for (const name of DEPARTMENT_NAMES) {
        const inserted = await client.query(
            "INSERT INTO departments (name) VALUES ($1) RETURNING id, name",
            [name]
        );
        rows.push(inserted.rows[0]);
    }

    return rows;
}

async function findUserByEmail(client, email) {
    const found = await client.query(
        "SELECT id, full_name, email, role_id FROM users WHERE email = $1 LIMIT 1",
        [email]
    );
    return found.rows[0] || null;
}

async function createUserIfMissing(client, { fullName, email, phone, passwordHash, roleId }) {
    const existing = await findUserByEmail(client, email);
    if (existing) return existing;

    const inserted = await client.query(
        `
      INSERT INTO users (full_name, email, phone, password_hash, role_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, full_name, email, role_id
    `,
        [fullName, email, phone, passwordHash, roleId]
    );

    return inserted.rows[0];
}

async function assignOfficerDepartments(client, officerId, departmentIds) {
    const count = randomInt(1, Math.min(3, departmentIds.length));
    const picked = new Set();

    while (picked.size < count) {
        picked.add(randomFrom(departmentIds));
    }

    for (const departmentId of picked) {
        const exists = await client.query(
            "SELECT 1 FROM user_departments WHERE user_id = $1 AND department_id = $2 LIMIT 1",
            [officerId, departmentId]
        );

        if (exists.rows.length === 0) {
            await client.query(
                "INSERT INTO user_departments (user_id, department_id) VALUES ($1, $2)",
                [officerId, departmentId]
            );
        }
    }
}

async function getEnumLabels(client, enumType, fallbackValues = []) {
    try {
        const result = await client.query(
            `
              SELECT e.enumlabel
              FROM pg_enum e
              JOIN pg_type t
                ON e.enumtypid = t.oid
              WHERE t.typname = $1
              ORDER BY e.enumsortorder
            `,
            [enumType]
        );

        const values = result.rows.map((row) => row.enumlabel);
        return values.length > 0 ? values : fallbackValues;
    } catch {
        return fallbackValues;
    }
}

function pickStatus(statusValues) {
    const submittedLabel = statusValues.includes("submitted")
        ? "submitted"
        : statusValues.includes("pending")
            ? "pending"
            : statusValues[0];

    const inProgressLabel = statusValues.includes("in_progress")
        ? "in_progress"
        : statusValues[0];

    const resolvedLabel = statusValues.includes("resolved")
        ? "resolved"
        : statusValues[statusValues.length - 1];

    const r = Math.random();
    if (r < 0.52) return submittedLabel;
    if (r < 0.82) return inProgressLabel;
    return resolvedLabel;
}

function pickPriority(priorityValues) {
    const lowLabel = priorityValues.includes("low") ? "low" : priorityValues[0];
    const mediumLabel = priorityValues.includes("medium") ? "medium" : priorityValues[0];
    const highLabel = priorityValues.includes("high") ? "high" : priorityValues[priorityValues.length - 1];
    const criticalLabel = priorityValues.includes("critical")
        ? "critical"
        : priorityValues[priorityValues.length - 1];

    const r = Math.random();
    if (r < 0.3) return lowLabel;
    if (r < 0.62) return mediumLabel;
    if (r < 0.87) return highLabel;
    return criticalLabel;
}

async function seed() {
    const { citizens, officers, issues, daysBack } = parseArgs();
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const departments = await ensureDepartments(client);
        const departmentIds = departments.map((d) => d.id);
        const statusValues = await getEnumLabels(client, "issue_status", [
            "submitted",
            "in_progress",
            "resolved",
        ]);
        const priorityValues = await getEnumLabels(client, "issue_priority", PRIORITIES);

        const startStatusLabel = statusValues.includes("submitted")
            ? "submitted"
            : statusValues.includes("pending")
                ? "pending"
                : statusValues[0];
        const inProgressLabel = statusValues.includes("in_progress")
            ? "in_progress"
            : statusValues[0];
        const resolvedLabel = statusValues.includes("resolved")
            ? "resolved"
            : statusValues[statusValues.length - 1];

        const passwordHash = await bcrypt.hash("Password@123", 10);

        const admin = await createUserIfMissing(client, {
            fullName: "Demo Admin",
            email: "admin.demo@civic.local",
            phone: "9000000001",
            passwordHash,
            roleId: 2,
        });

        const officerUsers = [];
        for (let i = 1; i <= officers; i++) {
            const officer = await createUserIfMissing(client, {
                fullName: `Officer ${i}`,
                email: `officer${i}.demo@civic.local`,
                phone: `910000${String(i).padStart(4, "0")}`,
                passwordHash,
                roleId: 3,
            });
            officerUsers.push(officer);
            await assignOfficerDepartments(client, officer.id, departmentIds);
        }

        const citizenUsers = [];
        for (let i = 1; i <= citizens; i++) {
            const citizen = await createUserIfMissing(client, {
                fullName: `Citizen ${i}`,
                email: `citizen${i}.demo@civic.local`,
                phone: `920000${String(i).padStart(4, "0")}`,
                passwordHash,
                roleId: 1,
            });
            citizenUsers.push(citizen);
        }

        let createdIssues = 0;
        let createdHistory = 0;
        let createdAttachments = 0;

        for (let i = 0; i < issues; i++) {
            const citizen = randomFrom(citizenUsers);
            const departmentId = randomFrom(departmentIds);
            const status = pickStatus(statusValues);
            const priority = pickPriority(priorityValues);
            const createdAt = randomDateWithinDays(daysBack);
            const geo = randomGeo();

            let resolvedAt = null;
            if (status === resolvedLabel) {
                const resolveHours = randomInt(6, 180);
                resolvedAt = new Date(createdAt.getTime() + resolveHours * 60 * 60 * 1000);
            }

            const issueInsert = await client.query(
                `
          INSERT INTO issues (
            title,
            description,
            citizen_id,
            department_id,
            latitude,
            longitude,
            address,
            priority,
            status,
            visibility,
            ai_priority,
            ai_department_id,
            ai_confidence,
            ai_reasoning,
            created_at,
            updated_at,
            resolved_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8::issue_priority,
            $9::issue_status,
            $10,
            $11::issue_priority,
            $12,
            $13,
            $14,
            $15,
            $16,
            $17
          )
          RETURNING id
        `,
                [
                    `${randomFrom(ISSUE_TITLES)} #${i + 1}`,
                    randomFrom(ISSUE_DESCRIPTIONS),
                    citizen.id,
                    departmentId,
                    geo.latitude,
                    geo.longitude,
                    `Ward ${randomInt(1, 30)}, Block ${randomInt(1, 15)}`,
                    priority,
                    status,
                    Math.random() < 0.7,
                    priority,
                    departmentId,
                    Number((Math.random() * 0.45 + 0.5).toFixed(2)),
                    "Auto-seeded example reasoning for test dataset.",
                    createdAt,
                    resolvedAt || new Date(),
                    resolvedAt,
                ]
            );

            const issueId = issueInsert.rows[0].id;
            createdIssues++;

            if (status === inProgressLabel || status === resolvedLabel) {
                const officer = randomFrom(officerUsers);
                await client.query(
                    `
            INSERT INTO issue_status_history (issue_id, old_status, new_status, changed_by, remarks)
            VALUES ($1, $2::issue_status, $3::issue_status, $4, $5)
          `,
                    [
                        issueId,
                        startStatusLabel,
                        inProgressLabel,
                        officer.id,
                        "Assigned to officer and work started.",
                    ]
                );
                createdHistory++;
            }

            if (status === resolvedLabel) {
                const officer = randomFrom(officerUsers);
                await client.query(
                    `
            INSERT INTO issue_status_history (issue_id, old_status, new_status, changed_by, remarks)
            VALUES ($1, $2::issue_status, $3::issue_status, $4, $5)
          `,
                    [
                        issueId,
                        inProgressLabel,
                        resolvedLabel,
                        officer.id,
                        "Issue resolved after verification.",
                    ]
                );
                createdHistory++;
            }

            if (Math.random() < 0.35) {
                await client.query(
                    `
            INSERT INTO attachments (issue_id, uploaded_by, file_url, file_type)
            VALUES ($1, $2, $3, $4)
          `,
                    [
                        issueId,
                        citizen.id,
                        `https://picsum.photos/seed/civic-${issueId}/1200/800`,
                        "image/jpeg",
                    ]
                );
                createdAttachments++;
            }
        }

        await client.query("COMMIT");

        console.log("\nSeed complete");
        console.log(`Departments available: ${departments.length}`);
        console.log(`Officers ensured: ${officerUsers.length}`);
        console.log(`Citizens ensured: ${citizenUsers.length}`);
        console.log(`Issues created: ${createdIssues}`);
        console.log(`History events created: ${createdHistory}`);
        console.log(`Attachments created: ${createdAttachments}`);
        console.log("\nDemo credentials:");
        console.log("Admin: admin.demo@civic.local / Password@123");
        console.log("Officer: officer1.demo@civic.local / Password@123");
        console.log("Citizen: citizen1.demo@civic.local / Password@123\n");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Seed failed:", error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seed().catch(() => {
    process.exit(1);
});
