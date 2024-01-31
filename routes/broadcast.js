import express from "express";
import AuthMiddleware from "../middleware/auth.js";
import BroadcastController from "../controllers/BroadcastController.js";

const router = express.Router();

router.post("/send",  AuthMiddleware.authenticateUserType('admin'), BroadcastController.sendBroadcast);
            
export default router;