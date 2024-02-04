import express from "express";
import AuthMiddleware from "../middleware/auth.js";
import ValidatorMiddleware from "../middleware/validator.js";
import MealCategoryController from "../controllers/MealCategoryController.js";

const router = express.Router();

router.post("/:mealId", AuthMiddleware.authenticateUserType('vendor'), ValidatorMiddleware.validateObjectIds('mealId'),
                         ValidatorMiddleware.validateRequest(MealCategoryController.validateCategory), MealCategoryController.createMealCategory
            );
            
router.put('/:categoryId', AuthMiddleware.authenticateUserType('vendor'), ValidatorMiddleware.validateObjectIds('categoryId'),
                        ValidatorMiddleware.validateRequest(MealCategoryController.validateCategory), MealCategoryController.updateMealCategory)

router.get('/all/:mealId', ValidatorMiddleware.validateObjectIds('mealId'), MealCategoryController.getMealCategories)

router.get('/:categoryId', ValidatorMiddleware.validateObjectIds('categoryId'), MealCategoryController.getCategory)

router.delete("/:categoryId", AuthMiddleware.authenticateUserType('vendor'), ValidatorMiddleware.validateObjectIds('categoryId'), MealCategoryController.deleteCategory);

export default router;
