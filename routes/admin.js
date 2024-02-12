import express from "express";
import AuthMiddleware from "../middleware/auth.js";
import AdminController from "../controllers/AdminController.js";
import VendorController from "../controllers/VendorController.js";

const router = express.Router();

router.get("/users",  AuthMiddleware.authenticateUserType('admin'), AdminController.getUsers);
router.get("/vendors",  AuthMiddleware.authenticateUserType('admin'), VendorController.getAllVendor);
            
export default router;