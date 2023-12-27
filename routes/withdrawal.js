import express from "express";
import ValidatorMiddleware from "../middleware/validator.js";
import VendorController from "../controllers/VendorController.js";

const router = express.Router();

router.post('/:vendorId', AuthMiddleware.authenticateUserType('vendor'), ValidatorMiddleware.validateRequest(MealController.validateAddMeal), MealController.createMeal)

export default router;
