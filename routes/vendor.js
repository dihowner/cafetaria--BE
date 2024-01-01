import express from "express";
import ValidatorMiddleware from "../middleware/validator.js";
import VendorController from "../controllers/VendorController.js";

const router = express.Router();

router.get('/:vendorId', ValidatorMiddleware.validateObjectIds('vendorId'), VendorController.getVendor)
router.get('/statistic/:vendorId', ValidatorMiddleware.validateObjectIds('vendorId'), VendorController.vendorStatistics);
router.get('/:vendorId/meals', ValidatorMiddleware.validateObjectIds('vendorId'), VendorController.getVendorMeals)

export default router;
