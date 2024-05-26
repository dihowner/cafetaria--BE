import express from "express";
import AuthMiddleware from "../middleware/auth.js";
import ValidatorMiddleware from "../middleware/validator.js";
import SubMealController from "../controllers/SubMealController.js";

const router = express.Router();

router.post("/add-new/:mealId", AuthMiddleware.authenticateUserType('vendor'), ValidatorMiddleware.validateObjectIds('mealId'),
                         ValidatorMiddleware.validateRequest(SubMealController.validateAddMeal), SubMealController.createMeal
            );
            
router.put('/:subMealId', AuthMiddleware.authenticateUserType('vendor'), ValidatorMiddleware.validateObjectIds('subMealId'),
                        ValidatorMiddleware.validateRequest(SubMealController.validateUpdateMeal), SubMealController.updateMeal)

router.get('/:subMealId', ValidatorMiddleware.validateObjectIds('subMealId'), SubMealController.getSubMeal);

router.delete("/:subMealId", AuthMiddleware.authenticateUserType('vendor'), ValidatorMiddleware.validateObjectIds('subMealId'),
                                ValidatorMiddleware.validateRequest(SubMealController.validateDeleteMeal), SubMealController.deleteSubMeal);

router.get("/:mealId", SubMealController.getSubMealByMealId)

export default router;
