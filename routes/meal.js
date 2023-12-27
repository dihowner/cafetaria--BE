import express from "express";
import AuthMiddleware from "../middleware/auth.js";
import ValidatorMiddleware from "../middleware/validator.js";
import MealController from "../controllers/MealController.js";
import UploadMiddleware from '../middleware/upload.js'
import SubMealController from "../controllers/SubMealController.js";

const router = express.Router();

router.post("/add-meal", AuthMiddleware.authenticateUserType('vendor'), UploadMiddleware.uploadSingleImage('mealImage'), 
                         ValidatorMiddleware.validateRequest(MealController.validateAddMeal), MealController.createMeal
            );
router.delete("/:mealId", ValidatorMiddleware.validateObjectIds('mealId'), AuthMiddleware.authenticateUserType('vendor'), 
                            ValidatorMiddleware.validateRequest(MealController.validateDeleteMeal), MealController.deleteMeal);

router.get('/:mealId', ValidatorMiddleware.validateObjectIds('mealId'), MealController.getMeal)

router.put('/:mealId', ValidatorMiddleware.validateObjectIds('mealId'),
                        AuthMiddleware.authenticateUserType('vendor'), 
                        UploadMiddleware.uploadSingleImage('mealImage'),
                        ValidatorMiddleware.validateRequest(MealController.validateUpdateMeal), MealController.updateMeal)

router.get('/submeal/:mealId', ValidatorMiddleware.validateObjectIds('mealId'), SubMealController.getSubMealByMealId)
export default router;
