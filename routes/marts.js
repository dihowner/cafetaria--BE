import express from "express";
import AuthMiddleware from "../middleware/auth.js";
import ValidatorMiddleware from "../middleware/validator.js";
import MartController from "../controllers/MartController.js";
import UploadMiddleware from "../middleware/upload.js";
import MartCategoryController from "../controllers/MartCategoryController.js";

const router = express.Router();

router.post('/add', AuthMiddleware.authenticateUserType('vendor'), UploadMiddleware.uploadSingleImage('image', 'uploads/marts/'), 
                    ValidatorMiddleware.validateRequest(MartController.validateMart), MartController.createMart)

router.put('/:martId', AuthMiddleware.authenticateUserType('vendor'), UploadMiddleware.uploadSingleImage('image', 'uploads/marts/'), 
                    ValidatorMiddleware.validateRequest(MartController.validateMart), MartController.updateMart)

router.get('/:martId', ValidatorMiddleware.validateObjectIds('martId'), MartController.getMart)

export default router;
