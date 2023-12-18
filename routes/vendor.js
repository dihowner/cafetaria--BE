import express from "express";
import ValidatorMiddleware from "../middleware/validator.js";
import VendorController from "../controllers/VendorController.js";

const router = express.Router();

router.get('/:vendorId', ValidatorMiddleware.validateObjectIds('vendorId'), VendorController.getVendor)

export default router;
