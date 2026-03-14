import express from "express";
import { registerUser, loginUser } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { getUserDepartments, getAllDepartments } from "../models/issue.model.js";

const router = express.Router();

// User registration route
router.post("/register", registerUser);
// User login route
router.post("/login", loginUser);
// Protected route example
router.get("/profile", authenticate, (req, res) => {
    res.json({
        message: "Protected route accessed",
        user: req.user,
    });
});

// Get user's assigned departments (admins get all departments)
router.get("/departments", authenticate, async (req, res) => {
    try {
        // Admins (role 2) get all departments
        if (req.user.role === 2) {
            const departments = await getAllDepartments();
            return res.json({ departments });
        }
        // Officers (role 3) get only assigned departments
        const departments = await getUserDepartments(req.user.id);
        res.json({ departments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Admin-only route example
router.get(
    "/admin-test",
    authenticate,
    authorizeRoles(2), // assuming role_id = 2 is Admin
    (req, res) => {
        res.json({
            message: "Admin route accessed",
        });
    }
);

export default router;