import express from "express";
import AuthMiddleware from "../middleware/auth.js";
import ValidatorMiddleware from "../middleware/validator.js";
import AdminController from "../controllers/AdminController.js";

const router = express.Router();

router.get("/users",  AuthMiddleware.authenticateUserType('admin'), AdminController.getUsers);
            
export default router;