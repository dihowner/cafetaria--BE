import express from "express";
import AuthMiddleware from "../middleware/auth.js";
import ValidatorMiddleware from "../middleware/validator.js";
import GroceryCategoryController from "../controllers/GroceryCategoryController.js";

const router = express.Router();

router.get('/all', GroceryCategoryController.getCategories)
router.post('/add', AuthMiddleware.authenticateUserType('admin'), ValidatorMiddleware.validateRequest(GroceryCategoryController.validateAdd), GroceryCategoryController.createCategory)
router.put('/:id', AuthMiddleware.authenticateUserType('admin'), ValidatorMiddleware.validateRequest(GroceryCategoryController.validateAdd), GroceryCategoryController.updateCategory)
router.delete('/:id', AuthMiddleware.authenticateUserType('admin'), ValidatorMiddleware.validateObjectIds('id'), GroceryCategoryController.deleteCategory)
router.get('/:id', AuthMiddleware.authenticateUserType('admin'), ValidatorMiddleware.validateObjectIds('id'), GroceryCategoryController.getCategory)

export default router;
