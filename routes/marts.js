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

// Mart Categories Route...
router.post('/add-category/:martId', AuthMiddleware.authenticateUserType('vendor'), ValidatorMiddleware.validateObjectIds('martId'),
                                     ValidatorMiddleware.validateRequest(MartCategoryController.validateMart), MartCategoryController.createCategory)

router.put('/update-category/:categoryId', AuthMiddleware.authenticateUserType('vendor'), ValidatorMiddleware.validateObjectIds('categoryId'),
                                     ValidatorMiddleware.validateRequest(MartCategoryController.validateMart), MartCategoryController.updateCategory)

router.get('/mart-category/:martId', ValidatorMiddleware.validateObjectIds('martId'), MartCategoryController.getMartCategories)

router.delete('/:categoryId', AuthMiddleware.authenticateUserType('vendor'), ValidatorMiddleware.validateObjectIds('categoryId'), MartCategoryController.deleteCategory)

export default router;
