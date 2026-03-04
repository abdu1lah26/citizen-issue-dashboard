import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
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
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
    }
    if (err.message.includes("Invalid file type")) {
        return res.status(400).json({ message: err.message });
    }
    next(err);
});

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