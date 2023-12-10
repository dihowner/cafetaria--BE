import express from "express";
import { requireLoggedInUser } from "../middleware/auth.js";
import UserController from "../controllers/UserController.js";
import ValidatorMiddleware from "../middleware/validator.js";

const router = express.Router();

router.get("/statistic/:userId", ValidatorMiddleware.validateObjectIds('userId'), UserController.userStatistics);
router.post("/change-password", requireLoggedInUser, ValidatorMiddleware.validateRequestActivity('update_password', UserController.validateUpdateUser), UserController.modifyPassword);

export default router;
