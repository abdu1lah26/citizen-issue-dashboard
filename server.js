import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/db.js";
import userRoutes from "./routes/user.routes.js";
import issueRoutes from "./routes/issue.routes.js";
import publicRoutes from "./routes/public.routes.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());


// Routes
app.use("/api/users", userRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/public", publicRoutes);

// Health check route
app.get("/", (req, res) => {
    res.status(200).json({ message: "Citizen Issue Backend Running" });
});

const PORT = process.env.PORT || 5000;

pool.query("SELECT 1")
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Database connection failed:", err);
    });