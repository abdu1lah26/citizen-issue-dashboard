import express from "express";
import { registerUser, loginUser } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

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