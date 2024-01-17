import express from "express";
import ValidatorMiddleware from "../middleware/validator.js";
import VendorController from "../controllers/VendorController.js";
import AuthMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get('/details', AuthMiddleware.authenticateUserType('vendor'), VendorController.getVendor)
router.get('/statistic/:vendorId', ValidatorMiddleware.validateObjectIds('vendorId'), VendorController.vendorStatistics);
router.get('/:vendorId/meals', ValidatorMiddleware.validateObjectIds('vendorId'), VendorController.getVendorMeals)
router.put('/update-business-hour', AuthMiddleware.authenticateUserType('vendor'), 
                                    ValidatorMiddleware.validateRequest(VendorController.validateBusinessHourSchema), VendorController.updateBusinessHour)

export default router;
