import express from "express";
import SettingsController from "../controllers/SettingsController.js";
import ValidatorMiddleware from "../middleware/validator.js";
import AuthMiddleWare from "../middleware/auth.js";

const router = express.Router();

router.put('/update-cart-settings', AuthMiddleWare.authenticateUserType('admin'), 
                            ValidatorMiddleware.validateRequest(SettingsController.validateSettings), SettingsController.setCartSettings)

router.post('/create', SettingsController.createSettings)

export default router

